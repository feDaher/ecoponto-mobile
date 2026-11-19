import type { AuthGateway, SignInCredentials, SignUpData } from '@/application/ports/auth.gateway';
import {
  EmailAlreadyInUseError,
  ForbiddenError,
  InvalidCredentialsError,
  ServerError,
  UnauthenticatedError,
  ValidationError,
  type AppError,
} from '@/core/errors';
import { logger } from '@/core/logger';
import { err, ok, type Result } from '@/core/result';
import type { User } from '@/domain/entities/user';

import { API_ROLE_BY_ROLE } from '../dto/api-enums';
import {
  apiDisposalSummarySchema,
  apiLoginResponseSchema,
  apiSessionTokensSchema,
  apiUserDtoSchema,
  userDtoSchema,
  type UserDto,
} from '../dto/api.schemas';
import type { HttpClient } from '../http/http-client';
import { userFromDto } from '../mappers/user.mapper';
import { secureStorage, STORAGE_KEYS, type KeyValueStorage } from '../storage/secure-storage';

type StoredTokens = {
  readonly idToken: string;
  readonly refreshToken: string;
  /** Epoch ms when the ID token stops being accepted. */
  readonly expiresAt: number;
};

/** Renew a bit before the deadline, so a request never leaves with a token about to expire. */
const REFRESH_MARGIN_MS = 60_000;

/**
 * Authentication through ecoponto-api (sections 6.6 and 8.1 of the specification).
 *
 * Firebase Authentication is still the identity provider, but **only the API
 * talks to it**: `POST /auth/login` exchanges e-mail and password for a
 * Firebase ID token, which then goes as `Authorization: Bearer` on protected
 * routes. The app holds no Firebase key or SDK.
 *
 *  - ID tokens last one hour: `getToken` renews them through `POST /auth/refresh`
 *    shortly before they expire. A refresh refused by the API (expired or
 *    revoked session, blocked user) ends the session.
 *  - Tokens and the profile live in secure storage (Keychain / Keystore).
 *  - RB09: points are not part of the API user; they come from the citizen's
 *    confirmed disposals (`GET /disposals/me/summary`).
 */
export class HttpAuthGateway implements AuthGateway {
  private tokens: StoredTokens | null = null;
  private tokensLoaded = false;
  private refreshing: Promise<StoredTokens | null> | null = null;

  constructor(
    private readonly http: HttpClient,
    private readonly storage: KeyValueStorage = secureStorage,
  ) {}

  async currentSession(): Promise<Result<User | null, AppError>> {
    const tokens = await this.loadTokens();
    if (!tokens) return ok(null);

    const profile = await this.http.request({
      path: '/auth/me',
      authenticated: true,
      schema: apiUserDtoSchema,
    });

    if (!profile.ok) {
      // Session refused by the API: back to guest. Anything else (no network,
      // server down) keeps the last known profile instead of logging the user out.
      if (profile.error instanceof UnauthenticatedError) {
        await this.clear();
        return ok(null);
      }

      logger.warn('Perfil indisponível; usando a sessão salva', { code: profile.error.code });
      return this.storedProfile();
    }

    return this.completeSession(profile.value);
  }

  async signIn(credentials: SignInCredentials): Promise<Result<User, AppError>> {
    const response = await this.http.request({
      path: '/auth/login',
      method: 'POST',
      schema: apiLoginResponseSchema,
      body: { email: credentials.email.trim(), password: credentials.password },
    });

    if (!response.ok) return err(translateSignInError(response.error));

    const { idToken, refreshToken, expiresIn, user } = response.value;
    await this.saveTokens({ idToken, refreshToken, expiresAt: expiresAtFrom(expiresIn) });

    return this.completeSession(user);
  }

  async signUp(data: SignUpData): Promise<Result<User, AppError>> {
    // Self-registration creates citizens and collectors only (admins come from the seed).
    const role = data.role === 'admin' ? 'citizen' : data.role;

    const response = await this.http.request({
      path: '/auth/register',
      method: 'POST',
      body: {
        name: data.name.trim(),
        email: data.email.trim(),
        password: data.password,
        phone: data.phone,
        city: data.city.trim(),
        role: API_ROLE_BY_ROLE[role],
      },
    });

    if (!response.ok) return err(translateSignUpError(response.error));

    // The API creates the account without opening a session.
    return this.signIn({ email: data.email, password: data.password });
  }

  async signOut(): Promise<Result<void, AppError>> {
    // There is no logout route: the tokens are simply discarded on the device.
    await this.clear();
    return ok();
  }

  async getToken(): Promise<string | null> {
    const tokens = await this.loadTokens();
    if (!tokens) return null;

    if (Date.now() < tokens.expiresAt - REFRESH_MARGIN_MS) return tokens.idToken;

    // Concurrent requests share the same renewal instead of each starting one.
    this.refreshing ??= this.refresh(tokens).finally(() => {
      this.refreshing = null;
    });

    const renewed = await this.refreshing;
    return renewed?.idToken ?? null;
  }

