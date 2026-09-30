import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState } from 'react';
import { Pressable, SectionList, TextInput, View } from 'react-native';

import { AppText } from '../../components/ui/text';
import { searchRegions, type RegionOptions } from './regions';

export type RegionPickerProps = {
  options: RegionOptions;
  city: string | null;
  neighborhood: string | null;
  onSelect: (city: string | null, neighborhood: string | null) => void;
  /** Leaves the picker without changing the selection. */
  onDismiss: () => void;
  dismissIcon: 'arrow-left' | 'close';
};

type Row = { city: string; neighborhood: string | null; pointCount: number };

/**
 * RB07 — region picker: search + list grouped by city.
 *
 * Scales from one city with a handful of neighborhoods to the whole region
 * without turning into a wall of chips: the user types two letters and the
 * list narrows down. Picking a neighborhood always carries its city, so
 * "Centro" of one city is never confused with "Centro" of another.
 */
export function RegionPicker({
  options,
  city,
  neighborhood,
  onSelect,
  onDismiss,
  dismissIcon,
}: RegionPickerProps) {
  const [query, setQuery] = useState('');
  const singleCity = options.length === 1;

  const sections = searchRegions(options, query).map((option) => ({
    title: option.name,
    data: [
      // With a single city, "Todas as regiões" already means the whole city.
      ...(singleCity
        ? []
        : [{ city: option.name, neighborhood: null, pointCount: option.pointCount }]),
      ...option.neighborhoods.map((n) => ({
        city: option.name,
        neighborhood: n.name,
        pointCount: n.pointCount,
      })),
    ] satisfies Row[],
  }));

  return (
    <View className="flex-1">
      <View className="min-h-[56px] flex-row items-center gap-2 px-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={dismissIcon === 'close' ? 'Fechar' : 'Voltar aos filtros'}
          onPress={onDismiss}
          hitSlop={8}
          className="h-12 w-12 items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/10"
        >
          <MaterialCommunityIcons name={dismissIcon} size={24} color="#5A655F" />
        </Pressable>
        <AppText variant="title">Região</AppText>
      </View>

      <View className="mx-4 mb-2 min-h-[48px] flex-row items-center gap-2 rounded-2xl border border-black/10 bg-surface-light px-3 dark:border-white/15 dark:bg-surface-dark-muted">
        <MaterialCommunityIcons name="magnify" size={20} color="#5A655F" />
        <TextInput
          accessibilityLabel="Buscar cidade ou bairro"
          placeholder="Buscar cidade ou bairro"
          placeholderTextColor="#9AA7A0"
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="search"
          clearButtonMode="while-editing"
          className="flex-1 py-2 text-body text-content-light dark:text-content-dark"
        />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(row) => `${row.city}|${row.neighborhood ?? '*'}`}
        keyboardShouldPersistTaps="handled"
        stickySectionHeadersEnabled
        contentContainerClassName="pb-4"
        ListHeaderComponent={
          query.trim() ? null : (
            <RegionRow
              label="Todas as regiões"
              selected={city === null}
              onPress={() => onSelect(null, null)}
            />
          )
        }
        renderSectionHeader={({ section }) => (
          <View className="bg-surface-light-muted px-4 pb-1 pt-3 dark:bg-surface-dark">
            <AppText variant="overline" tone="muted">
              {section.title}
            </AppText>
          </View>
        )}
        renderItem={({ item }) => (
          <RegionRow
            label={item.neighborhood ?? `Toda ${item.city}`}
            pointCount={item.pointCount}
            indent={item.neighborhood !== null && !singleCity}
            selected={city === item.city && neighborhood === item.neighborhood}
            onPress={() => onSelect(item.city, item.neighborhood)}
          />
        )}
        ListEmptyComponent={
          <AppText variant="body" tone="muted" className="px-4 py-6 text-center">
            Nenhuma cidade ou bairro com pontos de coleta para “{query.trim()}”.
          </AppText>
        }
      />
    </View>
  );
}

function RegionRow({
  label,
  pointCount,
  selected,
  indent = false,
  onPress,
}: {
  label: string;
  pointCount?: number;
  selected: boolean;
  indent?: boolean;
  onPress: () => void;
}) {
  const countLabel =
    pointCount === undefined ? '' : `${pointCount} ${pointCount === 1 ? 'ponto' : 'pontos'}`;

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={countLabel ? `${label}, ${countLabel}` : label}
      onPress={onPress}
      className={`min-h-[48px] flex-row items-center gap-3 px-4 active:bg-black/5 dark:active:bg-white/10 ${
        indent ? 'pl-8' : ''
      }`}
    >
      <AppText variant="body" className={`flex-1 ${selected ? 'font-semibold' : ''}`}>
        {label}
      </AppText>
      {countLabel ? (
        <AppText variant="caption" tone="muted">
          {countLabel}
        </AppText>
      ) : null}
      <MaterialCommunityIcons
        name={selected ? 'radiobox-marked' : 'radiobox-blank'}
        size={22}
        color={selected ? '#059669' : '#9AA7A0'}
      />
    </Pressable>
  );
}
