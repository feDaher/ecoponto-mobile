import type { AppError } from '@/core/errors';
import { mapResult, type Result } from '@/core/result';
import type { DisposalRecord } from '@/domain/entities/disposal-record';
import type {
  DisposalRepository,
  NewDisposal,
  RankingEntry,
} from '@/domain/repositories/disposal.repository';

import {
  countSchema,
  disposalListSchema,
  disposalRecordDtoSchema,
  rankingListSchema,
} from '../../dto/api.schemas';
import type { HttpClient } from '../../http/http-client';
import { disposalRecordFromDto, disposalRecordsFromDto } from '../../mappers/disposal.mapper';

/**
 * RB09 via API.
 *   POST /disposals                       (authenticated)
 *   GET  /citizens/:id/disposals          (authenticated)
 *   GET  /citizens/:id/disposals/count    (authenticated, last 30 days)
 *   GET  /ranking
 */
export class HttpDisposalRepository implements DisposalRepository {
  constructor(private readonly http: HttpClient) {}

  async register(data: NewDisposal, _citizenId: string): Promise<Result<DisposalRecord, AppError>> {
    const response = await this.http.request({
      path: '/disposals',
      method: 'POST',
      authenticated: true,
      schema: disposalRecordDtoSchema,
      body: {
        collectionPointId: data.collectionPointId,
        categoryId: data.category,
        weightKg: data.weightKg,
      },
    });

    if (!response.ok) return response;
    return disposalRecordFromDto(response.value);
  }

  async listByCitizen(citizenId: string): Promise<Result<DisposalRecord[], AppError>> {
    const response = await this.http.request({
      path: `/citizens/${encodeURIComponent(citizenId)}/disposals`,
      authenticated: true,
      schema: disposalListSchema,
    });

    return mapResult(response, disposalRecordsFromDto);
  }

  async countLast30Days(citizenId: string): Promise<Result<number, AppError>> {
    const response = await this.http.request({
      path: `/citizens/${encodeURIComponent(citizenId)}/disposals/count`,
      authenticated: true,
      schema: countSchema,
      query: { windowDays: 30 },
    });

    return mapResult(response, (body) => body.total);
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

    return mapResult(response, (list) => list.map((item) => ({ ...item })));
  }
}
