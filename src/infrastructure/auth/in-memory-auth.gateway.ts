import { EmailAlreadyInUseError, InvalidCredentialsError, type AppError } from '@/core/errors';
import { createId } from '@/core/id';
import { logger } from '@/core/logger';
import { err, ok, type Result } from '@/core/result';
import type { AuthGateway, SignInCredentials, SignUpData } from '@/application/ports/auth.gateway';
import type { User } from '@/domain/entities/user';

import { userDtoSchema, type UserDtoInput } from '../dto/api.schemas';
import { userFromDto } from '../mappers/user.mapper';
import { simulateLatency } from '../repositories/in-memory/latency';
import { DEMO_ADMIN, DEMO_COLLECTOR, DEMO_USER } from '../seed/demo-data';
import { secureStorage, STORAGE_KEYS, type KeyValueStorage } from '../storage/secure-storage';

/** Single password for the demo accounts. */
export const DEMO_PASSWORD = 'ecoponto123';

/**
 * Local authentication for development and presentation.
 *
 * **This is not security**: the password is compared in plain text in memory,
 * without hashing, without a server. It exists to allow walking through the
 * authenticated flows (RB01, RB02, RB09, RB12) on Expo Go while Firebase Auth
 * and the API are not configured. In production, `env.authProvider` selects Firebase.
 */
export class InMemoryAuthGateway implements AuthGateway {
  private readonly accounts: UserDtoInput[];

  constructor(private readonly storage: KeyValueStorage = secureStorage) {
    this.accounts = [DEMO_USER, DEMO_COLLECTOR, DEMO_ADMIN];
  }

  async currentSession(): Promise<Result<User | null, AppError>> {
    const raw = await this.storage.get(STORAGE_KEYS.session);
    if (!raw) return ok(null);

    try {
      const dto = userDtoSchema.parse(JSON.parse(raw));
      const user = userFromDto(dto);
      return user.ok ? ok(user.value) : ok(null);
    } catch (cause) {
      logger.warn('Sessão persistida inválida; limpando.', { cause: String(cause) });
      await this.storage.remove(STORAGE_KEYS.session);
      return ok(null);
    }
  }

  async signIn(credentials: SignInCredentials): Promise<Result<User, AppError>> {
    await simulateLatency();

    const account = this.accounts.find(
      (candidate) => candidate.email.toLowerCase() === credentials.email.toLowerCase(),
    );

    if (!account || credentials.password !== DEMO_PASSWORD) {
      return err(new InvalidCredentialsError());
    }

    return this.persist(account);
  }

  async signUp(data: SignUpData): Promise<Result<User, AppError>> {
    await simulateLatency();

    const alreadyExists = this.accounts.some(
      (account) => account.email.toLowerCase() === data.email.toLowerCase(),
    );
    if (alreadyExists) return err(new EmailAlreadyInUseError());

    const account: UserDtoInput = {
      id: createId('user'),
      name: data.name,
      email: data.email,
      phone: data.phone,
      city: data.city,
      role: data.role,
      registeredAt: new Date().toISOString(),
      points: 0,
      avatarUrl: null,
    };

    this.accounts.push(account);
    return this.persist(account);
  }

  async signOut(): Promise<Result<void, AppError>> {
    await this.storage.remove(STORAGE_KEYS.session);
    return ok();
  }

  async getToken(): Promise<string | null> {
    // There is no JWT in local mode: authenticated requests are local too.
    return null;
  }

  private async persist(dto: UserDtoInput): Promise<Result<User, AppError>> {
    const user = userFromDto(userDtoSchema.parse(dto));
    if (!user.ok) return user;

    await this.storage.set(STORAGE_KEYS.session, JSON.stringify(dto));
    return ok(user.value);
  }
}
