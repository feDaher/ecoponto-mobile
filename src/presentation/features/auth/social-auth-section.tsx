import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import { Pressable, useColorScheme, View } from 'react-native';

import { AppText } from '@/presentation/components/ui/text';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export type SocialAuthSectionProps = {
  onGooglePress?: () => void;
  onApplePress?: () => void;
};

export function SocialAuthSection({ onGooglePress, onApplePress }: SocialAuthSectionProps) {
  const scheme = useColorScheme();
  const appleColor = scheme === 'dark' ? '#FFFFFF' : '#111111';

  return (
    <View className="gap-4">
      <View className="-mx-11 flex-row items-center gap-3">
        <View className="h-px flex-1 bg-black/10 dark:bg-white/15" />
        <AppText variant="caption" tone="muted">
          Ou continue com
        </AppText>
        <View className="h-px flex-1 bg-black/10 dark:bg-white/15" />
      </View>

      <View className="flex-row gap-8">
        <SocialButton label="Google" icon="google" iconColor="#DB4437" onPress={onGooglePress} />
        <SocialButton label="Apple" icon="apple" iconColor={appleColor} onPress={onApplePress} />
      </View>
    </View>
  );
}

type SocialButtonProps = {
  label: string;
  icon: IconName;
  iconColor: string;
  onPress?: () => void;
};

function SocialButton({ label, icon, iconColor, onPress }: SocialButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Continuar com ${label}`}
      onPress={onPress}
      className={[
        'min-h-[48px] flex-1 flex-row items-center justify-center gap-2 rounded-xl border px-4',
        'border-brand-600/40 bg-surface-light active:bg-black/5 dark:bg-surface-dark-muted dark:active:bg-white/10',
      ].join(' ')}
    >
      <MaterialCommunityIcons name={icon} size={22} color={iconColor} />
      <AppText variant="body">{label}</AppText>
    </Pressable>
  );
}
