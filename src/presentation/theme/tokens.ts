/**
 * Design tokens in JS.
 *
 * The app's default styling is NativeWind (`className`). These values exist
 * only for APIs that **do not** accept classes: `react-native-maps` pins,
 * `StatusBar`, icon color props and the expo-router navigation theme.
 *
 * Keep in sync with `tailwind.config.js` — it's the same palette.
 */
export const colors = {
  brand: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    300: '#6EE7B7',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    900: '#064E3B',
  },
  tech: {
    100: '#DBEAFE',
    500: '#3B82F6',
    700: '#1D4ED8',
  },
  surface: {
    light: '#FFFFFF',
    lightMuted: '#F4F6F5',
    dark: '#0B0F0E',
    darkMuted: '#151B19',
  },
  text: {
    light: '#0B0F0E',
    lightMuted: '#5A655F',
    dark: '#F4F6F5',
    darkMuted: '#9AA7A0',
  },
  state: {
    success: '#16A34A',
    warning: '#D97706',
    danger: '#DC2626',
    info: '#0284C7',
  },
  border: {
    light: '#E3E8E5',
    dark: '#243029',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  card: 16,
  pill: 999,
} as const;

/** Initial map camera: Manhuaçu–MG with ~6 km of coverage. */
export const DEFAULT_REGION = {
  latitude: -20.2578,
  longitude: -42.0281,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
} as const;
