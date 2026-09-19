import { Pressable, View, type ViewProps } from 'react-native';
import type { ReactNode } from 'react';

export type CardProps = ViewProps & {
  children: ReactNode;
  className?: string;
  /** When provided, the whole card becomes a touch target. */
  onPress?: () => void;
};

const BASE =
  'rounded-card border border-black/5 bg-surface-light p-4 dark:border-white/10 dark:bg-surface-dark-muted';

/** Default content surface. Every list in the app uses this container. */
export function Card({
  children,
  className = '',
  onPress,
  accessibilityLabel,
  ...props
}: CardProps) {
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        className={`${BASE} active:opacity-80 ${className}`}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View className={`${BASE} ${className}`} accessibilityLabel={accessibilityLabel} {...props}>
      {children}
    </View>
  );
}
