import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getReactNativePersistence,
  initializeAuth,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
} from 'firebase/auth';

import type { AuthGateway, SignInCredentials, SignUpData } from '@/application/ports/auth.gateway';
import {
  EmailAlreadyInUseError,
  InvalidCredentialsError,
  UnexpectedError,
  type AppError,
} from '@/core/errors';
import { env } from '@/core/env';
import { logger } from '@/core/logger';
import { err, ok, type Result } from '@/core/result';
import type { User } from '@/domain/entities/user';

import { userDtoSchema } from '../dto/api.schemas';
import type { HttpClient } from '../http/http-client';
import { userFromDto } from '../mappers/user.mapper';

/**
 * Authentication with Firebase Authentication (sections 6.6 and 8.1 of the specification).
 *
 * Split of responsibilities, per the C4 architecture:
 *  - **Firebase Auth** stores credentials and issues the JWT;
 *  - **REST API + MySQL** store the profile (`role`, city, phone,
 *    points) — the ERD's `USUARIO`.
 *
 * That is why this adapter always completes sign-in with `GET /users/me`:
 * without the profile there is no way to apply RB02 (role-based permissions).
 *
 * Works on Expo Go because it uses the Firebase JavaScript SDK
 * (`@react-native-firebase` would require a development build).
 */
export class FirebaseAuthGateway implements AuthGateway {
  private readonly auth: Auth;

  constructor(private readonly http: HttpClient) {
    this.auth = createAuth();
  }

  async currentSession(): Promise<Result<User | null, AppError>> {
    const firebaseUser = await waitForInitialUser(this.auth);
    if (!firebaseUser) return ok(null);

    const profile = await this.loadProfile();
    if (!profile.ok) {
      // Live token but profile unavailable: we treat the user as a guest instead
      // of guessing permissions.
      logger.warn('Sessão Firebase sem perfil na API', { code: profile.error.code });
      return ok(null);
    }

    return ok(profile.value);
  }

  async signIn(credentials: SignInCredentials): Promise<Result<User, AppError>> {
    try {
      await signInWithEmailAndPassword(this.auth, credentials.email, credentials.password);
    } catch (cause) {
      return err(translateFirebaseError(cause));
    }

    return this.loadProfile();
  }

  async signUp(data: SignUpData): Promise<Result<User, AppError>> {
    try {
      await createUserWithEmailAndPassword(this.auth, data.email, data.password);
    } catch (cause) {
      return err(translateFirebaseError(cause));
    }

    // The `USUARIO` record (MySQL) is created by the API, which validates the
    // freshly issued JWT and links the Firebase `uid` to the profile.
    const response = await this.http.request({
      path: '/users',
      method: 'POST',
      authenticated: true,
      schema: userDtoSchema,
      body: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        city: data.city,
        role: data.role,
      },
    });

    if (!response.ok) return response;
    return userFromDto(response.value);
  }

  async signOut(): Promise<Result<void, AppError>> {
    try {
      await signOut(this.auth);
      return ok();
    } catch (cause) {
      logger.warn('Falha ao encerrar sessão no Firebase', { cause: String(cause) });
      return err(new UnexpectedError(cause));
    }
  }

  async getToken(): Promise<string | null> {
    try {
      return (await this.auth.currentUser?.getIdToken()) ?? null;
    } catch (cause) {
      logger.warn('Falha ao obter token do Firebase', { cause: String(cause) });
      return null;
    }
  }

  private async loadProfile(): Promise<Result<User, AppError>> {
    const response = await this.http.request({
      path: '/users/me',
      authenticated: true,
      schema: userDtoSchema,
    });

    if (!response.ok) return response;
    return userFromDto(response.value);
  }
}

function createAuth(): Auth {
  const app: FirebaseApp = getApps().length
    ? getApp()
    : initializeApp({
        apiKey: env.firebaseApiKey,
        authDomain: env.firebaseAuthDomain,
        projectId: env.firebaseProjectId,
        appId: env.firebaseAppId,
      });

  // `initializeAuth` with AsyncStorage persistence is the supported path in
  // React Native; `getAuth` would use memory and drop the session on every reload.
  return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
}

/**
 * `onAuthStateChanged` fires once with the state restored from storage.
 * Without waiting for it, `currentUser` is `null` right after boot and the app
 * would send a signed-in user to the sign-in screen.
 */
function waitForInitialUser(auth: Auth): Promise<unknown> {
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

const FIREBASE_ERRORS: Record<string, () => AppError> = {
  'auth/invalid-credential': () => new InvalidCredentialsError(),
  'auth/invalid-email': () => new InvalidCredentialsError('E-mail inválido.'),
  'auth/user-not-found': () => new InvalidCredentialsError(),
  'auth/wrong-password': () => new InvalidCredentialsError(),
  'auth/too-many-requests': () =>
    new InvalidCredentialsError('Muitas tentativas. Aguarde alguns minutos e tente novamente.'),
  'auth/email-already-in-use': () => new EmailAlreadyInUseError(),
};

function translateFirebaseError(cause: unknown): AppError {
  const code =
    typeof cause === 'object' && cause !== null && 'code' in cause
      ? String((cause as { code: unknown }).code)
      : '';

  const factory = FIREBASE_ERRORS[code];
  if (factory) return factory();

  logger.error('Erro não mapeado do Firebase Auth', { code });
  return new UnexpectedError(cause);
}
