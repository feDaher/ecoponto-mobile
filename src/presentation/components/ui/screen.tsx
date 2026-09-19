import type { ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { AppText } from './text';

export type ScreenProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  /** Safe edges respected. The default covers the notch and the bottom bar. */
  edges?: readonly Edge[];
  className?: string;
  /** Screens with a full-screen map must not have side padding. */
  noPadding?: boolean;
};

/** Base container for every screen: background, safe area and optional header. */
export function Screen({
  children,
  title,
  subtitle,
  edges = ['top'],
  className = '',
  noPadding = false,
}: ScreenProps) {
  return (
    <SafeAreaView edges={edges} className="flex-1 bg-surface-light-muted dark:bg-surface-dark">
      {title ? (
        <View className="gap-1 px-4 pb-3 pt-2">
          <AppText variant="display">{title}</AppText>
          {subtitle ? (
            <AppText variant="body" tone="muted">
              {subtitle}
            </AppText>
          ) : null}
        </View>
      ) : null}

      <View className={`flex-1 ${noPadding ? '' : 'px-4'} ${className}`}>{children}</View>
    </SafeAreaView>
  );
}
