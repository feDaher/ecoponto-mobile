import {
  BusinessRuleError,
  ForbiddenError,
  UnauthenticatedError,
  type AppError,
} from '@/core/errors';
import { err, ok, unwrapOr, type Result } from '@/core/result';
import type { DisposalRecord } from '@/domain/entities/disposal-record';
import type { User } from '@/domain/entities/user';
import type { CollectionPointRepository } from '@/domain/repositories/collection-point.repository';
import type { DisposalRepository } from '@/domain/repositories/disposal.repository';
import {
  calculateDisposalPoints,
  levelFor,
  unlockedAchievements,
  type Achievement,
  type PointsCalculation,
} from '@/domain/services/gamification';
import { getCategory, type WasteCategoryId } from '@/domain/value-objects/waste-category';

import type { UseCase } from './use-case';

export type RegisterDisposalInput = {
  readonly user: User | null;
  readonly collectionPointId: string;
  readonly category: WasteCategoryId;
  readonly weightKg: number;
};

export type RegisterDisposalOutput = {
  readonly record: DisposalRecord;
  readonly calculation: PointsCalculation;
  readonly totalPoints: number;
  readonly level: string;
  /** Seals earned with this disposal — they feed the reward screen. */
  readonly newAchievements: readonly Achievement[];
};

/**
 * RB09 — Disposal registration and conversion into gamification points.
 * RB01 — Requires sign-up: "registering a disposal" is an active interaction.
 * RB02 — Exclusive to the Citizen role.
 * RB05 — The point must accept the declared category.
 */
export class RegisterDisposalUseCase implements UseCase<
  RegisterDisposalInput,
  RegisterDisposalOutput
> {
  constructor(
    private readonly disposals: DisposalRepository,
    private readonly points: CollectionPointRepository,
  ) {}

  async execute(input: RegisterDisposalInput): Promise<Result<RegisterDisposalOutput, AppError>> {
    const { user, collectionPointId, category, weightKg } = input;

    // RB01
    if (!user) {
      return err(new UnauthenticatedError('Entre na sua conta para registrar um descarte.'));
    }

    // RB02
    if (!user.can('disposal:register')) {
      return err(
        new ForbiddenError('Apenas o perfil Cidadão pode registrar descartes e acumular pontos.'),
      );
    }

    const pointResult = await this.points.getById(collectionPointId);
    if (!pointResult.ok) return pointResult;

    const point = pointResult.value;

    // RB03 — no disposal can be registered at a point that is not live.
    if (!point.isVisibleOnMap) {
      return err(
        new BusinessRuleError('RB03', 'Este ponto de coleta não está disponível no momento.'),
      );
    }

    // RB05
    if (!point.acceptsCategory(category)) {
      return err(
        new BusinessRuleError(
          'RB05',
          `${point.name} não recebe ${getCategory(category).name.toLowerCase()}.`,
        ),
      );
    }

    // RB09 — frequency is part of the score; if counting fails, we proceed with
    // the neutral multiplier instead of blocking the citizen's registration.
    const frequency = unwrapOr(await this.disposals.countLast30Days(user.id), 0);

    const calculation = calculateDisposalPoints({
      category,
      weightKg,
      disposalsLast30Days: frequency,
    });

    const recordResult = await this.disposals.register(
      { collectionPointId, category, weightKg },
      user.id,
    );
    if (!recordResult.ok) return recordResult;

    const record = recordResult.value;
    const totalPoints = user.points + record.pointsEarned;

    const before = new Set(unlockedAchievements(user.points).map((a) => a.id));
    const newAchievements = unlockedAchievements(totalPoints).filter((a) => !before.has(a.id));

    return ok({
      record,
      calculation,
      totalPoints,
      level: levelFor(totalPoints).title,
      newAchievements,
    });
  }
}
