import { ValidationError } from '@/core/errors';
import { err, ok, type Result } from '@/core/result';

// Deliberately permissive: strong syntactic e-mail validation is impossible.
// The real confirmation is the e-mail verification flow in Firebase Auth.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Normalized e-mail (lowercase, no spaces). RB01 — valid data on sign-up. */
export class Email {
  private constructor(readonly value: string) {
    Object.freeze(this);
  }

  static create(input: unknown): Result<Email, ValidationError> {
    if (typeof input !== 'string' || input.trim() === '') {
      return err(new ValidationError('Informe seu e-mail.', undefined, 'email'));
    }

    const normalized = input.trim().toLowerCase();

    if (!EMAIL_PATTERN.test(normalized)) {
      return err(new ValidationError('E-mail inválido.', undefined, 'email'));
    }

    return ok(new Email(normalized));
  }

  /** Masked version for logging/display — LGPD. */
  get masked(): string {
    const [user, domain] = this.value.split('@');
    const visible = user.slice(0, 2);
    return `${visible}${'*'.repeat(Math.max(user.length - 2, 1))}@${domain}`;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  toJSON(): string {
    return this.value;
  }
}
