import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
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
 */
export default function AppSplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.replace('/home'), SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, [router]);

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
