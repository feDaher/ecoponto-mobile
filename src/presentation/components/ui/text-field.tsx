import { TextInput, View, type TextInputProps } from 'react-native';

import { AppText } from './text';

export type TextFieldProps = TextInputProps & {
  label: string;
  error?: string | null;
  hint?: string;
};

/**
 * Form field.
 *
 * The label is always visible (not just a placeholder): the placeholder
 * disappears when typing and leaves the user unsure of what they filled in. The
 * error is announced through `accessibilityLiveRegion`.
 */
export function TextField({ label, error, hint, className = '', ...props }: TextFieldProps) {
  return (
    <View className="gap-1.5">
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>

      <TextInput
        accessibilityLabel={label}
        accessibilityHint={hint}
        placeholderTextColor="#9AA7A0"
        className={[
          'min-h-[52px] rounded-2xl border px-4 py-3 text-body',
          'bg-surface-light text-content-light dark:bg-surface-dark-muted dark:text-content-dark',
          error ? 'border-state-danger' : 'border-black/10 dark:border-white/15',
          className,
        ].join(' ')}
        {...props}
      />

      {error ? (
        <AppText variant="caption" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" tone="muted">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}
