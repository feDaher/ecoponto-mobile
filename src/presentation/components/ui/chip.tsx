import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable } from 'react-native';

import { AppText } from './text';

export type ChipProps = {
  label: string;
  selected?: boolean;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  /**
   * Icon after the label (e.g. `chevron-down`). Marks the chip as a trigger that
   * opens a picker, so it is announced as a button instead of a checkbox.
   */
  trailingIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
  /** Category color — used only when selected. */
  color?: string;
  onPress?: () => void;
};

/**
 * Filter chip (RB07).
 *
 * The selected state is conveyed by **color + border + `accessibilityState`**:
 * color alone doesn't work for people who can't tell shades apart.
 */
export function Chip({ label, selected = false, icon, trailingIcon, color, onPress }: ChipProps) {
  return (
    <Pressable
      accessibilityRole={trailingIcon ? 'button' : 'checkbox'}
      accessibilityLabel={label}
      accessibilityState={trailingIcon ? undefined : { checked: selected }}
      onPress={onPress}
      hitSlop={6}
      style={selected && color ? { backgroundColor: color, borderColor: color } : undefined}
      className={[
        'min-h-[40px] flex-row items-center gap-1.5 rounded-pill border px-3 py-2',
        selected
          ? 'border-brand-600 bg-brand-600'
          : 'border-black/10 bg-surface-light dark:border-white/15 dark:bg-surface-dark-muted',
      ].join(' ')}
    >
      {icon ? (
        <MaterialCommunityIcons name={icon} size={16} color={selected ? '#FFFFFF' : '#5A655F'} />
      ) : null}

      <AppText variant="caption" tone={selected ? 'inverse' : 'default'}>
        {label}
      </AppText>

      {trailingIcon ? (
        <MaterialCommunityIcons
          name={trailingIcon}
          size={16}
          color={selected ? '#FFFFFF' : '#5A655F'}
        />
      ) : null}
    </Pressable>
  );
}
