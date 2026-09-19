import { useQuery } from '@tanstack/react-query';

import type { DisposalSummary } from '@/application/use-cases/list-my-disposals.use-case';
import type { RankingEntry } from '@/domain/repositories/disposal.repository';

import { useUseCases } from '../providers/container-provider';
import { useSessionStore } from '../stores/session.store';
import { queryKeys } from './query-keys';
import { unwrap } from './result';

/** RB09 — public ranking of correct disposal. */
export function useRanking(city?: string) {
  const { getRanking } = useUseCases();

  return useQuery<RankingEntry[]>({
    queryKey: queryKeys.ranking(city),
    queryFn: async () => unwrap(await getRanking.execute({ city })),
  });
}

/** The authenticated citizen's history and progress. */
export function useMyDisposals() {
  const { listMyDisposals } = useUseCases();
  const user = useSessionStore((state) => state.user);

  return useQuery<DisposalSummary>({
    queryKey: queryKeys.disposals.mine(user?.id ?? ''),
    enabled: user !== null,
    queryFn: async () => unwrap(await listMyDisposals.execute(user)),
  });
}
