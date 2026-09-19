import type { AppError } from '@/core/errors';
import type { Result } from '@/core/result';

import type { Review } from '../entities/review';

export type NewReview = {
  readonly collectionPointId: string;
  readonly rating: number;
  readonly comment?: string;
};

/** RB12 — reviews and comments on collection points. */
export interface ReviewRepository {
  /** Only reviews with status `published`. */
  listByPoint(collectionPointId: string): Promise<Result<Review[], AppError>>;

  publish(data: NewReview, citizenId: string): Promise<Result<Review, AppError>>;
}
