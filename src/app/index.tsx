import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef } from 'react';
import { Image, StyleSheet, View } from 'react-native';

/** Time the branded screen stays up before the map opens. */
const SPLASH_DURATION_MS = 2500;

/**
 * Branded opening screen, mounted at `/` so it is the first route on every launch.
 *
 * The native splash (`expo-splash-screen` in `app.json`) uses the same green and
 * symbol, so the switch from it to this full artwork is seamless. `replace` drops
 * this screen from history: Android's back button on the map closes the app
 * instead of returning here.
 *
 * The timer only runs while this screen is focused. When a notification tap opens
 * the app (FE-12), `usePushNotifications` pushes the target screen on top of this
 * one; a timer that kept running would `replace` that screen with the map. Coming
 * back to the splash after it was already shown goes straight to the map.
 */
export default function AppSplashScreen() {
  const router = useRouter();
  const wasShown = useRef(false);

  useFocusEffect(
    useCallback(() => {
      const delay = wasShown.current ? 0 : SPLASH_DURATION_MS;
      wasShown.current = true;

      const timer = setTimeout(() => router.replace('/home'), delay);
      return () => clearTimeout(timer);
    }, [router]),
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false, animation: 'fade' }} />

      <Image
        source={require('../../assets/images/splash-background.png')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        accessibilityLabel="EcoPonto"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Same green as the artwork, so no flash shows while the image decodes.
    backgroundColor: '#5D8C6F',
  },
});
