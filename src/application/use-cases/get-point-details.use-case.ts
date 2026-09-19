import type { AppError } from '@/core/errors';
import { ok, type Result } from '@/core/result';
import type { CollectionPoint } from '@/domain/entities/collection-point';
import { calculateAverageRating, type Review } from '@/domain/entities/review';
import type { CollectionPointRepository } from '@/domain/repositories/collection-point.repository';
import type { ReviewRepository } from '@/domain/repositories/review.repository';
import type { Coordinate } from '@/domain/value-objects/coordinate';

import type { UseCase } from './use-case';

export type PointDetails = {
  readonly point: CollectionPoint;
  readonly reviews: readonly Review[];
  readonly averageRating: number | null;
  readonly distanceKm: number | null;
  readonly isOpenNow: boolean;
  readonly isInfoOutdated: boolean;
  readonly daysSinceUpdate: number;
};

export type GetPointDetailsInput = {
  readonly id: string;
  readonly origin?: Coordinate | null;
  readonly now?: Date;
};

/**
 * Full point page (RB01 — public, no sign-in).
 *
 * Reviews are a secondary resource: if listing them fails, the page is
 * still shown without them. Failing the whole screen because of comments
 * would be worse for the user than showing the essentials.
 */
export class GetPointDetailsUseCase implements UseCase<GetPointDetailsInput, PointDetails> {
  constructor(
    private readonly points: CollectionPointRepository,
    private readonly reviews: ReviewRepository,
  ) {}

  async execute(input: GetPointDetailsInput): Promise<Result<PointDetails, AppError>> {
    const now = input.now ?? new Date();

    const result = await this.points.getById(input.id);
    if (!result.ok) return result;

    const point = result.value;
    const reviewsResult = await this.reviews.listByPoint(input.id);
    const reviews = reviewsResult.ok
      ? reviewsResult.value.filter((review) => review.isPubliclyVisible)
      : [];

    return ok({
      point,
      reviews,
      averageRating: calculateAverageRating(reviews) ?? point.averageRating,
      distanceKm: input.origin ? point.distanceKmFrom(input.origin) : null,
      isOpenNow: point.isOpenAt(now),
      isInfoOutdated: point.isInfoOutdated(now),
      daysSinceUpdate: point.daysSinceUpdate(now),
    });
  }
}
