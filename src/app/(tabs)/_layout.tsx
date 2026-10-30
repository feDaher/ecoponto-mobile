import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Tabs } from 'expo-router';
import { useColorScheme, View } from 'react-native';

import { colors } from '@/presentation/theme/tokens';

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const backgroundColor = isDark ? colors.surface.darkMuted : colors.surface.light;
  const borderColor = isDark ? colors.border.dark : colors.border.light;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand[600],
        tabBarInactiveTintColor: isDark ? colors.text.darkMuted : colors.text.lightMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          height: 76,
          paddingTop: 8,
          paddingBottom: 8,
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
              size={size}
              color={typeof color === 'string' ? color : '#000000'}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="education"
        options={{
          title: 'Educação',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="book-open-variant"
              size={size}
              color={typeof color === 'string' ? color : '#000000'}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="ranking"
        options={{
          title: 'Ranking',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="trophy-outline"
              size={size}
              color={typeof color === 'string' ? color : '#000000'}
            />
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
              size={size}
              color={typeof color === 'string' ? color : '#000000'}
            />
          ),
        }}
      />
    </Tabs>
  );
}
