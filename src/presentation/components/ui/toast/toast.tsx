import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';

import { colors } from '@/presentation/theme/tokens';

import { AppText } from '../text';
import type { Toast, ToastType } from './toast.store';

const STYLES: Record<
  ToastType,
  { block: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; iconColor: string }
> = {
  danger: { block: colors.state.danger, icon: 'close-circle-outline', iconColor: '#FFFFFF' },
  // Dark icon on yellow: white fails contrast there.
  warning: { block: '#F5B027', icon: 'alert-outline', iconColor: colors.text.light },
  info: { block: colors.state.info, icon: 'information-outline', iconColor: '#FFFFFF' },
  success: { block: colors.state.success, icon: 'check', iconColor: '#FFFFFF' },
};

/** Spoken prefix — the color alone does not say what kind of message this is. */
const TYPE_LABEL: Record<ToastType, string> = {
  danger: 'Erro',
  warning: 'Atenção',
  info: 'Aviso',
  success: 'Sucesso',
};

export type ToastCardProps = {
  toast: Toast;
  onDismiss: (id: string) => void;
};

/**
 * One toast: solid colored block with the type icon on the left, bold title
 * (optional) and message on the right, close button in the top-right corner.
 */
export function ToastCard({ toast, onDismiss }: ToastCardProps) {
  const { id, type, title, message, durationMs, onPress } = toast;
  const style = STYLES[type];

  useEffect(() => {
    if (durationMs <= 0) return;
    const timer = setTimeout(() => onDismiss(id), durationMs);
    return () => clearTimeout(timer);
  }, [id, durationMs, onDismiss]);

  const handlePress = onPress
    ? () => {
        onDismiss(id);
        onPress();
      }
    : undefined;

  return (
    <Pressable
      onPress={handlePress}
      disabled={!handlePress}
      accessibilityRole={handlePress ? 'button' : 'alert'}
      accessibilityLiveRegion="polite"
      accessibilityLabel={[TYPE_LABEL[type], title, message].filter(Boolean).join('. ')}
      accessibilityHint={handlePress ? 'Toque para abrir' : undefined}
      // Shadow on the outer view, clipping on the inner one: `overflow-hidden` on the
      // same view would cut the iOS shadow off.
      className="rounded-md bg-surface-light shadow-md active:opacity-90 dark:bg-surface-dark-muted"
      style={{ elevation: 4 }}
    >
      <View className="min-h-[72px] flex-row overflow-hidden rounded-md border border-black/10 dark:border-white/10">
        <View className="w-16 items-center justify-center" style={{ backgroundColor: style.block }}>
          <MaterialCommunityIcons name={style.icon} size={30} color={style.iconColor} />
        </View>

        <View className="flex-1 justify-center gap-0.5 py-3 pl-4 pr-10">
          {title ? (
            <AppText variant="body" className="font-bold" numberOfLines={1}>
              {title}
            </AppText>
          ) : null}
          <AppText variant="body" numberOfLines={3}>
            {message}
          </AppText>
        </View>
      </View>

      <Pressable
        onPress={() => onDismiss(id)}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Fechar aviso"
        className="absolute right-2 top-2 p-1"
      >
        <MaterialCommunityIcons name="close" size={18} color={colors.text.lightMuted} />
      </Pressable>
    </Pressable>
  );
}
