import type { AppError } from '@/core/errors';
import { mapResult, type Result } from '@/core/result';
import type { Review } from '@/domain/entities/review';
import type { NewReview, ReviewRepository } from '@/domain/repositories/review.repository';

import { reviewDtoSchema, reviewListSchema } from '../../dto/api.schemas';
import type { HttpClient } from '../../http/http-client';
import { reviewFromDto, reviewsFromDto } from '../../mappers/review.mapper';

/**
 * RB12 via API.
 *   GET  /collection-points/:id/reviews
 *   POST /collection-points/:id/reviews (authenticated)
 */
export class HttpReviewRepository implements ReviewRepository {
  constructor(private readonly http: HttpClient) {}

  async listByPoint(collectionPointId: string): Promise<Result<Review[], AppError>> {
    const response = await this.http.request({
      path: `/collection-points/${encodeURIComponent(collectionPointId)}/reviews`,
      schema: reviewListSchema,
    });

    return mapResult(response, reviewsFromDto);
  }

  async publish(data: NewReview, _citizenId: string): Promise<Result<Review, AppError>> {
    const response = await this.http.request({
      path: `/collection-points/${encodeURIComponent(data.collectionPointId)}/reviews`,
      method: 'POST',
      authenticated: true,
      schema: reviewDtoSchema,
      body: { rating: data.rating, comment: data.comment },
    });

    if (!response.ok) return response;
    return reviewFromDto(response.value);
  }
}
