import { ValidationError, type AppError } from '@/core/errors';
import { err, type Result } from '@/core/result';
import type { User } from '@/domain/entities/user';
import { Email } from '@/domain/value-objects/email';

import type { AuthGateway, SignInCredentials } from '../ports/auth.gateway';
import type { UseCase } from './use-case';

/** Sign-in (section 8.1 — Firebase Auth + JWT). */
export class AuthenticateUserUseCase implements UseCase<SignInCredentials, User> {
  constructor(private readonly auth: AuthGateway) {}

  async execute(input: SignInCredentials): Promise<Result<User, AppError>> {
    const email = Email.create(input.email);
    if (!email.ok) return email;

    if (!input.password) {
      return err(new ValidationError('Informe sua senha.', undefined, 'password'));
    }

    return this.auth.signIn({ email: email.value.value, password: input.password });
  }
}
