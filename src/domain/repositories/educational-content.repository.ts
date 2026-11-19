import type { AppError } from '@/core/errors';
import type { Result } from '@/core/result';

import type { WasteCategoryId } from '../value-objects/waste-category';

export type EducationalContent = {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly category: WasteCategoryId;
  readonly howToDispose: readonly string[];
  readonly whyRecycle: string;
  readonly environmentalImpact: string;
  /**
   * Free text that doesn't fit the three sections above — e.g. a guide written in
   * the web panel without the standard headings. Empty when everything fits.
   */
  readonly body: string;
  readonly publishedAt: Date;
};

/**
 * RB10 — Educational content linked to the waste type.
 * "This content must be publicly accessible, with no sign-up required."
 */
export interface EducationalContentRepository {
  list(category?: WasteCategoryId): Promise<Result<EducationalContent[], AppError>>;

  getById(id: string): Promise<Result<EducationalContent, AppError>>;
}
