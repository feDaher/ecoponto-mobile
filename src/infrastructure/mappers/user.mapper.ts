import { ContractMismatchError, type AppError } from '@/core/errors';
import { err, ok, type Result } from '@/core/result';
import { User } from '@/domain/entities/user';
import { Email } from '@/domain/value-objects/email';
import { Phone } from '@/domain/value-objects/phone';

import type { UserDto } from '../dto/api.schemas';

export function userFromDto(dto: UserDto): Result<User, AppError> {
  const email = Email.create(dto.email);
  if (!email.ok) return err(new ContractMismatchError(email.error));

  const phone = Phone.create(dto.phone);
  if (!phone.ok) return err(new ContractMismatchError(phone.error));

  const user = User.create({
    id: dto.id,
    name: dto.name,
    email: email.value,
    phone: phone.value,
    city: dto.city,
    role: dto.role,
    registeredAt: dto.registeredAt,
    points: dto.points ?? 0,
    avatarUrl: dto.avatarUrl ?? null,
  });

  if (!user.ok) return err(new ContractMismatchError(user.error));
  return ok(user.value);
}
