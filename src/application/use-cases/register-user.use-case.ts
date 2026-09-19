import { ValidationError, type AppError } from '@/core/errors';
import { err, type Result } from '@/core/result';
import type { User } from '@/domain/entities/user';
import { Email } from '@/domain/value-objects/email';
import { Phone } from '@/domain/value-objects/phone';
import { parseRole } from '@/domain/value-objects/user-role';

import type { AuthGateway, SignUpData } from '../ports/auth.gateway';
import type { UseCase } from './use-case';

/** Minimum length also required by Firebase Auth. */
export const MIN_PASSWORD_LENGTH = 8;

/**
 * RB01 — Sign-up required for active interactions.
 * "Every user must sign up with valid data (name, e-mail,
 * phone and city)."
 *
 * Validation runs on the client before the network; the server re-validates —
 * the client is a UX convenience, never the security boundary.
 */
export class RegisterUserUseCase implements UseCase<SignUpData, User> {
  constructor(private readonly auth: AuthGateway) {}

  async execute(input: SignUpData): Promise<Result<User, AppError>> {
    if (!input.name?.trim() || input.name.trim().length < 3) {
      return err(new ValidationError('Informe seu nome completo.', undefined, 'name'));
    }

    const email = Email.create(input.email);
    if (!email.ok) return email;

    const phone = Phone.create(input.phone);
    if (!phone.ok) return phone;

    if (!input.city?.trim()) {
      return err(new ValidationError('Informe sua cidade.', undefined, 'city'));
    }

    if (!input.password || input.password.length < MIN_PASSWORD_LENGTH) {
      return err(
        new ValidationError(
          `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`,
          undefined,
          'password',
        ),
      );
    }

    const role = parseRole(input.role);
    if (!role.ok) return role;

    return this.auth.signUp({
      name: input.name.trim(),
      email: email.value.value,
      phone: phone.value.digits,
      city: input.city.trim(),
      password: input.password,
      role: role.value,
    });
  }
}
