import { create } from 'zustand';

import type { WasteCategoryId } from '@/domain/value-objects/waste-category';

/** Radii offered in the UI (RB07 — geographic proximity in km). */
export const RADII_KM = [2, 5, 10, 25] as const;
export type RadiusKm = (typeof RADII_KM)[number];

type FiltersStore = {
  categories: WasteCategoryId[];
  radiusKm: RadiusKm | null;
  onlyOpen: boolean;
  searchTerm: string;
  toggleCategory: (category: WasteCategoryId) => void;
  setRadius: (radius: RadiusKm | null) => void;
  toggleOnlyOpen: () => void;
  setSearchTerm: (term: string) => void;
  clear: () => void;
};

const INITIAL_STATE = {
  categories: [] as WasteCategoryId[],
  radiusKm: null,
  onlyOpen: false,
  searchTerm: '',
};

/**
 * Map filters (RB07 — combinable: waste type + radius + search).
 *
 * Lives outside React Query because it's user input, not server data:
 * the filter state composes the query key, which re-runs the search by itself.
 */
export const useFiltersStore = create<FiltersStore>((set) => ({
  ...INITIAL_STATE,

  toggleCategory: (category) =>
    set((state) => ({
      categories: state.categories.includes(category)
        ? state.categories.filter((current) => current !== category)
        : [...state.categories, category],
    })),

  setRadius: (radiusKm) => set({ radiusKm }),

  toggleOnlyOpen: () => set((state) => ({ onlyOpen: !state.onlyOpen })),

  setSearchTerm: (searchTerm) => set({ searchTerm }),

  clear: () => set(INITIAL_STATE),
}));

/** How many filters are active — feeds the filter button badge. */
export function useActiveFilterCount(): number {
  return useFiltersStore(
    (state) =>
      state.categories.length +
      (state.radiusKm !== null ? 1 : 0) +
      (state.onlyOpen ? 1 : 0) +
      (state.searchTerm.trim() ? 1 : 0),
  );
}
