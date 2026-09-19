import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ActivityIndicator, View } from 'react-native';

import { getErrorMessage } from '../../hooks/result';
import { Button } from './button';
import { AppText } from './text';

/** Centered loading indicator, with a label for screen readers. */
export function Loading({ label = 'Carregando' }: { label?: string }) {
  return (
    <View
      className="flex-1 items-center justify-center gap-3 p-6"
      accessible
      accessibilityLabel={label}
    >
      <ActivityIndicator size="large" color="#059669" />
      <AppText variant="caption" tone="muted">
        {label}…
      </AppText>
    </View>
  );
}

export type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  action?: { title: string; onPress: () => void };
};

/** List with no results — always with a way out, never a dead end. */
export function EmptyState({
  title,
  description,
  icon = 'map-search-outline',
  action,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center gap-3 p-8">
      <MaterialCommunityIcons name={icon} size={44} color="#9AA7A0" />
      <AppText variant="heading" className="text-center">
        {title}
      </AppText>
      {description ? (
        <AppText variant="body" tone="muted" className="text-center">
          {description}
        </AppText>
      ) : null}
      {action ? (
        <Button title={action.title} variant="outline" onPress={action.onPress} className="mt-2" />
      ) : null}
    </View>
  );
}

/**
 * Loading failure.
 *
 * Shows the already translated `AppError` message — never the stack or the
 * raw response body — and offers "Tentar novamente" as the main action.
 */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <View className="flex-1 items-center justify-center gap-3 p-8">
      <MaterialCommunityIcons name="alert-circle-outline" size={44} color="#DC2626" />
      <AppText variant="heading" className="text-center">
        Não foi possível carregar
      </AppText>
      <AppText variant="body" tone="muted" className="text-center">
        {getErrorMessage(error)}
      </AppText>
      {onRetry ? (
        <Button
          title="Tentar novamente"
          variant="outline"
          icon="refresh"
          onPress={onRetry}
          className="mt-2"
        />
      ) : null}
    </View>
  );
}
