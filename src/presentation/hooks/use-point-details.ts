import { useQuery } from '@tanstack/react-query';

import { useUseCases } from '@/presentation/providers/container-provider';

import { unwrap } from './result';

export function usePointDetails(id: string) {
  const { getPointDetails } = useUseCases();

  return useQuery({
    queryKey: ['collection-point', id],
    queryFn: async () => unwrap(await getPointDetails.execute({ id })),
    enabled: Boolean(id),
  });
}
