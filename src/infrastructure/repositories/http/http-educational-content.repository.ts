import type { AppError } from '@/core/errors';
import { logger } from '@/core/logger';
import { ContractMismatchError } from '@/core/errors';
import { err, ok, type Result } from '@/core/result';
import type {
  EducationalContent,
  EducationalContentRepository,
} from '@/domain/repositories/educational-content.repository';
import type { WasteCategoryId } from '@/domain/value-objects/waste-category';

import { apiContentListSchema, apiEducationalContentDtoSchema } from '../../dto/api.schemas';
import type { HttpClient } from '../../http/http-client';
import { educationalContentFromApi } from '../../mappers/educational-content.mapper';
import type { HttpWasteCategoryCatalog } from './http-waste-category.catalog';

/**
 * RB10 via ecoponto-api — public routes, only published guides.
 *   GET /educational-content?categoryId=<uuid>
 *   GET /educational-content/:id
 * Categories travel as UUIDs; the catalog turns them into the app's slugs.
 */
export class HttpEducationalContentRepository implements EducationalContentRepository {
  constructor(
    private readonly http: HttpClient,
    private readonly categories: HttpWasteCategoryCatalog,
  ) {}

  async list(category?: WasteCategoryId): Promise<Result<EducationalContent[], AppError>> {
    let categoryId: string | undefined;

    if (category) {
      const id = await this.categories.idFor(category);
      if (!id.ok) return id;
      categoryId = id.value;
    }

    const response = await this.http.request({
      path: '/educational-content',
      schema: apiContentListSchema,
      query: { categoryId },
    });
    if (!response.ok) return response;

    const contents: EducationalContent[] = [];

    for (const dto of response.value) {
      const slug = await this.categories.slugFor(dto.categoryId);
      if (!slug.ok) return slug;

      // A guide of a category the app doesn't know has no screen to show it on.
      if (!slug.value) {
        logger.warn('Guia de categoria desconhecida descartado', { id: dto.id });
        continue;
      }
      contents.push(educationalContentFromApi(dto, slug.value));
    }

    return ok(contents);
  }

  async getById(id: string): Promise<Result<EducationalContent, AppError>> {
    const response = await this.http.request({
      path: `/educational-content/${encodeURIComponent(id)}`,
      schema: apiEducationalContentDtoSchema,
    });
    if (!response.ok) return response;

    const slug = await this.categories.slugFor(response.value.categoryId);
    if (!slug.ok) return slug;
    if (!slug.value) {
      return err(new ContractMismatchError(`Categoria desconhecida: ${response.value.categoryId}`));
    }

    return ok(educationalContentFromApi(response.value, slug.value));
  }
}
