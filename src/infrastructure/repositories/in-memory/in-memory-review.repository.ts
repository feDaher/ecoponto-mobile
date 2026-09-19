import type { AppError } from '@/core/errors';
import { createId } from '@/core/id';
import { ok, type Result } from '@/core/result';
import { Review } from '@/domain/entities/review';
import type { NewReview, ReviewRepository } from '@/domain/repositories/review.repository';

import { reviewListSchema } from '../../dto/api.schemas';
import { reviewsFromDto } from '../../mappers/review.mapper';
import { DEMO_REVIEWS } from '../../seed/demo-data';
import { simulateLatency } from './latency';

/** RB12 — in-memory reviews for development without a backend. */
export class InMemoryReviewRepository implements ReviewRepository {
  private reviews: Review[];

  constructor() {
    this.reviews = reviewsFromDto(reviewListSchema.parse(DEMO_REVIEWS));
  }

  async listByPoint(collectionPointId: string): Promise<Result<Review[], AppError>> {
    await simulateLatency();

    const list = this.reviews
      .filter((review) => review.collectionPointId === collectionPointId)
      .filter((review) => review.isPubliclyVisible)
      .sort((a, b) => b.reviewedAt.getTime() - a.reviewedAt.getTime());

    return ok(list);
  }

  async publish(data: NewReview, citizenId: string): Promise<Result<Review, AppError>> {
    await simulateLatency();

    const review = Review.create({
      id: createId('review'),
      citizenId,
      collectionPointId: data.collectionPointId,
      rating: data.rating,
      comment: data.comment ?? null,
      author: 'Você',
      reviewedAt: new Date(),
      status: 'published',
    });

    if (!review.ok) return review;

    this.reviews = [review.value, ...this.reviews];
    return ok(review.value);
  }
}
