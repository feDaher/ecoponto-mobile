import type { AppError } from '@/core/errors';
import type { Result } from '@/core/result';
import type { DisposalRepository, RankingEntry } from '@/domain/repositories/disposal.repository';

import type { UseCase } from './use-case';

export type GetRankingInput = {
  readonly city?: string;
  readonly limit?: number;
};

/** RB09 — recognition through ranking. */
export class GetRankingUseCase implements UseCase<GetRankingInput, RankingEntry[]> {
  constructor(private readonly disposals: DisposalRepository) {}

  execute(input: GetRankingInput = {}): Promise<Result<RankingEntry[], AppError>> {
    return this.disposals.getRanking({ city: input.city, limit: input.limit ?? 20 });
  }
}
