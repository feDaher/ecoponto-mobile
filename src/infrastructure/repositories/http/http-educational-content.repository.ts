import { ContractMismatchError, type AppError } from '@/core/errors';
import { err, mapResult, ok, type Result } from '@/core/result';
import type {
  EducationalContent,
  EducationalContentRepository,
} from '@/domain/repositories/educational-content.repository';
import { isWasteCategoryId, type WasteCategoryId } from '@/domain/value-objects/waste-category';

import {
  contentListSchema,
  educationalContentDtoSchema,
  type EducationalContentDto,
} from '../../dto/api.schemas';
import type { HttpClient } from '../../http/http-client';

/**
 * RB10 via API — public route, no `Authorization`.
 *   GET /educational-contents
 *   GET /educational-contents/:id
 */
export class HttpEducationalContentRepository implements EducationalContentRepository {
  constructor(private readonly http: HttpClient) {}

  async list(category?: WasteCategoryId): Promise<Result<EducationalContent[], AppError>> {
    const response = await this.http.request({
      path: '/educational-contents',
      schema: contentListSchema,
      query: { category },
    });

    return mapResult(response, (list) =>
      list.filter((dto) => isWasteCategoryId(dto.categoryId)).map(toContent),
    );
  }

  async getById(id: string): Promise<Result<EducationalContent, AppError>> {
    const response = await this.http.request({
      path: `/educational-contents/${encodeURIComponent(id)}`,
      schema: educationalContentDtoSchema,
    });

    if (!response.ok) return response;

    if (!isWasteCategoryId(response.value.categoryId)) {
      return err(new ContractMismatchError(`Categoria desconhecida: ${response.value.categoryId}`));
    }

    return ok(toContent(response.value));
  }
}

function toContent(dto: EducationalContentDto): EducationalContent {
  return {
    id: dto.id,
    title: dto.title,
    summary: dto.summary,
    category: dto.categoryId as WasteCategoryId,
    howToDispose: dto.howToDispose,
    whyRecycle: dto.whyRecycle,
    environmentalImpact: dto.environmentalImpact,
    publishedAt: dto.publishedAt,
  };
}
