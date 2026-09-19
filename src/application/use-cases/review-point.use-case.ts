import { ForbiddenError, UnauthenticatedError, type AppError } from '@/core/errors';
import { err, type Result } from '@/core/result';
import type { Review } from '@/domain/entities/review';
import type { User } from '@/domain/entities/user';
import type { ReviewRepository } from '@/domain/repositories/review.repository';

import type { UseCase } from './use-case';

export type ReviewPointInput = {
  readonly user: User | null;
  readonly collectionPointId: string;
  readonly rating: number;
  readonly comment?: string;
};

/**
 * RB12 — Review and comment system for collection points.
 * "The system must allow **authenticated** users to review the points."
 * Later moderation belongs to the administrator (review status).
 */
export class ReviewPointUseCase implements UseCase<ReviewPointInput, Review> {
  constructor(private readonly reviews: ReviewRepository) {}

  async execute(input: ReviewPointInput): Promise<Result<Review, AppError>> {
    const { user, collectionPointId, rating, comment } = input;

    if (!user) {
      return err(new UnauthenticatedError('Entre na sua conta para avaliar este ponto.'));
    }

    if (!user.can('review:publish')) {
      return err(new ForbiddenError('Seu perfil não pode publicar avaliações.'));
    }

    return this.reviews.publish({ collectionPointId, rating, comment }, user.id);
  }
}
