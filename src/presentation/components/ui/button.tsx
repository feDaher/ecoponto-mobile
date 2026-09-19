import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ActivityIndicator, Pressable, View, type PressableProps } from 'react-native';

import { AppText } from './text';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'lg';

const CONTAINER: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 active:bg-brand-700',
  secondary: 'bg-brand-100 active:bg-brand-200 dark:bg-brand-900 dark:active:bg-brand-800',
  outline:
    'border border-brand-600 dark:border-brand-300 active:bg-brand-50 dark:active:bg-brand-900',
  ghost: 'active:bg-black/5 dark:active:bg-white/10',
  danger: 'bg-state-danger active:opacity-90',
};

const LABEL: Record<ButtonVariant, string> = {
  primary: 'text-white',
  secondary: 'text-brand-700 dark:text-brand-100',
  outline: 'text-brand-700 dark:text-brand-300',
  ghost: 'text-content-light dark:text-content-dark',
  danger: 'text-white',
};

const ICON_COLOR: Record<ButtonVariant, string> = {
  primary: '#FFFFFF',
  secondary: '#047857',
  outline: '#047857',
  ghost: '#5A655F',
  danger: '#FFFFFF',
};

// 48dp minimum height: above the 44dp touch target recommended by the
// accessibility guidelines of both platforms.
const SIZES: Record<ButtonSize, string> = {
  md: 'min-h-[48px] px-4',
  lg: 'min-h-[56px] px-5',
};

export type ButtonProps = Omit<PressableProps, 'children'> & {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
};

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  fullWidth = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: Boolean(inactive), busy: loading }}
      disabled={inactive}
      className={[
        'flex-row items-center justify-center gap-2 rounded-2xl',
        CONTAINER[variant],
        SIZES[size],
        fullWidth ? 'w-full' : '',
        inactive ? 'opacity-50' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={ICON_COLOR[variant]} />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon ? (
            <MaterialCommunityIcons name={icon} size={20} color={ICON_COLOR[variant]} />
          ) : null}
          <AppText variant="heading" className={LABEL[variant]}>
            {title}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}
