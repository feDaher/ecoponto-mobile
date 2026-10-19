import type { PlaceDetailsDtoInput, PlaceSuggestionDtoInput } from '../dto/api.schemas';

export type DemoPlace = PlaceSuggestionDtoInput & { details: PlaceDetailsDtoInput };

/**
 * Addresses of Manhuaçu–MG for the demo mode address search.
 *
 * Neighborhoods are centered on the seed points (`demo-data.ts`) with a small
 * viewport, so picking one frames those points. Coordinates are approximate,
 * except Praça Cordovil, which came from a real Places API response.
 */
export const DEMO_PLACES: DemoPlace[] = [
  {
    placeId: 'demo-praca-cordovil',
    title: 'Praça Cordovil Pinto Coelho',
    subtitle: 'Centro, Manhuaçu - MG',
    details: {
      label: 'Praça Cordovil Pinto Coelho, 170 - Centro, Manhuaçu - MG, 36905-000, Brasil',
      latitude: -20.258442,
      longitude: -42.0344089,
      viewport: {
        southWest: { latitude: -20.2593286, longitude: -42.0355742 },
        northEast: { latitude: -20.2566306, longitude: -42.0328763 },
      },
    },
  },
  {
    placeId: 'demo-unifacig',
    title: 'UNIFACIG',
    subtitle: 'Av. Getúlio Vargas - Coqueiro, Manhuaçu - MG',
    details: {
      label: 'Av. Getúlio Vargas - Coqueiro, Manhuaçu - MG, Brasil',
      latitude: -20.2632,
      longitude: -42.0338,
    },
  },
  neighborhood('centro', 'Centro', -20.2573, -42.0283),
  neighborhood('coqueiro', 'Coqueiro', -20.2632, -42.0338),
  neighborhood('sao-vicente', 'São Vicente', -20.2497, -42.0224),
  neighborhood('baixada', 'Baixada', -20.2649, -42.0197),
  neighborhood('santa-luzia', 'Santa Luzia', -20.2704, -42.0412),
  neighborhood('realeza', 'Realeza', -20.2455, -42.0345),
  {
    placeId: 'demo-manhuacu',
    title: 'Manhuaçu',
    subtitle: 'MG, Brasil',
    details: {
      label: 'Manhuaçu - MG, 36900-000, Brasil',
      latitude: -20.2577,
      longitude: -42.0336,
      viewport: {
        southWest: { latitude: -20.29, longitude: -42.07 },
        northEast: { latitude: -20.22, longitude: -41.99 },
      },
    },
  },
];

function neighborhood(slug: string, name: string, latitude: number, longitude: number): DemoPlace {
  const delta = 0.006;

  return {
    placeId: `demo-${slug}`,
    title: name,
    subtitle: 'Manhuaçu - MG',
    details: {
      label: `${name}, Manhuaçu - MG, Brasil`,
      latitude,
      longitude,
      viewport: {
        southWest: { latitude: latitude - delta, longitude: longitude - delta },
        northEast: { latitude: latitude + delta, longitude: longitude + delta },
      },
    },
  };
}
