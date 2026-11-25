import { KeyboardAwareScrollView } from '@/presentation/components/ui/keyboard-aware-scroll-view';
import { AppText } from '@/presentation/components/ui/text';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StatusBar } from 'expo-status-bar';
import type { ComponentProps, ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export type AuthLayoutProps = {
  title: string;
  subtitle: string;
  icon?: IconName;
  children: ReactNode;
};

export function AuthLayout({ title, subtitle, icon, children }: AuthLayoutProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-brand-600">
      <StatusBar style="light" />

      <KeyboardAwareScrollView
        bounces={false}
        contentContainerClassName="grow"
        showsVerticalScrollIndicator={false}
      >
        <View className="grow">
          <View
            className="grow justify-end overflow-hidden px-10 pb-8"
            style={{ paddingTop: insets.top + 8 }}
          >
            {icon ? (
              <View
                className="mb-4 items-center"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                <MaterialCommunityIcons name={icon} size={88} color="#FFFFFF" />
              </View>
            ) : null}

            <View className="gap-1">
              <AppText variant="display" tone="inverse" accessibilityRole="header">
                {title}
              </AppText>
              <AppText variant="body" tone="inverse" className="opacity-90">
                {subtitle}
              </AppText>
            </View>
          </View>

          <View
            className="rounded-t-[40px] bg-surface-light px-11 pt-10 dark:bg-surface-dark"
            style={{ paddingBottom: insets.bottom + 16 }}
          >
            {children}
          </View>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}
