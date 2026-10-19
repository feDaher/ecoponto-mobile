import type { ConfigContext, ExpoConfig } from 'expo/config';

const APP_ID = 'br.edu.unifacig.ecoponto';

/**
 * Dynamic layer over `app.json` (Expo passes its content in `config`).
 *
 * Exists to read the native Google Maps keys from the environment. They have no
 * `EXPO_PUBLIC_` prefix on purpose: they go to the native config, never to the
 * JS bundle. Protection is the key restriction (package + SHA-1 / bundle id).
 *
 * The iOS key is optional: without it the map uses Apple Maps (`PROVIDER_DEFAULT`),
 * which needs no key and has no cost. Passing it makes the plugin add Google Maps
 * to the iOS build.
 *
 * Changing this file requires a new native build (`npx expo run:android` or EAS);
 * Expo Go ignores it and uses Expo's own key.
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
  plugins: [
    ...(config.plugins ?? []),
    [
      'react-native-maps',
      {
        androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY,
        ...(process.env.GOOGLE_MAPS_IOS_API_KEY
          ? { iosGoogleMapsApiKey: process.env.GOOGLE_MAPS_IOS_API_KEY }
          : {}),
      },
    ],
  ],
});
