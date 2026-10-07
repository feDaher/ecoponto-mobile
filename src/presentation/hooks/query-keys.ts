import type { WasteCategoryId } from '@/domain/value-objects/waste-category';

/**
 * Centralized cache keys.
 *
 * Keeping them in one place avoids the classic mistake of invalidating
 * `['points']` while the query uses `['collection-points']` — and the data never updating.
 */
export const queryKeys = {
  points: {
    all: ['points'] as const,
    list: (filter: {
      categories: readonly WasteCategoryId[];
      radiusKm: number | null;
      onlyOpen: boolean;
      city: string | null;
      neighborhood: string | null;
      searchTerm: string;
      origin: { latitude: number; longitude: number } | null;
    }) => ['points', 'list', filter] as const,
    regions: ['points', 'regions'] as const,
    details: (id: string) => ['points', 'details', id] as const,
  },
  disposals: {
    mine: (userId: string) => ['disposals', 'mine', userId] as const,
  },
  ranking: (city?: string) => ['ranking', city ?? 'overall'] as const,
  contents: (category?: WasteCategoryId) => ['contents', category ?? 'all'] as const,
  session: ['session'] as const,
} as const;
