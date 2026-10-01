import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, View } from 'react-native';

import type { EducationalContent } from '@/domain/repositories/educational-content.repository';
import { getCategory } from '@/domain/value-objects/waste-category';

import { AppText } from '../../components/ui/text';

export function ContentCard({
  content,
  onPress,
}: {
  content: EducationalContent;
  onPress: () => void;
}) {
  const category = getCategory(content.category);
  const steps = content.howToDispose.length;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${content.title}. ${category.name}. Toque para ver o guia completo.`}
      onPress={onPress}
      className="flex-1 overflow-hidden rounded-card border border-black/5 bg-surface-light active:opacity-80 dark:border-white/10 dark:bg-surface-dark-muted"
    >
      <View
        style={{ backgroundColor: `${category.color}1A` }}
        className="h-28 items-center justify-center"
      >
        <MaterialCommunityIcons name={category.icon as never} size={44} color={category.color} />

        <View className="absolute right-3 top-3 rounded-pill bg-surface-light/90 px-2.5 py-1 dark:bg-surface-dark/80">
          <AppText variant="overline" style={{ color: category.color }}>
            {category.name}
          </AppText>
        </View>
      </View>

      <View className="flex-1 gap-1.5 p-4">
        <AppText variant="heading" numberOfLines={2}>
          {content.title}
        </AppText>
        <AppText variant="caption" tone="muted" numberOfLines={3} className="flex-1">
          {content.summary}
        </AppText>

        <View className="mt-2 flex-row items-center justify-between">
          <View className="flex-row items-center gap-1">
            <MaterialCommunityIcons name="format-list-numbered" size={14} color="#5A655F" />
            <AppText variant="caption" tone="muted">
              {steps} {steps === 1 ? 'passo' : 'passos'}
            </AppText>
          </View>

          <View className="flex-row items-center">
            <AppText variant="caption" tone="brand">
              Ver guia
            </AppText>
            <MaterialCommunityIcons name="chevron-right" size={16} color="#047857" />
          </View>
        </View>
      </View>
    </Pressable>
  );
}
