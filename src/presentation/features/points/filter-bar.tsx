import { ScrollView, View } from 'react-native';

import { WASTE_CATEGORIES } from '@/domain/value-objects/waste-category';

import { Chip } from '../../components/ui/chip';
import { AppText } from '../../components/ui/text';
import { RADII_KM, useFiltersStore } from '../../stores/filters.store';

/**
 * Combined map filters (RB07): waste type + radius + availability.
 *
 * The radius only makes sense with a known origin; when there is no location,
 * the section is hidden instead of showing a control that changes nothing.
 */
export function FilterBar({ hasLocation }: { hasLocation: boolean }) {
  const { categories, radiusKm, onlyOpen, toggleCategory, setRadius, toggleOnlyOpen, clear } =
    useFiltersStore();

  const hasFilter = categories.length > 0 || radiusKm !== null || onlyOpen;

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between px-4">
        <AppText variant="overline" tone="muted">
          Tipo de resíduo
        </AppText>

        {hasFilter ? (
          <Chip label="Limpar filtros" icon="filter-remove-outline" onPress={clear} />
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 px-4"
      >
        {WASTE_CATEGORIES.map((category) => (
          <Chip
            key={category.id}
            label={category.name}
            icon={category.icon as never}
            color={category.color}
            selected={categories.includes(category.id)}
            onPress={() => toggleCategory(category.id)}
          />
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 px-4"
      >
        <Chip
          label="Aberto agora"
          icon="clock-check-outline"
          selected={onlyOpen}
          onPress={toggleOnlyOpen}
        />

        {hasLocation
          ? RADII_KM.map((radius) => (
              <Chip
                key={radius}
                label={`até ${radius} km`}
                icon="map-marker-radius-outline"
                selected={radiusKm === radius}
                onPress={() => setRadius(radiusKm === radius ? null : radius)}
              />
            ))
          : null}
      </ScrollView>
    </View>
  );
}
