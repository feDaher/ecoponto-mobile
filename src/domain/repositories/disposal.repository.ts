import type { AppError } from '@/core/errors';
import type { Result } from '@/core/result';

import type { DisposalRecord } from '../entities/disposal-record';
import type { WasteCategoryId } from '../value-objects/waste-category';

export type NewDisposal = {
  readonly collectionPointId: string;
  readonly category: WasteCategoryId;
  readonly weightKg: number;
};

/**
 * One line of the public ranking. LGPD minimization: no user id — the API
 * exposes only the first name, city and points. Ties share the position.
 */
export type RankingEntry = {
  readonly name: string;
  readonly city: string;
  readonly points: number;
  readonly position: number;
};

/** The signed-in citizen's own standing; `position` is null until they score. */
export type MyRanking = {
  readonly name: string;
  readonly points: number;
  readonly position: number | null;
};

/** RB09 — disposal records, points system and ranking. */
export interface DisposalRepository {
  register(data: NewDisposal, citizenId: string): Promise<Result<DisposalRecord, AppError>>;

  listByCitizen(citizenId: string): Promise<Result<DisposalRecord[], AppError>>;

  /** Used for the frequency multiplier in the scoring. */
  countLast30Days(citizenId: string): Promise<Result<number, AppError>>;

  getRanking(params?: { city?: string; limit?: number }): Promise<Result<RankingEntry[], AppError>>;

  getMyRanking(citizenId: string): Promise<Result<MyRanking, AppError>>;

  /** Confirmed points (RB09) — the source of truth for the citizen's balance. */
  getPointsBalance(citizenId: string): Promise<Result<number, AppError>>;
}
