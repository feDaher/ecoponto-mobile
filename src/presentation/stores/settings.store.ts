import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemePreference = 'system' | 'light' | 'dark';

type SettingsStore = {
  themePreference: ThemePreference;
  setThemePreference: (theme: ThemePreference) => void;
  resetSettings: () => void;
};

const INITIAL_STATE = {
  themePreference: 'system' as ThemePreference,
};

/**
 * App settings.
 *
 * Stores user preferences locally so they remain available
 * after closing and reopening the application.
 */
export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,

      setThemePreference: (themePreference) => set({ themePreference }),

      resetSettings: () => set(INITIAL_STATE),
    }),
    {
      name: 'ecoponto-settings',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      partialize: (state) => ({
        themePreference: state.themePreference,
      }),
    },
  ),
);
