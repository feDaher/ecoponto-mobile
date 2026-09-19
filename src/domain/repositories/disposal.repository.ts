import type { AppError } from '@/core/errors';
import type { Result } from '@/core/result';

import type { DisposalRecord } from '../entities/disposal-record';
import type { WasteCategoryId } from '../value-objects/waste-category';

export type NewDisposal = {
  readonly collectionPointId: string;
  readonly category: WasteCategoryId;
  readonly weightKg: number;
};

export type RankingEntry = {
  readonly userId: string;
  readonly name: string;
  readonly city: string;
  readonly points: number;
  readonly position: number;
};

/** RB09 — disposal records, points system and ranking. */
export interface DisposalRepository {
  register(data: NewDisposal, citizenId: string): Promise<Result<DisposalRecord, AppError>>;

  listByCitizen(citizenId: string): Promise<Result<DisposalRecord[], AppError>>;

  /** Used for the frequency multiplier in the scoring. */
  countLast30Days(citizenId: string): Promise<Result<number, AppError>>;

  getRanking(params?: { city?: string; limit?: number }): Promise<Result<RankingEntry[], AppError>>;
}
