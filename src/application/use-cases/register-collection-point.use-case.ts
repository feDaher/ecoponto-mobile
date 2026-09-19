import {
  ForbiddenError,
  UnauthenticatedError,
  ValidationError,
  type AppError,
} from '@/core/errors';
import { err, type Result } from '@/core/result';
import type { CollectionPoint } from '@/domain/entities/collection-point';
import { OpeningHours } from '@/domain/entities/opening-hours';
import type { User } from '@/domain/entities/user';
import type {
  CollectionPointRepository,
  NewCollectionPoint,
} from '@/domain/repositories/collection-point.repository';
import { Coordinate } from '@/domain/value-objects/coordinate';
import { Phone } from '@/domain/value-objects/phone';
import { parseCategoryId } from '@/domain/value-objects/waste-category';

import type { UseCase } from './use-case';

export type RegisterCollectionPointInput = {
  readonly user: User | null;
  readonly data: NewCollectionPoint;
};

/**
 * Accreditation of a new point by the collector/cooperative.
 *
 * RB02 — exclusive to the Collector/Cooperative role.
 * RB04 — valid coordinates, otherwise automatic rejection.
 * RB05 — at least one category from the standardized taxonomy.
 * RB06 — at least one day/opening hour.
 * RB03 — the point enters as `pending`; the administrator is the one who publishes.
 *
 * All validation happens **before** the network call: a form error
 * consumes no bandwidth and does not depend on the server being up.
 */
export class RegisterCollectionPointUseCase implements UseCase<
  RegisterCollectionPointInput,
  CollectionPoint
> {
  constructor(private readonly points: CollectionPointRepository) {}

  async execute(input: RegisterCollectionPointInput): Promise<Result<CollectionPoint, AppError>> {
    const { user, data } = input;

    if (!user) {
      return err(
        new UnauthenticatedError('Entre na sua conta de coletor para cadastrar um ponto.'),
      );
    }

    if (!user.can('point:register')) {
      return err(
        new ForbiddenError('Apenas coletores e cooperativas podem cadastrar pontos de coleta.'),
      );
    }

    // RB04
    const coordinate = Coordinate.create(data.latitude, data.longitude);
    if (!coordinate.ok) return coordinate;

    // RB05
    if (data.categories.length === 0) {
      return err(
        new ValidationError(
          'Selecione ao menos uma categoria de resíduo.',
          undefined,
          'categories',
        ),
      );
    }

    for (const category of data.categories) {
      const valid = parseCategoryId(category);
      if (!valid.ok) return valid;
    }

    // RB06
    if (data.openingHours.length === 0) {
      return err(
        new ValidationError(
          'Informe ao menos um horário de funcionamento.',
          undefined,
          'openingHours',
        ),
      );
    }

    for (const [index, hours] of data.openingHours.entries()) {
      const valid = OpeningHours.create({ id: `tmp-${index}`, ...hours });
      if (!valid.ok) return valid;
    }

    // RB08 — the number is only accepted in a valid format; displaying it depends on consent.
    if (data.whatsAppContact) {
      const phone = Phone.create(data.whatsAppContact);
      if (!phone.ok) return phone;
    }

    return this.points.register(data, user.id);
  }
}
