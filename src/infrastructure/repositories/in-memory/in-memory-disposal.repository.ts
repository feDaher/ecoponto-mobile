import type { AppError } from '@/core/errors';
import { createId } from '@/core/id';
import { ok, type Result } from '@/core/result';
import { DisposalRecord } from '@/domain/entities/disposal-record';
import type {
  DisposalRepository,
  NewDisposal,
  RankingEntry,
} from '@/domain/repositories/disposal.repository';
import { calculateDisposalPoints } from '@/domain/services/gamification';

import { disposalListSchema } from '../../dto/api.schemas';
import { disposalRecordsFromDto } from '../../mappers/disposal.mapper';
import { DEMO_DISPOSALS, DEMO_RANKING } from '../../seed/demo-data';
import { simulateLatency } from './latency';

const MS_30_DAYS = 30 * 86_400_000;

/**
 * RB09 in memory.
 *
 * The score is recalculated here on purpose: in the real backend, the server
 * decides the points. This repository mimics that role so the use-case never
 * depends on the number it calculated itself as a preview.
 */
export class InMemoryDisposalRepository implements DisposalRepository {
  private records: DisposalRecord[];
  private ranking: RankingEntry[];

  constructor() {
    this.records = disposalRecordsFromDto(disposalListSchema.parse(DEMO_DISPOSALS));
    this.ranking = [...DEMO_RANKING];
  }

  async register(data: NewDisposal, citizenId: string): Promise<Result<DisposalRecord, AppError>> {
    await simulateLatency();

    const frequency = this.countRecent(citizenId);
    const { points } = calculateDisposalPoints({
      category: data.category,
      weightKg: data.weightKg,
      disposalsLast30Days: frequency,
    });

    const record = DisposalRecord.create({
      id: createId('disposal'),
      citizenId,
      collectionPointId: data.collectionPointId,
      category: data.category,
      weightKg: data.weightKg,
      pointsEarned: points,
      disposedAt: new Date(),
    });

    if (!record.ok) return record;

    this.records = [record.value, ...this.records];
    this.updateRanking(citizenId, points);

    return ok(record.value);
  }

  async listByCitizen(citizenId: string): Promise<Result<DisposalRecord[], AppError>> {
    await simulateLatency();

    const list = this.records
      .filter((record) => record.citizenId === citizenId)
      .sort((a, b) => b.disposedAt.getTime() - a.disposedAt.getTime());

    return ok(list);
  }

  async countLast30Days(citizenId: string): Promise<Result<number, AppError>> {
    return ok(this.countRecent(citizenId));
  }

  async getRanking(params?: {
    city?: string;
    limit?: number;
  }): Promise<Result<RankingEntry[], AppError>> {
    await simulateLatency();

    const filtered = params?.city
      ? this.ranking.filter((entry) => entry.city === params.city)
      : this.ranking;

    const sorted = [...filtered]
      .sort((a, b) => b.points - a.points)
      .map((entry, index) => ({ ...entry, position: index + 1 }))
      .slice(0, params?.limit ?? 20);

    return ok(sorted);
  }

  private countRecent(citizenId: string): number {
    const threshold = Date.now() - MS_30_DAYS;
    return this.records.filter(
      (record) => record.citizenId === citizenId && record.disposedAt.getTime() >= threshold,
    ).length;
  }

  private updateRanking(userId: string, pointsEarned: number): void {
    this.ranking = this.ranking.map((entry) =>
      entry.userId === userId ? { ...entry, points: entry.points + pointsEarned } : entry,
    );
  }
}
