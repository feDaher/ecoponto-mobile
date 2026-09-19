import { logger } from '@/core/logger';
import { ContractMismatchError, type AppError } from '@/core/errors';
import { err, ok, type Result } from '@/core/result';
import { Review } from '@/domain/entities/review';

import type { ReviewDto } from '../dto/api.schemas';

export function reviewFromDto(dto: ReviewDto): Result<Review, AppError> {
  const review = Review.create({
    id: dto.id,
    citizenId: dto.citizenId,
    collectionPointId: dto.collectionPointId,
    rating: dto.rating,
    reviewedAt: dto.reviewedAt,
    comment: dto.comment ?? null,
    author: dto.author ?? null,
    status: dto.status ?? 'published',
  });

  if (!review.ok) return err(new ContractMismatchError(review.error));
  return ok(review.value);
}

export function reviewsFromDto(dtos: readonly ReviewDto[]): Review[] {
  const reviews: Review[] = [];

  for (const dto of dtos) {
    const result = reviewFromDto(dto);
    if (result.ok) reviews.push(result.value);
    else logger.warn('Avaliação inválida descartada', { id: dto.id });
  }

  return reviews;
}
