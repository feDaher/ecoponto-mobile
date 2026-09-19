import { ValidationError } from '@/core/errors';
import { err, ok, type Result } from '@/core/result';

/** Mirrors `AVALIACAO.statusAvaliacao` from the ERD. */
export const REVIEW_STATUSES = ['published', 'under_moderation', 'removed'] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const MIN_RATING = 1;
export const MAX_RATING = 5;
export const MAX_COMMENT_LENGTH = 500;

export type ReviewProps = {
  id: string;
  citizenId: string;
  collectionPointId: string;
  rating: number;
  reviewedAt: Date;
  comment?: string | null;
  author?: string | null;
  status?: ReviewStatus;
};

/**
 * Review of a collection point.
 *
 * RB12 — only authenticated users can review (enforced in the use-case);
 * reviews are public on the point's page and can be moderated by the
 * administrator — hence the `status`.
 */
export class Review {
  readonly id: string;
  readonly citizenId: string;
  readonly collectionPointId: string;
  readonly rating: number;
  readonly reviewedAt: Date;
  readonly comment: string | null;
  readonly author: string | null;
  readonly status: ReviewStatus;

  private constructor(props: Required<ReviewProps>) {
    this.id = props.id;
    this.citizenId = props.citizenId;
    this.collectionPointId = props.collectionPointId;
    this.rating = props.rating;
    this.reviewedAt = props.reviewedAt;
    this.comment = props.comment;
    this.author = props.author;
    this.status = props.status;
    Object.freeze(this);
  }

  static create(props: ReviewProps): Result<Review, ValidationError> {
    if (!Number.isInteger(props.rating) || props.rating < MIN_RATING || props.rating > MAX_RATING) {
      return err(
        new ValidationError(`Dê uma nota de ${MIN_RATING} a ${MAX_RATING}.`, undefined, 'rating'),
      );
    }

    const comment = props.comment?.trim() || null;

    if (comment && comment.length > MAX_COMMENT_LENGTH) {
      return err(
        new ValidationError(
          `O comentário deve ter no máximo ${MAX_COMMENT_LENGTH} caracteres.`,
          undefined,
          'comment',
        ),
      );
    }

    return ok(
      new Review({
        ...props,
        comment,
        author: props.author?.trim() || null,
        status: props.status ?? 'published',
      }),
    );
  }

  /** Only published reviews appear on the public page and in the average rating. */
  get isPubliclyVisible(): boolean {
    return this.status === 'published';
  }
}

/** Average rating considering only visible reviews (RB12). */
export function calculateAverageRating(reviews: readonly Review[]): number | null {
  const visible = reviews.filter((review) => review.isPubliclyVisible);
  if (visible.length === 0) return null;

  const sum = visible.reduce((total, review) => total + review.rating, 0);
  return Math.round((sum / visible.length) * 10) / 10;
}
