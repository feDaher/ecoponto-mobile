import { ContractMismatchError, type AppError } from '@/core/errors';
import { err, ok, type Result } from '@/core/result';
import { isWasteCategoryId, type WasteCategoryId } from '@/domain/value-objects/waste-category';

import { fromApiWasteType, toApiWasteType } from '../../dto/api-enums';
import { apiWasteCategoryListSchema } from '../../dto/api.schemas';
import type { HttpClient } from '../../http/http-client';

type Catalog = {
  readonly idBySlug: ReadonlyMap<WasteCategoryId, string>;
  readonly slugById: ReadonlyMap<string, WasteCategoryId>;
};

/**
 * RB05 — bridge between the app's category slugs (`cell-phones`) and the
 * API's category UUIDs, through the code both sides share (`CELL_PHONES`).
 *
 * Routes that reference a category by id (disposals, educational content) need
 * it. Loaded once from the public `GET /waste-categories` and kept for the
 * session; a failed load is not cached, so the next call tries again.
 */
export class HttpWasteCategoryCatalog {
  private catalog: Promise<Result<Catalog, AppError>> | null = null;

  constructor(private readonly http: HttpClient) {}

  async idFor(slug: WasteCategoryId): Promise<Result<string, AppError>> {
    const catalog = await this.load();
    if (!catalog.ok) return catalog;

    const id = catalog.value.idBySlug.get(slug);
    if (!id) {
      return err(
        new ContractMismatchError(`Categoria sem cadastro na API: ${toApiWasteType(slug)}`),
      );
    }
    return ok(id);
  }

  async slugFor(id: string): Promise<Result<WasteCategoryId | null, AppError>> {
    const catalog = await this.load();
    if (!catalog.ok) return catalog;
    return ok(catalog.value.slugById.get(id) ?? null);
  }

  private load(): Promise<Result<Catalog, AppError>> {
    this.catalog ??= this.fetchCatalog().then((result) => {
      if (!result.ok) this.catalog = null;
      return result;
    });
    return this.catalog;
  }

  private async fetchCatalog(): Promise<Result<Catalog, AppError>> {
    const response = await this.http.request({
      path: '/waste-categories',
      schema: apiWasteCategoryListSchema,
    });
    if (!response.ok) return response;

    const idBySlug = new Map<WasteCategoryId, string>();
    const slugById = new Map<string, WasteCategoryId>();

    for (const category of response.value) {
      const slug = fromApiWasteType(category.name);
      // Categories the app doesn't know (created later in the panel) are ignored.
      if (!isWasteCategoryId(slug)) continue;

      idBySlug.set(slug, category.id);
      slugById.set(category.id, slug);
    }

    return ok({ idBySlug, slugById });
  }
}
