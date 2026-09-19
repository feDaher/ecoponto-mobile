import type { AppError } from '@/core/errors';
import type { Result } from '@/core/result';
import type {
  EducationalContent,
  EducationalContentRepository,
} from '@/domain/repositories/educational-content.repository';
import type { WasteCategoryId } from '@/domain/value-objects/waste-category';

import type { UseCase } from './use-case';

export type ListEducationalContentInput = {
  readonly category?: WasteCategoryId;
};

/**
 * RB10 — Educational content linked to the waste type.
 * Public access: no session check.
 */
export class ListEducationalContentUseCase implements UseCase<
  ListEducationalContentInput,
  EducationalContent[]
> {
  constructor(private readonly contents: EducationalContentRepository) {}

  execute(
    input: ListEducationalContentInput = {},
  ): Promise<Result<EducationalContent[], AppError>> {
    return this.contents.list(input.category);
  }
}
