import { NotFoundError, type AppError } from '@/core/errors';
import { err, ok, type Result } from '@/core/result';
import type {
  EducationalContent,
  EducationalContentRepository,
} from '@/domain/repositories/educational-content.repository';
import { isWasteCategoryId, type WasteCategoryId } from '@/domain/value-objects/waste-category';

import { contentListSchema } from '../../dto/api.schemas';
import { DEMO_CONTENTS } from '../../seed/demo-data';
import { simulateLatency } from './latency';

/** RB10 — public educational content, served locally in demo mode. */
export class InMemoryEducationalContentRepository implements EducationalContentRepository {
  private readonly contents: EducationalContent[];

  constructor() {
    this.contents = contentListSchema
      .parse(DEMO_CONTENTS)
      .filter((dto) => isWasteCategoryId(dto.categoryId))
      .map((dto) => ({
        id: dto.id,
        title: dto.title,
        summary: dto.summary,
        category: dto.categoryId as WasteCategoryId,
        howToDispose: dto.howToDispose,
        whyRecycle: dto.whyRecycle,
        environmentalImpact: dto.environmentalImpact,
        publishedAt: dto.publishedAt,
      }));
  }

  async list(category?: WasteCategoryId): Promise<Result<EducationalContent[], AppError>> {
    await simulateLatency();

    const list = category
      ? this.contents.filter((content) => content.category === category)
      : this.contents;

    return ok([...list].sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime()));
  }

  async getById(id: string): Promise<Result<EducationalContent, AppError>> {
    await simulateLatency();

    const content = this.contents.find((candidate) => candidate.id === id);
    if (!content) return err(new NotFoundError('Conteúdo educativo'));

    return ok(content);
  }
}
