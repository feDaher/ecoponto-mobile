import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TAB_BAR_HEIGHT } from '@/presentation/hooks/use-tab-bar-inset';
import { colors } from '@/presentation/theme/tokens';

/**
 * Main navigation.
 *
 * The four tabs mirror the functional scope (section 2.3 of the specification):
 * map lookup, educational content, gamification and user account.
 * Map and Education are public (RB01 and RB10) — only Profile requires sign-in.
 *
 * The bar floats over the content with rounded top corners. Because it is
 * absolutely positioned, every tab reserves its space with `useTabBarInset()`.
 */
export default function TabsLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { bottom } = useSafeAreaInsets();

  const backgroundColor = isDark ? colors.surface.darkMuted : colors.surface.light;
  const borderColor = isDark ? colors.border.dark : colors.border.light;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand[600],
        tabBarInactiveTintColor: isDark ? colors.text.darkMuted : colors.text.lightMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          height: TAB_BAR_HEIGHT + bottom,
          paddingTop: 8,
          paddingBottom: 8 + bottom,
        },
        tabBarBackground: () => (
          <View
            style={{
              flex: 1,
              backgroundColor,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              borderTopWidth: 1,
              borderLeftWidth: 1,
              borderRightWidth: 1,
              borderColor,
              overflow: 'hidden',
            }}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="map-marker-radius-outline"
              color={color as string}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="education"
        options={{
          title: 'Educação',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="book-open-variant" color={color as string} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="ranking"
        options={{
          title: 'Ranking',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="trophy-outline" color={color as string} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="account-circle-outline"
              color={color as string}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}
