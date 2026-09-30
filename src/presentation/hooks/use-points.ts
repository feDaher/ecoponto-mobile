import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type { PointDetails } from '@/application/use-cases/get-point-details.use-case';
import type { NearbyPoint } from '@/application/use-cases/list-nearby-points.use-case';
import type { Coordinate } from '@/domain/value-objects/coordinate';

import { collectRegions, type RegionOptions } from '../features/points/regions';
import { useUseCases } from '../providers/container-provider';
import { useFiltersStore } from '../stores/filters.store';
import { queryKeys } from './query-keys';
import { unwrap } from './result';

/**
 * List of points for the map and the list (RB03 + RB07).
 *
 * The cache key includes the filters and the origin, so changing a chip or
 * gaining GPS permission re-runs the search automatically. The previous result
 * stays on screen while the new one loads, so filtering never blanks the map.
 */
export function useNearbyPoints(origin: Coordinate | null) {
  const { listNearbyPoints } = useUseCases();
  const { categories, radiusKm, onlyOpen, city, neighborhood, searchTerm } = useFiltersStore();

  return useQuery<NearbyPoint[]>({
    placeholderData: keepPreviousData,
    queryKey: queryKeys.points.list({
      categories,
      radiusKm,
      onlyOpen,
      city,
      neighborhood,
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
            city: city ?? undefined,
            neighborhood: neighborhood ?? undefined,
            searchTerm: searchTerm.trim() || undefined,
            origin: origin ?? undefined,
          },
        }),
      ),
  });
}

/**
 * RB07 — cities and neighborhoods offered by the region filter.
 * Built from every approved point (unfiltered), so options don't vanish as
 * other filters are applied.
 */
export function useRegionOptions() {
  const { listNearbyPoints } = useUseCases();

  return useQuery<RegionOptions>({
    queryKey: queryKeys.points.regions,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const items = unwrap(await listNearbyPoints.execute({ filter: {} }));
      return collectRegions(items.map((item) => item.point));
    },
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
