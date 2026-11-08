import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { View } from 'react-native';

import { AppText } from './text';

export type BadgeTone = 'success' | 'warning' | 'neutral' | 'info' | 'danger';

const STYLES: Record<BadgeTone, { container: string; text: string; icon: string }> = {
  success: {
    container: 'bg-brand-100 dark:bg-brand-900',
    text: 'text-brand-700 dark:text-brand-100',
    icon: '#047857',
  },
  warning: {
    container: 'bg-amber-100 dark:bg-amber-900/40',
    text: 'text-state-warning',
    icon: '#D97706',
  },
  neutral: {
    container: 'bg-black/5 dark:bg-white/10',
    text: 'text-content-light-muted dark:text-content-dark-muted',
    icon: '#5A655F',
  },
  info: {
    container: 'bg-tech-100 dark:bg-tech-700/30',
    text: 'text-tech-700 dark:text-tech-100',
    icon: '#1D4ED8',
  },
  danger: {
    container: 'bg-red-100 dark:bg-red-900/40',
    text: 'text-state-danger',
    icon: '#DC2626',
  },
};

export type BadgeProps = {
  label: string;
  tone?: BadgeTone;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
};

/** Status tag (open/closed, outdated, pending approval). */
export function Badge({ label, tone = 'neutral', icon }: BadgeProps) {
  const style = STYLES[tone];

  return (
    <View
      accessible
      accessibilityLabel={label}
      className={`flex-row items-center gap-1 self-start rounded-pill px-2 py-1 ${style.container}`}
    >
      {icon ? <MaterialCommunityIcons name={icon} size={13} color={style.icon} /> : null}
      <AppText variant="overline" className={style.text}>
        {label}
      </AppText>
    </View>
  );
}
