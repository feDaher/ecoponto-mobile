import type { ConfigContext, ExpoConfig } from 'expo/config';

const APP_ID = 'br.edu.unifacig.ecoponto';

/** Empty or whitespace-only values count as "not configured". */
function readKey(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

const androidGoogleMapsApiKey = readKey('GOOGLE_MAPS_ANDROID_API_KEY');
const iosGoogleMapsApiKey = readKey('GOOGLE_MAPS_IOS_API_KEY');

/**
 * Dynamic layer over `app.json` (Expo passes its content in `config`).
 *
 * Exists to read the native Google Maps keys from the environment (`.env.local`,
 * loaded by the Expo CLI). They have no `EXPO_PUBLIC_` prefix on purpose: they go
 * to the native config, never to the JS bundle. Protection is the key restriction
 * (package + SHA-1 / bundle id).
 *
 * The iOS key is optional: without it the map uses Apple Maps (`PROVIDER_DEFAULT`),
 * which needs no key and has no cost. Passing it makes the plugin add Google Maps
 * to the iOS build, and `extra.googleMaps.ios` tells the JS side to switch the
 * provider (see `presentation/features/points/map-provider.ts`). Like any native
 * Maps key, it still ends up readable inside the binary: restrict it.
 *
 * Changing this file or the keys requires a new native build (`npx expo run:android`
 * or EAS); Expo Go ignores it and uses Expo's own key.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'ecoponto-mobile',
  slug: config.slug ?? 'ecoponto-mobile',
  android: {
    ...config.android,
    package: APP_ID,
  },
  ios: {
    ...config.ios,
    bundleIdentifier: APP_ID,
  },
  extra: {
    ...config.extra,
    googleMaps: {
      android: Boolean(androidGoogleMapsApiKey),
      ios: Boolean(iosGoogleMapsApiKey),
    },
  },
  plugins: [
    ...(config.plugins ?? []),
    [
      'react-native-maps',
      {
        ...(androidGoogleMapsApiKey ? { androidGoogleMapsApiKey } : {}),
        ...(iosGoogleMapsApiKey ? { iosGoogleMapsApiKey } : {}),
      },
    ],
  ],
});
