import type { AppError } from '@/core/errors';
import { createId } from '@/core/id';
import { ok, type Result } from '@/core/result';
import { DisposalRecord } from '@/domain/entities/disposal-record';
import type {
  DisposalRepository,
  MyRanking,
  NewDisposal,
  RankingEntry,
} from '@/domain/repositories/disposal.repository';
import { calculateDisposalPoints } from '@/domain/services/gamification';

import { disposalListSchema } from '../../dto/api.schemas';
import { disposalRecordsFromDto } from '../../mappers/disposal.mapper';
import { DEMO_DISPOSALS, DEMO_RANKING } from '../../seed/demo-data';
import { simulateLatency } from './latency';

const MS_30_DAYS = 30 * 86_400_000;

/** The demo ranking keeps the user id internally, to update and find the signed-in citizen. */
type DemoRankingEntry = RankingEntry & { readonly userId: string };

/**
 * RB09 in memory.
 *
 * The score is recalculated here on purpose: in the real backend, the server
 * decides the points. This repository mimics that role so the use-case never
 * depends on the number it calculated itself as a preview.
 */
export class InMemoryDisposalRepository implements DisposalRepository {
  private records: DisposalRecord[];
  private ranking: DemoRankingEntry[];

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

    const sorted = this.ranked(filtered)
      .slice(0, params?.limit ?? 20)
      .map(({ name, city, points, position }) => ({
        name: firstName(name),
        city,
        points,
        position,
      }));

    return ok(sorted);
  }

  async getMyRanking(citizenId: string): Promise<Result<MyRanking, AppError>> {
    await simulateLatency();

    const mine = this.ranked(this.ranking).find((entry) => entry.userId === citizenId);
    if (!mine) return ok({ name: '', points: 0, position: null });

    return ok({ name: firstName(mine.name), points: mine.points, position: mine.position });
  }

  async getPointsBalance(citizenId: string): Promise<Result<number, AppError>> {
    // The demo ranking starts from the seed balance and grows with each disposal.
    const mine = this.ranking.find((entry) => entry.userId === citizenId);
    return ok(mine?.points ?? 0);
  }

  /** Highest first; ties share the position, as in the API. */
  private ranked(entries: readonly DemoRankingEntry[]): DemoRankingEntry[] {
    const sorted = [...entries].sort((a, b) => b.points - a.points);
    return sorted.map((entry) => ({
      ...entry,
      position: sorted.findIndex((other) => other.points === entry.points) + 1,
    }));
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

/** Same LGPD minimization as the API: the public ranking shows only the first name. */
function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? '';
}
