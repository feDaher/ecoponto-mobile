import type { AppError } from '@/core/errors';
import { mapResult, type Result } from '@/core/result';
import type { DisposalRecord } from '@/domain/entities/disposal-record';
import type {
  DisposalRepository,
  MyRanking,
  NewDisposal,
  RankingEntry,
} from '@/domain/repositories/disposal.repository';

import {
  apiDisposalDtoSchema,
  apiDisposalPageSchema,
  apiDisposalSummarySchema,
  myRankingDtoSchema,
  rankingListSchema,
} from '../../dto/api.schemas';
import type { HttpClient } from '../../http/http-client';
import { disposalRecordFromDto, disposalRecordsFromDto } from '../../mappers/disposal.mapper';
import type { HttpWasteCategoryCatalog } from './http-waste-category.catalog';

/** The API's page size cap; the history screen shows the latest disposals. */
const HISTORY_PAGE_SIZE = 100;
const MS_30_DAYS = 30 * 86_400_000;

/**
 * RB09 via ecoponto-api. The citizen is always the token's user, so the
 * `citizenId` parameters are not sent.
 *   POST /disposals                 (CITIZEN; starts PENDING with 0 points)
 *   GET  /disposals/me              (CITIZEN; paginated history)
 *   GET  /disposals/me/summary      (CITIZEN; CONFIRMED points only)
 *   GET  /ranking · /ranking/me     (public · CITIZEN)
 */
export class HttpDisposalRepository implements DisposalRepository {
  constructor(
    private readonly http: HttpClient,
    private readonly categories: HttpWasteCategoryCatalog,
  ) {}

  async register(data: NewDisposal, _citizenId: string): Promise<Result<DisposalRecord, AppError>> {
    const categoryId = await this.categories.idFor(data.category);
    if (!categoryId.ok) return categoryId;

    const response = await this.http.request({
      path: '/disposals',
      method: 'POST',
      authenticated: true,
      schema: apiDisposalDtoSchema,
      body: {
        collectionPointId: data.collectionPointId,
        categoryId: categoryId.value,
        weightKg: data.weightKg,
      },
    });

    if (!response.ok) return response;
    return disposalRecordFromDto(response.value);
  }

  async listByCitizen(_citizenId: string): Promise<Result<DisposalRecord[], AppError>> {
    const response = await this.http.request({
      path: '/disposals/me',
      authenticated: true,
      schema: apiDisposalPageSchema,
      query: { pageSize: HISTORY_PAGE_SIZE },
    });

    return mapResult(response, (page) => disposalRecordsFromDto(page.items));
  }

  async countLast30Days(_citizenId: string): Promise<Result<number, AppError>> {
    // Only the total matters, so one item per page is enough.
    const response = await this.http.request({
      path: '/disposals/me',
      authenticated: true,
      schema: apiDisposalPageSchema,
      query: { from: new Date(Date.now() - MS_30_DAYS).toISOString(), pageSize: 1 },
    });

    return mapResult(response, (page) => page.total);
  }

  async getRanking(params?: {
    city?: string;
    limit?: number;
  }): Promise<Result<RankingEntry[], AppError>> {
    const response = await this.http.request({
      path: '/ranking',
      schema: rankingListSchema,
      query: { city: params?.city, limit: params?.limit },
    });

    return response;
  }

  async getMyRanking(_citizenId: string): Promise<Result<MyRanking, AppError>> {
    return this.http.request({
      path: '/ranking/me',
      authenticated: true,
      schema: myRankingDtoSchema,
    });
  }

  async getPointsBalance(_citizenId: string): Promise<Result<number, AppError>> {
    const response = await this.http.request({
      path: '/disposals/me/summary',
      authenticated: true,
      schema: apiDisposalSummarySchema,
    });

    return mapResult(response, (summary) => summary.totalPoints);
  }
}
