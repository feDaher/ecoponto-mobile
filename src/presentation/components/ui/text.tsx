import { Text, type TextProps } from 'react-native';

export type TextVariant = 'display' | 'title' | 'heading' | 'body' | 'caption' | 'overline';
export type TextTone = 'default' | 'muted' | 'brand' | 'danger' | 'warning' | 'inverse';

const VARIANTS: Record<TextVariant, string> = {
  display: 'text-display',
  title: 'text-title',
  heading: 'text-heading',
  body: 'text-body',
  caption: 'text-caption',
  overline: 'text-overline uppercase tracking-wide',
};

const TONES: Record<TextTone, string> = {
  default: 'text-content-light dark:text-content-dark',
  muted: 'text-content-light-muted dark:text-content-dark-muted',
  brand: 'text-brand-700 dark:text-brand-300',
  danger: 'text-state-danger',
  warning: 'text-state-warning',
  inverse: 'text-white',
};

export type AppTextProps = TextProps & {
  variant?: TextVariant;
  tone?: TextTone;
  className?: string;
};

/**
 * System text.
 *
 * It exists so that size and color always come from the theme scale — a loose
 * `<Text>` with `text-[15px]` breaks consistency and legibility in dark
 * mode. Accepts `className` for one-off tweaks (alignment, margin).
 */
export function AppText({
  variant = 'body',
  tone = 'default',
  className = '',
  ...props
}: AppTextProps) {
  return <Text className={`${VARIANTS[variant]} ${TONES[tone]} ${className}`} {...props} />;
}
