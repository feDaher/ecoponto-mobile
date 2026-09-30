import type { AppError } from '@/core/errors';
import { ok, type Result } from '@/core/result';
import type { CollectionPoint } from '@/domain/entities/collection-point';
import type {
  CollectionPointRepository,
  PointFilter,
} from '@/domain/repositories/collection-point.repository';
import type { Coordinate } from '@/domain/value-objects/coordinate';

import type { UseCase } from './use-case';

/** Read model consumed by the map and the list. */
export type NearbyPoint = {
  readonly point: CollectionPoint;
  /** `null` when there is no origin (location permission denied). */
  readonly distanceKm: number | null;
  readonly isOpenNow: boolean;
  /** RB06 — "possibly outdated information". */
  readonly isInfoOutdated: boolean;
};

export type ListNearbyPointsInput = {
  readonly filter: Omit<PointFilter, 'statuses'>;
  /** Injectable in tests to freeze "now". */
  readonly now?: Date;
};

/**
 * RB07 — Filter and search by proximity, waste type and city/neighborhood.
 * RB03 — Only approved points reach the public map.
 * RB01 — Public lookup: no session check here.
 */
export class ListNearbyPointsUseCase implements UseCase<ListNearbyPointsInput, NearbyPoint[]> {
  constructor(private readonly points: CollectionPointRepository) {}

  async execute(input: ListNearbyPointsInput): Promise<Result<NearbyPoint[], AppError>> {
    const now = input.now ?? new Date();
    const { origin, radiusKm, onlyOpen, categories } = input.filter;

    // RB03: the status is enforced here, not by the screen — no call can
    // request pending points through this path.
    const result = await this.points.list({ ...input.filter, statuses: ['approved'] });
    if (!result.ok) return result;

    const list = result.value
      // Safety net: a backend that ignores filters does not break the rules.
      .filter((point) => point.isVisibleOnMap)
      .filter((point) => point.acceptsAny(categories ?? []))
      .filter((point) => point.isLocatedIn(input.filter))
      .map((point) => toNearbyPoint(point, origin, now))
      .filter((item) => isWithinRadius(item.distanceKm, radiusKm))
      .filter((item) => !onlyOpen || item.isOpenNow)
      .sort(compare);

    return ok(list);
  }
}

function toNearbyPoint(
  point: CollectionPoint,
  origin: Coordinate | undefined,
  now: Date,
): NearbyPoint {
  return {
    point,
    distanceKm: origin ? point.distanceKmFrom(origin) : null,
    isOpenNow: point.isOpenAt(now),
    isInfoOutdated: point.isInfoOutdated(now),
  };
}

function isWithinRadius(distanceKm: number | null, radiusKm: number | undefined): boolean {
  if (radiusKm === undefined || distanceKm === null) return true;
  return distanceKm <= radiusKm;
}

/**
 * Without a known origin, the order is alphabetical. With an origin, the
 * closest come first and, among equal distances, those open now go first.
 */
function compare(a: NearbyPoint, b: NearbyPoint): number {
  if (a.distanceKm === null || b.distanceKm === null) {
    return a.point.name.localeCompare(b.point.name, 'pt-BR');
  }

  if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
  return Number(b.isOpenNow) - Number(a.isOpenNow);
}
