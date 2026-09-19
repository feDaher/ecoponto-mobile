import { useQuery } from '@tanstack/react-query';

import type { EducationalContent } from '@/domain/repositories/educational-content.repository';
import type { WasteCategoryId } from '@/domain/value-objects/waste-category';

import { useUseCases } from '../providers/container-provider';
import { queryKeys } from './query-keys';
import { unwrap } from './result';

/** RB10 — educational content, accessible without sign-up. */
export function useEducationalContent(category?: WasteCategoryId) {
  const { listEducationalContent } = useUseCases();

  return useQuery<EducationalContent[]>({
    queryKey: queryKeys.contents(category),
    // Editorial content changes rarely: worth keeping it fresh for longer.
    staleTime: 15 * 60 * 1000,
    queryFn: async () => unwrap(await listEducationalContent.execute({ category })),
  });
}
