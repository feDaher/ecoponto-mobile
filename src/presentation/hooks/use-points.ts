import { useQuery } from '@tanstack/react-query';

import type { PointDetails } from '@/application/use-cases/get-point-details.use-case';
import type { NearbyPoint } from '@/application/use-cases/list-nearby-points.use-case';
import type { Coordinate } from '@/domain/value-objects/coordinate';

import { useUseCases } from '../providers/container-provider';
import { useFiltersStore } from '../stores/filters.store';
import { queryKeys } from './query-keys';
import { unwrap } from './result';

/**
 * List of points for the map and the list (RB03 + RB07).
 *
 * The cache key includes the filters and the origin, so changing a category
 * chip or gaining GPS permission re-runs the search automatically.
 */
export function useNearbyPoints(origin: Coordinate | null) {
  const { listNearbyPoints } = useUseCases();
  const { categories, radiusKm, onlyOpen, searchTerm } = useFiltersStore();

  return useQuery<NearbyPoint[]>({
    queryKey: queryKeys.points.list({
      categories,
      radiusKm,
      onlyOpen,
      searchTerm: searchTerm.trim(),
      origin: origin ? { latitude: origin.latitude, longitude: origin.longitude } : null,
    }),
    queryFn: async () =>
      unwrap(
        await listNearbyPoints.execute({
          filter: {
            categories,
            radiusKm: radiusKm ?? undefined,
            onlyOpen,
            searchTerm: searchTerm.trim() || undefined,
            origin: origin ?? undefined,
          },
        }),
      ),
  });
}

/** Full point page (RB01 — public). */
export function usePointDetails(id: string | undefined, origin: Coordinate | null) {
  const { getPointDetails } = useUseCases();

  return useQuery<PointDetails>({
    queryKey: queryKeys.points.details(id ?? ''),
    enabled: Boolean(id),
    queryFn: async () => unwrap(await getPointDetails.execute({ id: id as string, origin })),
  });
}
