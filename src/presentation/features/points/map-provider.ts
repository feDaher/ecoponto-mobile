import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import { PROVIDER_DEFAULT, PROVIDER_GOOGLE, type MapViewProps } from 'react-native-maps';

type GoogleMapsFlags = { android?: boolean; ios?: boolean };

const flags = (Constants.expoConfig?.extra?.googleMaps ?? {}) as GoogleMapsFlags;
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/**
 * Which map engine the `MapView`s use.
 *
 *  - **Android:** always Google Maps (the only engine there). The key comes from
 *    `GOOGLE_MAPS_ANDROID_API_KEY`; on Expo Go, Expo's own key is used.
 *  - **iOS:** Google Maps only when the build was made with
 *    `GOOGLE_MAPS_IOS_API_KEY` (flag set by `app.config.ts`) and is not Expo Go,
 *    which does not ship the Google SDK on iOS. Otherwise Apple Maps, with no key.
 */
export const MAP_PROVIDER: MapViewProps['provider'] =
  Platform.OS === 'android' || (Platform.OS === 'ios' && flags.ios && !isExpoGo)
    ? PROVIDER_GOOGLE
    : PROVIDER_DEFAULT;

/**
 * `true` in a native Android build without a key: the Google SDK renders a blank
 * map, so the screen can warn the developer instead of failing silently.
 */
export const IS_ANDROID_MAPS_KEY_MISSING =
  Platform.OS === 'android' && !isExpoGo && flags.android === false;
