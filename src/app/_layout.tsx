import '@/global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useRestoreSession } from '@/presentation/hooks/use-session';
import { ContainerProvider } from '@/presentation/providers/container-provider';
import { QueryProvider } from '@/presentation/providers/query-provider';
import { useSettingsStore } from '@/presentation/stores/settings.store';

/**
 * App root.
 *
 * Provider order matters: `ContainerProvider` (dependency injection) must
 * exist before `QueryProvider`, because the data hooks resolve use cases
 * through the container inside the queries.
 */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ContainerProvider>
          <QueryProvider>
            <Navigation />
          </QueryProvider>
        </ContainerProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function Navigation() {
  // Restores the persisted session before any routing decision.
  useRestoreSession();

  const themePreference = useSettingsStore((state) => state.themePreference);
  const { colorScheme, setColorScheme } = useColorScheme();

  // Applies the theme chosen in Settings (FE-15). On native, NativeWind forwards it
  // to `Appearance`, so React Native's own `useColorScheme` follows it too.
  useEffect(() => {
    setColorScheme(themePreference);
  }, [themePreference, setColorScheme]);

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: '600' },
          headerBackTitle: 'Voltar',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="point/[id]" options={{ title: 'Ponto de coleta' }} />
        <Stack.Screen name="disposal/[pointId]" options={{ title: 'Registrar descarte' }} />
        <Stack.Screen name="sign-in" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="sign-up" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
