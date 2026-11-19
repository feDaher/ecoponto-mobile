import type { AppError } from '@/core/errors';
import { mapResult, type Result } from '@/core/result';
import type { Review } from '@/domain/entities/review';
import type { NewReview, ReviewRepository } from '@/domain/repositories/review.repository';

import { apiReviewDtoSchema, apiReviewListSchema, type ApiReviewDto } from '../../dto/api.schemas';
import type { HttpClient } from '../../http/http-client';
import { reviewFromDto, reviewsFromDto } from '../../mappers/review.mapper';

/** The point page shows the most recent reviews (the API caps a page at 100). */
const REVIEWS_PAGE_SIZE = 100;

/**
 * Public reviews carry no citizen id: the API applies LGPD minimization and
 * exposes only the author's first name. No screen needs the id of someone
 * else's review, so it is filled with this placeholder.
 */
const ANONYMOUS_AUTHOR = 'anonymous';

/**
 * RB12 via ecoponto-api.
 *   GET  /collection-points/:id/reviews   (public; hidden reviews never come)
 *   POST /collection-points/:id/reviews   (CITIZEN; one per citizen per point —
 *                                          posting again updates the previous one)
 */
export class HttpReviewRepository implements ReviewRepository {
  constructor(private readonly http: HttpClient) {}

  async listByPoint(collectionPointId: string): Promise<Result<Review[], AppError>> {
    const response = await this.http.request({
      path: `/collection-points/${encodeURIComponent(collectionPointId)}/reviews`,
      schema: apiReviewListSchema,
      query: { limit: REVIEWS_PAGE_SIZE },
    });

    return mapResult(response, (list) =>
      reviewsFromDto(list.map((dto) => toReviewDto(dto, collectionPointId, ANONYMOUS_AUTHOR))),
    );
  }

  async publish(data: NewReview, citizenId: string): Promise<Result<Review, AppError>> {
    const response = await this.http.request({
      path: `/collection-points/${encodeURIComponent(data.collectionPointId)}/reviews`,
      method: 'POST',
      authenticated: true,
      schema: apiReviewDtoSchema,
      body: { rating: data.rating, comment: data.comment ?? null },
    });

    if (!response.ok) return response;
    return reviewFromDto(toReviewDto(response.value, data.collectionPointId, citizenId));
  }
}

function toReviewDto(dto: ApiReviewDto, collectionPointId: string, citizenId: string) {
  return {
    id: dto.id,
    citizenId,
    collectionPointId,
    rating: dto.rating,
    reviewedAt: dto.createdAt,
    comment: dto.comment ?? null,
    author: dto.authorName ?? null,
    status: 'published' as const,
  };
}
