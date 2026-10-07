import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState } from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';

import { AppText } from './text';

export type PasswordInputProps = Omit<TextInputProps, 'secureTextEntry'> & {
  label: string;
  error?: string | null;
  hint?: string;
};

export function PasswordInput({
  label,
  error,
  hint,
  className = '',
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View className="gap-1.5">
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>

      <View className="relative justify-center">
        <TextInput
          accessibilityLabel={label}
          accessibilityHint={hint}
          secureTextEntry={!visible}
          placeholderTextColor="#9AA7A0"
          className={[
            'min-h-[52px] rounded-2xl border px-4 py-3 pr-12 text-body',
            'bg-surface-light text-content-light dark:bg-surface-dark-muted dark:text-content-dark',
            error ? 'border-state-danger' : 'border-black/10 dark:border-white/15',
            className,
          ].join(' ')}
          {...props}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Ocultar senha' : 'Mostrar senha'}
          accessibilityHint="Alterna a visibilidade da senha"
          hitSlop={12}
          onPress={() => setVisible((v) => !v)}
          className="absolute right-3 h-10 w-10 items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/10"
        >
          <MaterialCommunityIcons
            name={visible ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color="#5A655F"
          />
        </Pressable>
      </View>

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
