import { normalizeText } from '@/core/text';
import type { CollectionPoint } from '@/domain/entities/collection-point';

export type NeighborhoodOption = { readonly name: string; readonly pointCount: number };

export type CityOption = {
  readonly name: string;
  readonly pointCount: number;
  /** Alphabetical. */
  readonly neighborhoods: readonly NeighborhoodOption[];
};

/** Alphabetical by city. */
export type RegionOptions = readonly CityOption[];

/**
 * RB07 — region filter options, derived from the approved points themselves.
 *
 * Offering only places that have points means picking a region can never lead
 * to an empty map on its own, and there is no free text to mistype. The point
 * counts help the user choose before tapping.
 */
export function collectRegions(points: readonly CollectionPoint[]): RegionOptions {
  const byCity = new Map<string, { count: number; neighborhoods: Map<string, number> }>();

  for (const point of points) {
    const city = byCity.get(point.city) ?? { count: 0, neighborhoods: new Map() };
    city.count += 1;
    if (point.neighborhood) {
      city.neighborhoods.set(
        point.neighborhood,
        (city.neighborhoods.get(point.neighborhood) ?? 0) + 1,
      );
    }
    byCity.set(point.city, city);
  }

  return [...byCity.entries()]
    .map(([name, city]) => ({
      name,
      pointCount: city.count,
      neighborhoods: [...city.neighborhoods.entries()]
        .map(([neighborhood, pointCount]) => ({ name: neighborhood, pointCount }))
        .sort((a, b) => byName(a.name, b.name)),
    }))
    .sort((a, b) => byName(a.name, b.name));
}

/**
 * Search inside the picker. A city that matches keeps all its neighborhoods;
 * otherwise only the matching neighborhoods stay. Accent- and case-insensitive.
 */
export function searchRegions(options: RegionOptions, query: string): RegionOptions {
  const wanted = normalizeText(query);
  if (!wanted) return options;

  return options
    .map((city) =>
      normalizeText(city.name).includes(wanted)
        ? city
        : {
            ...city,
            neighborhoods: city.neighborhoods.filter((n) => normalizeText(n.name).includes(wanted)),
          },
    )
    .filter((city) => normalizeText(city.name).includes(wanted) || city.neighborhoods.length > 0);
}

/** A region filter is only useful when there is more than one place to choose from. */
export function hasRegionChoice(options: RegionOptions): boolean {
  return options.length > 1 || (options[0]?.neighborhoods.length ?? 0) > 1;
}

/** "Coqueiro · Manhuaçu", "Manhuaçu" or `null` when no region is selected. */
export function regionLabel(city: string | null, neighborhood: string | null): string | null {
  if (neighborhood && city) return `${neighborhood} · ${city}`;
  return neighborhood ?? city;
}

function byName(a: string, b: string): number {
  return a.localeCompare(b, 'pt-BR');
}
