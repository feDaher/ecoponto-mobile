import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, View } from 'react-native';

import { AppText } from './text';

export type CheckboxProps = {
  label: string;
  checked: boolean;
  error?: string | null;
  onToggle: () => void;
};

export function Checkbox({ label, checked, error, onToggle }: CheckboxProps) {
  return (
    <View className="gap-1.5">
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={label}
        accessibilityState={{ checked }}
        onPress={onToggle}
        hitSlop={6}
        className="flex-row items-center gap-3"
      >
        <View
          className={[
            'h-6 w-6 items-center justify-center rounded-lg border',
            checked
              ? 'border-brand-600 bg-brand-600'
              : 'border-black/20 bg-surface-light dark:border-white/20 dark:bg-surface-dark-muted',
          ].join(' ')}
        >
          {checked ? <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" /> : null}
        </View>

        <AppText variant="body" className="flex-1">
          {label}
        </AppText>
      </Pressable>

      {error ? (
        <AppText variant="caption" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