  private async refresh(current: StoredTokens): Promise<StoredTokens | null> {
    const response = await this.http.request({
      path: '/auth/refresh',
      method: 'POST',
      schema: apiSessionTokensSchema,
      body: { refreshToken: current.refreshToken },
    });

    if (response.ok) {
      const { idToken, refreshToken, expiresIn } = response.value;
      const renewed = { idToken, refreshToken, expiresAt: expiresAtFrom(expiresIn) };
      await this.saveTokens(renewed);
      return renewed;
    }

    if (
      response.error instanceof UnauthenticatedError ||
      response.error instanceof ForbiddenError
    ) {
      logger.info('Sessão encerrada pela API; é preciso entrar de novo.');
      await this.clear();
      return null;
    }

    // Network or server trouble: keep the session and try again on the next request.
    logger.warn('Falha ao renovar o token', { code: response.error.code });
    return current;
  }

  /** API profile + confirmed points → domain user, persisted for the next launch. */
  private async completeSession(profile: UserDto): Promise<Result<User, AppError>> {
    const points = profile.role === 'citizen' ? await this.loadPoints() : 0;
    const dto: UserDto = { ...profile, points };

    const user = userFromDto(dto);
    if (!user.ok) return user;

    await this.storage.set(STORAGE_KEYS.session, JSON.stringify(dto));
    return ok(user.value);
  }

  private async loadPoints(): Promise<number> {
    const summary = await this.http.request({
      path: '/disposals/me/summary',
      authenticated: true,
      schema: apiDisposalSummarySchema,
    });

    if (summary.ok) return summary.value.totalPoints;

    logger.warn('Pontos indisponíveis no login', { code: summary.error.code });
    return 0;
  }

  private async storedProfile(): Promise<Result<User | null, AppError>> {
    const raw = await this.storage.get(STORAGE_KEYS.session);
    if (!raw) return ok(null);

    try {
      const user = userFromDto(userDtoSchema.parse(JSON.parse(raw)));
      return user.ok ? ok(user.value) : ok(null);
    } catch (cause) {
      logger.warn('Sessão persistida inválida; limpando.', { cause: String(cause) });
      await this.clear();
      return ok(null);
    }
  }

  private async loadTokens(): Promise<StoredTokens | null> {
    if (this.tokensLoaded) return this.tokens;

    const raw = await this.storage.get(STORAGE_KEYS.token);
    this.tokens = raw ? parseTokens(raw) : null;
    this.tokensLoaded = true;
    return this.tokens;
  }

  private async saveTokens(tokens: StoredTokens): Promise<void> {
    this.tokens = tokens;
    this.tokensLoaded = true;
    await this.storage.set(STORAGE_KEYS.token, JSON.stringify(tokens));
  }

  private async clear(): Promise<void> {
    this.tokens = null;
    this.tokensLoaded = true;
    await this.storage.remove(STORAGE_KEYS.token);
    await this.storage.remove(STORAGE_KEYS.session);
  }
}

function expiresAtFrom(expiresInSeconds: number): number {
  // Firebase issues one-hour tokens; a missing value falls back to that.
  const seconds =
    Number.isFinite(expiresInSeconds) && expiresInSeconds > 0 ? expiresInSeconds : 3600;
  return Date.now() + seconds * 1000;
}

function parseTokens(raw: string): StoredTokens | null {
  try {
    const value = JSON.parse(raw) as Partial<StoredTokens>;
    if (
      typeof value.idToken === 'string' &&
      typeof value.refreshToken === 'string' &&
      typeof value.expiresAt === 'number'
    ) {
      return {
        idToken: value.idToken,
        refreshToken: value.refreshToken,
        expiresAt: value.expiresAt,
      };
    }
  } catch {
    // Falls through: a corrupted entry is the same as no session.
  }
  return null;
}

function translateSignInError(error: AppError): AppError {
  if (error instanceof UnauthenticatedError || error instanceof ValidationError) {
    return new InvalidCredentialsError();
  }
  if (error instanceof ForbiddenError) {
    return new ForbiddenError('Esta conta está bloqueada. Fale com a administração do EcoPonto.');
  }
  if (error instanceof ServerError && error.status === 429) {
    return new InvalidCredentialsError(
      'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
    );
  }
  return error;
}

function translateSignUpError(error: AppError): AppError {
  if (error instanceof ServerError && error.status === 409) return new EmailAlreadyInUseError();
  if (error instanceof ServerError && error.status === 429) {
    return new ValidationError('Muitos cadastros a partir desta rede. Tente novamente mais tarde.');
  }
  if (error instanceof ValidationError) {
    return new ValidationError(
      'Confira os dados: nome, e-mail válido, senha com 6 ou mais caracteres, telefone e cidade.',
    );
  }
  return error;
}
