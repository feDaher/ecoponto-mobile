import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState } from 'react';
import { FlatList, ScrollView, TextInput, useWindowDimensions, View } from 'react-native';

import type { EducationalContent } from '@/domain/repositories/educational-content.repository';
import { WASTE_CATEGORIES, type WasteCategoryId } from '@/domain/value-objects/waste-category';
import { Chip } from '@/presentation/components/ui/chip';
import { Screen } from '@/presentation/components/ui/screen';
import { EmptyState, ErrorState, Loading } from '@/presentation/components/ui/states';
import { AppText } from '@/presentation/components/ui/text';
import { ContentCard } from '@/presentation/features/education/content-card';
import { ContentDetail } from '@/presentation/features/education/content-detail';
import { FeaturedContent } from '@/presentation/features/education/featured-content';
import { pickFeatured, searchContents } from '@/presentation/features/education/search';
import { useEducationalContent } from '@/presentation/hooks/use-educational-content';

const MAX_CONTENT_WIDTH = 1200;
const GAP = 16;

function columnsFor(width: number): number {
  if (width >= 1024) return 3;
  if (width >= 640) return 2;
  return 1;
}

/**
 * RB10 — Educational content linked to the waste type.
 * "Publicly accessible, with no sign-up required."
 */
export default function EducationScreen() {
  const { width } = useWindowDimensions();
  const columns = columnsFor(width);
  const wide = width >= 768;

  const [category, setCategory] = useState<WasteCategoryId | undefined>();
  const [search, setSearch] = useState('');
  const [opened, setOpened] = useState<EducationalContent | null>(null);
  const query = useEducationalContent(category);

  const results = searchContents(query.data ?? [], search);
  const overview = category === undefined && search.trim() === '';
  const featured = overview ? pickFeatured(results) : null;
  const guides = featured ? results.filter((item) => item.id !== featured.id) : results;

  return (
    <Screen noPadding>
      <FlatList<EducationalContent | null>
        key={`columns-${columns}`}
        numColumns={columns}
        data={padToColumns(guides, columns)}
        keyExtractor={(item, index) => item?.id ?? `spacer-${index}`}
        renderItem={({ item }) =>
          item ? (
            <ContentCard content={item} onPress={() => setOpened(item)} />
          ) : (
            <View className="flex-1" />
          )
        }
        columnWrapperStyle={columns > 1 ? { gap: GAP } : undefined}
        contentContainerStyle={{
          gap: GAP,
          padding: 16,
          paddingBottom: 32,
          width: '100%',
          maxWidth: MAX_CONTENT_WIDTH,
          alignSelf: 'center',
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="gap-6">
            <View className="gap-1">
              <AppText variant="display" accessibilityRole="header">
                Educação ambiental
              </AppText>
              <AppText variant="body" tone="muted">
                Como descartar, por que reciclar e qual o impacto de cada resíduo.
              </AppText>
            </View>

            <SearchCard
              search={search}
              onSearch={setSearch}
              category={category}
              onCategory={setCategory}
            />

            {featured ? (
              <View className="gap-3">
                <SectionTitle title="Destaque do dia" aside="Muda todos os dias" />
                <FeaturedContent
                  content={featured}
                  wide={wide}
                  onOpen={() => setOpened(featured)}
                />
              </View>
            ) : null}

            {guides.length > 0 ? (
              <SectionTitle
                title="Guias de descarte"
                subtitle="Passo a passo para cada tipo de resíduo"
                aside={`${guides.length} ${guides.length === 1 ? 'guia' : 'guias'}`}
              />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          query.isPending ? (
            <Loading label="Carregando conteúdos" />
          ) : query.isError ? (
            <ErrorState error={query.error} onRetry={() => query.refetch()} />
          ) : featured ? null : (
            <EmptyState
              icon="book-open-outline"
              title={search.trim() ? 'Nenhum guia encontrado' : 'Sem conteúdo para esta categoria'}
              description={
                search.trim()
                  ? 'Tente outra palavra ou escolha outra categoria.'
                  : 'Escolha outra categoria ou veja todos os materiais disponíveis.'
              }
              action={{
                title: 'Ver todos',
                onPress: () => {
                  setSearch('');
                  setCategory(undefined);
                },
              }}
            />
          )
        }
      />

      <ContentDetail content={opened} wide={wide} onClose={() => setOpened(null)} />
    </Screen>
  );
}

function SearchCard({
  search,
  onSearch,
  category,
  onCategory,
}: {
  search: string;
  onSearch: (value: string) => void;
  category: WasteCategoryId | undefined;
  onCategory: (value: WasteCategoryId | undefined) => void;
}) {
  return (
    <View className="gap-4 rounded-3xl border border-black/5 bg-surface-light p-4 dark:border-white/10 dark:bg-surface-dark-muted">
      <View className="min-h-[48px] flex-row items-center gap-2 rounded-pill bg-surface-light-muted px-4 dark:bg-surface-dark">
        <MaterialCommunityIcons name="magnify" size={20} color="#5A655F" />
        <TextInput
          accessibilityLabel="Pesquisar guias de descarte"
          placeholder="Pesquisar guias de descarte…"
          placeholderTextColor="#9AA7A0"
          value={search}
          onChangeText={onSearch}
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
          className="flex-1 py-2 text-body text-content-light dark:text-content-dark"
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-2"
      >
        <Chip
          label="Todos"
          icon="view-grid-outline"
          selected={category === undefined}
          onPress={() => onCategory(undefined)}
        />

        {WASTE_CATEGORIES.map((item) => (
          <Chip
            key={item.id}
            label={item.name}
            icon={item.icon as never}
            color={item.color}
            selected={category === item.id}
            onPress={() => onCategory(category === item.id ? undefined : item.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function SectionTitle({
  title,
  subtitle,
  aside,
}: {
  title: string;
  subtitle?: string;
  aside?: string;
}) {
  return (
    <View className="flex-row items-end justify-between gap-3">
      <View className="flex-1 gap-0.5">
        <AppText variant="title" accessibilityRole="header">
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" tone="muted">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {aside ? (
        <AppText variant="caption" tone="muted">
          {aside}
        </AppText>
      ) : null}
    </View>
  );
}

function padToColumns<T>(items: readonly T[], columns: number): (T | null)[] {
  const remainder = items.length % columns;
  const spacers = remainder === 0 ? 0 : columns - remainder;
  return [...items, ...Array<null>(spacers).fill(null)];
}
