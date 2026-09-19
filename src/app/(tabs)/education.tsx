import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState } from 'react';
import { FlatList, ScrollView, View } from 'react-native';

import type { EducationalContent } from '@/domain/repositories/educational-content.repository';
import {
  getCategory,
  WASTE_CATEGORIES,
  type WasteCategoryId,
} from '@/domain/value-objects/waste-category';
import { Card } from '@/presentation/components/ui/card';
import { Chip } from '@/presentation/components/ui/chip';
import { Screen } from '@/presentation/components/ui/screen';
import { EmptyState, ErrorState, Loading } from '@/presentation/components/ui/states';
import { AppText } from '@/presentation/components/ui/text';
import { useEducationalContent } from '@/presentation/hooks/use-educational-content';

/**
 * RB10 — Educational content linked to the waste type.
 * "Publicly accessible, with no sign-up required."
 */
export default function EducationScreen() {
  const [category, setCategory] = useState<WasteCategoryId | undefined>();
  const query = useEducationalContent(category);

  return (
    <Screen
      title="Educação ambiental"
      subtitle="Como descartar, por que reciclar e qual o impacto de cada resíduo."
      noPadding
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 px-4 pb-3"
        className="max-h-[56px] flex-grow-0"
      >
        <Chip
          label="Todos"
          icon="view-grid-outline"
          selected={category === undefined}
          onPress={() => setCategory(undefined)}
        />

        {WASTE_CATEGORIES.map((item) => (
          <Chip
            key={item.id}
            label={item.name}
            icon={item.icon as never}
            color={item.color}
            selected={category === item.id}
            onPress={() => setCategory(category === item.id ? undefined : item.id)}
          />
        ))}
      </ScrollView>

      {query.isPending ? (
        <Loading label="Carregando conteúdos" />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : (
        <FlatList<EducationalContent>
          data={query.data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ContentCard content={item} />}
          contentContainerClassName="gap-3 px-4 pb-8"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="book-open-outline"
              title="Sem conteúdo para esta categoria"
              description="Escolha outra categoria ou veja todos os materiais disponíveis."
            />
          }
        />
      )}
    </Screen>
  );
}

function ContentCard({ content }: { content: EducationalContent }) {
  const [expanded, setExpanded] = useState(false);
  const category = getCategory(content.category);

  return (
    <Card
      onPress={() => setExpanded((current) => !current)}
      accessibilityLabel={`${content.title}. Toque para ${expanded ? 'recolher' : 'expandir'}.`}
      className="gap-3"
    >
      <View className="flex-row items-center gap-2">
        <View
          style={{ backgroundColor: `${category.color}1A` }}
          className="h-9 w-9 items-center justify-center rounded-full"
        >
          <MaterialCommunityIcons name={category.icon as never} size={18} color={category.color} />
        </View>

        <View className="flex-1">
          <AppText variant="overline" style={{ color: category.color }}>
            {category.name}
          </AppText>
          <AppText variant="heading">{content.title}</AppText>
        </View>

        <MaterialCommunityIcons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={22}
          color="#9AA7A0"
        />
      </View>

      <AppText variant="body" tone="muted">
        {content.summary}
      </AppText>

      {expanded ? (
        <View className="gap-4 border-t border-black/5 pt-3 dark:border-white/10">
          <View className="gap-2">
            <AppText variant="overline" tone="brand">
              Como descartar
            </AppText>
            {content.howToDispose.map((step, index) => (
              <View key={step} className="flex-row gap-2">
                <AppText variant="body" tone="brand">
                  {index + 1}.
                </AppText>
                <AppText variant="body" className="flex-1">
                  {step}
                </AppText>
              </View>
            ))}
          </View>

          <View className="gap-1">
            <AppText variant="overline" tone="brand">
              Por que reciclar
            </AppText>
            <AppText variant="body">{content.whyRecycle}</AppText>
          </View>

          <View className="gap-1">
            <AppText variant="overline" tone="brand">
              Impacto ambiental
            </AppText>
            <AppText variant="body">{content.environmentalImpact}</AppText>
          </View>
        </View>
      ) : null}
    </Card>
  );
}
