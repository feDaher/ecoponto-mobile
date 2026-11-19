import type { AppError } from '@/core/errors';
import { logger } from '@/core/logger';
import { ok, type Result } from '@/core/result';
import type { User } from '@/domain/entities/user';
import type {
  DisposalRepository,
  MyRanking,
  RankingEntry,
} from '@/domain/repositories/disposal.repository';

import type { UseCase } from './use-case';

export type GetRankingInput = {
  readonly city?: string;
  readonly limit?: number;
  /** When a citizen is signed in, their own standing comes along. */
  readonly user?: User | null;
};

export type RankingView = {
  readonly entries: RankingEntry[];
  readonly me: MyRanking | null;
};

/**
 * RB09 — recognition through ranking.
 *
 * The public list carries no user ids (LGPD), so the signed-in citizen's own
 * position comes separately and the screen highlights it from there.
 */
export class GetRankingUseCase implements UseCase<GetRankingInput, RankingView> {
  constructor(private readonly disposals: DisposalRepository) {}

  async execute(input: GetRankingInput = {}): Promise<Result<RankingView, AppError>> {
    const entries = await this.disposals.getRanking({ city: input.city, limit: input.limit ?? 20 });
    if (!entries.ok) return entries;

    const user = input.user;
    if (!user?.can('gamification:participate')) return ok({ entries: entries.value, me: null });

    // The highlight is a bonus: failing to load it never hides the ranking.
    const me = await this.disposals.getMyRanking(user.id);
    if (!me.ok) logger.warn('Posição no ranking indisponível', { code: me.error.code });

    return ok({ entries: entries.value, me: me.ok ? me.value : null });
  }
}
