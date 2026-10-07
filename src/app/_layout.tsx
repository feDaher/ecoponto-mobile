import '@/global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ContainerProvider } from '@/presentation/providers/container-provider';
import { QueryProvider } from '@/presentation/providers/query-provider';
import { useRestoreSession } from '@/presentation/hooks/use-session';

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

  return (
    <>
      <StatusBar style="auto" />

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
        <Stack.Screen name="sign-in" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="sign-up" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
