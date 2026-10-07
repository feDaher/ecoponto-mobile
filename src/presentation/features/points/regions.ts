import { normalizeText } from '@/core/text';
import type { CollectionPoint } from '@/domain/entities/collection-point';

export type NeighborhoodOption = { readonly name: string; readonly pointCount: number };

export type CityOption = {
  readonly name: string;
  readonly pointCount: number;
  readonly neighborhoods: readonly NeighborhoodOption[];
};

export type RegionOptions = readonly CityOption[];

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

export function hasRegionChoice(options: RegionOptions): boolean {
  return options.length > 1 || (options[0]?.neighborhoods.length ?? 0) > 1;
}

export function regionLabel(city: string | null, neighborhood: string | null): string | null {
  if (neighborhood && city) return `${neighborhood} · ${city}`;
  return neighborhood ?? city;
}

function byName(a: string, b: string): number {
  return a.localeCompare(b, 'pt-BR');
}
