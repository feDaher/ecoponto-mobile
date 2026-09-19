import { UnauthenticatedError, type AppError } from '@/core/errors';
import { err, ok, type Result } from '@/core/result';
import type { DisposalRecord } from '@/domain/entities/disposal-record';
import type { User } from '@/domain/entities/user';
import type { DisposalRepository } from '@/domain/repositories/disposal.repository';
import {
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
};

/** The citizen's history and gamification summary (RB09). */
export class ListMyDisposalsUseCase implements UseCase<User | null, DisposalSummary> {
  constructor(private readonly disposals: DisposalRepository) {}

  async execute(user: User | null): Promise<Result<DisposalSummary, AppError>> {
    if (!user) {
      return err(new UnauthenticatedError('Entre na sua conta para ver seus descartes.'));
    }

    const result = await this.disposals.listByCitizen(user.id);
    if (!result.ok) return result;

    const records = result.value;
    const totalWeightKg = records.reduce((total, r) => total + r.weightKg, 0);
    const progress = progressToNextLevel(user.points);

    return ok({
      records,
      totalWeightKg: Math.round(totalWeightKg * 100) / 100,
      totalPoints: user.points,
      level: progress.current,
      nextLevel: progress.next,
      progress: progress.progress,
      pointsRemaining: progress.pointsRemaining,
      achievements: unlockedAchievements(user.points),
    });
  }
}
