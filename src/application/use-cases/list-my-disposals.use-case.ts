import { UnauthenticatedError, type AppError } from '@/core/errors';
import { err, ok, type Result } from '@/core/result';
import type { DisposalRecord } from '@/domain/entities/disposal-record';
import type { User } from '@/domain/entities/user';
import type { DisposalRepository } from '@/domain/repositories/disposal.repository';
import {
  FREQUENCY_WINDOW_DAYS,
  progressToNextLevel,
  unlockedAchievements,
  type Achievement,
  type Level,
} from '@/domain/services/gamification';

import type { UseCase } from './use-case';

export type DisposalSummary = {
  readonly records: readonly DisposalRecord[];
  readonly totalWeightKg: number;
  readonly totalPoints: number;
  readonly level: Level;
  readonly nextLevel: Level | null;
  readonly progress: number;
  readonly pointsRemaining: number;
  readonly achievements: readonly Achievement[];
  /** RB09 — feeds the frequency multiplier shown before a new disposal. */
  readonly disposalsLast30Days: number;
};

export type ListMyDisposalsInput = {
  readonly user: User | null;
  /** Injectable for tests; the frequency window is counted from here. */
  readonly now?: Date;
};

/** The citizen's history and gamification summary (RB09). */
export class ListMyDisposalsUseCase implements UseCase<ListMyDisposalsInput, DisposalSummary> {
  constructor(private readonly disposals: DisposalRepository) {}

  async execute(input: ListMyDisposalsInput): Promise<Result<DisposalSummary, AppError>> {
    const { user } = input;

    if (!user) {
      return err(new UnauthenticatedError('Entre na sua conta para ver seus descartes.'));
    }

    const result = await this.disposals.listByCitizen(user.id);
    if (!result.ok) return result;

    const records = result.value;
    const totalWeightKg = records.reduce((total, r) => total + r.weightKg, 0);
    const progress = progressToNextLevel(user.points);

    const now = input.now ?? new Date();
    const windowStart = now.getTime() - FREQUENCY_WINDOW_DAYS * MS_PER_DAY;

    return ok({
      records,
      totalWeightKg: Math.round(totalWeightKg * 100) / 100,
      totalPoints: user.points,
      level: progress.current,
      nextLevel: progress.next,
      progress: progress.progress,
      pointsRemaining: progress.pointsRemaining,
      achievements: unlockedAchievements(user.points),
      disposalsLast30Days: records.filter((r) => r.disposedAt.getTime() >= windowStart).length,
    });
  }
}

const MS_PER_DAY = 86_400_000;
