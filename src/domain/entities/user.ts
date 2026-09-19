import { ValidationError } from '@/core/errors';
import { err, ok, type Result } from '@/core/result';

import type { Email } from '../value-objects/email';
import type { Phone } from '../value-objects/phone';
import { canPerform, type Permission, type UserRole } from '../value-objects/user-role';

export type UserProps = {
  id: string;
  name: string;
  email: Email;
  phone: Phone;
  city: string;
  role: UserRole;
  registeredAt: Date;
  /** RB09 — accumulated gamification balance. */
  points?: number;
  avatarUrl?: string | null;
};

/**
 * Authenticated system user.
 *
 * RB01 — sign-up requires **valid** name, e-mail, phone and city; the
 * `Email` and `Phone` value objects guarantee this before the entity exists.
 * RB02 — the role determines exclusive, non-interchangeable permissions.
 */
export class User {
  readonly id: string;
  readonly name: string;
  readonly email: Email;
  readonly phone: Phone;
  readonly city: string;
  readonly role: UserRole;
  readonly registeredAt: Date;
  readonly points: number;
  readonly avatarUrl: string | null;

  private constructor(props: Required<UserProps>) {
    this.id = props.id;
    this.name = props.name;
    this.email = props.email;
    this.phone = props.phone;
    this.city = props.city;
    this.role = props.role;
    this.registeredAt = props.registeredAt;
    this.points = props.points;
    this.avatarUrl = props.avatarUrl;
    Object.freeze(this);
  }

  static create(props: UserProps): Result<User, ValidationError> {
    const name = props.name?.trim() ?? '';

    if (name.length < 3) {
      return err(new ValidationError('Informe seu nome completo.', undefined, 'name'));
    }

    if (!props.city?.trim()) {
      return err(new ValidationError('Informe sua cidade.', undefined, 'city'));
    }

    const points = props.points ?? 0;
    if (points < 0) {
      return err(new ValidationError('Saldo de pontos inválido.', undefined, 'points'));
    }

    return ok(
      new User({
        ...props,
        name,
        city: props.city.trim(),
        points,
        avatarUrl: props.avatarUrl ?? null,
      }),
    );
  }

  /** RB02 — permission check centralized in the role matrix. */
  can(permission: Permission): boolean {
    return canPerform(this.role, permission);
  }

  get firstName(): string {
    return this.name.split(' ')[0];
  }

  get initials(): string {
    const parts = this.name.split(' ').filter(Boolean);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '';
    return `${first}${last}`.toUpperCase();
  }

  withPoints(points: number): Result<User, ValidationError> {
    return User.create({ ...this, points });
  }
}
