import type { AppError } from '@/core/errors';
import type { Result } from '@/core/result';
import type { User } from '@/domain/entities/user';

import type { AuthGateway } from '../ports/auth.gateway';
import type { NoInputUseCase } from './use-case';

/** Restores the session persisted in secure storage when the app opens. */
export class RestoreSessionUseCase implements NoInputUseCase<User | null> {
  constructor(private readonly auth: AuthGateway) {}

  execute(): Promise<Result<User | null, AppError>> {
    return this.auth.currentSession();
  }
}

export class EndSessionUseCase implements NoInputUseCase<void> {
  constructor(private readonly auth: AuthGateway) {}

  execute(): Promise<Result<void, AppError>> {
    return this.auth.signOut();
  }
}
