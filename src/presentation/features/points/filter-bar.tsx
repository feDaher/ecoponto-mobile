import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getCategory, WASTE_CATEGORIES } from '@/domain/value-objects/waste-category';

import { Button } from '../../components/ui/button';
import { Chip } from '../../components/ui/chip';
import { AppText } from '../../components/ui/text';
import { useRegionOptions } from '../../hooks/use-points';
import {
  RADII_KM,
  useActiveFilterCount,
  useFiltersStore,
  type RadiusKm,
} from '../../stores/filters.store';
import { RegionPicker } from './region-picker';
import { hasRegionChoice, regionLabel } from './regions';

const COMPACT_MAX_WIDTH = 768;

export type FilterBarProps = {
  hasLocation: boolean;
  onRequestLocation: () => void;
  resultCount: number;
  isFetching: boolean;
};

export function FilterBar(props: FilterBarProps) {
  const { width } = useWindowDimensions();
  const model = useFilterModel(props);

  return width < COMPACT_MAX_WIDTH ? (
    <CompactFilterBar model={model} {...props} />
  ) : (
    <InlineFilterBar model={model} />
  );
}

type FilterModel = ReturnType<typeof useFilterModel>;

function useFilterModel({ hasLocation, onRequestLocation }: FilterBarProps) {
  const store = useFiltersStore();
  const activeCount = useActiveFilterCount();
  const regions = useRegionOptions().data ?? [];
  const selectedRegion = regionLabel(store.city, store.neighborhood);

  const selectRadius = (radius: RadiusKm) => {
    if (store.radiusKm === radius) return store.setRadius(null);
    store.setRadius(radius);
    if (!hasLocation) onRequestLocation();
  };

  const active: { key: string; label: string; remove: () => void }[] = [
    ...store.categories.map((id) => ({
      key: `category-${id}`,
      label: getCategory(id).name,
      remove: () => store.toggleCategory(id),
    })),
    ...(store.radiusKm !== null
      ? [{ key: 'radius', label: `até ${store.radiusKm} km`, remove: () => store.setRadius(null) }]
      : []),
    ...(store.onlyOpen
      ? [{ key: 'open', label: 'Aberto agora', remove: store.toggleOnlyOpen }]
      : []),
    ...(selectedRegion
      ? [{ key: 'region', label: selectedRegion, remove: () => store.setRegion(null) }]
      : []),
  ];

  return {
    ...store,
    activeCount,
    active,
    regions,
    selectedRegion,
    showRegion: hasRegionChoice(regions),
    selectRadius,
    needsLocation: store.radiusKm !== null && !hasLocation,
  };
}

function InlineFilterBar({ model }: { model: FilterModel }) {
  const [pickingRegion, setPickingRegion] = useState(false);

  return (
    <View className="gap-2.5">
      <View className="min-h-[40px] flex-row items-center justify-between px-4">
        <AppText variant="overline" tone="muted">
          Filtros
        </AppText>

        {model.activeCount > 0 ? (
          <Chip
            label={`Limpar (${model.activeCount})`}
            icon="filter-remove-outline"
            onPress={model.clear}
          />
        ) : null}
      </View>

      <FilterRow>
        <CategoryChips model={model} />
      </FilterRow>

      <FilterRow>
        {model.showRegion ? (
          <Chip
            label={model.selectedRegion ?? 'Todas as regiões'}
            icon="map-marker-outline"
            trailingIcon="chevron-down"
            selected={model.selectedRegion !== null}
            onPress={() => setPickingRegion(true)}
          />
        ) : null}
        <RadiusChips model={model} />
        <OpenNowChip model={model} />
      </FilterRow>

      {model.needsLocation ? <LocationHint className="px-4" /> : null}

      <Modal
        visible={pickingRegion}
        transparent
        animationType="fade"
        onRequestClose={() => setPickingRegion(false)}
      >
        <View className="flex-1 items-center justify-center p-4">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar"
            onPress={() => setPickingRegion(false)}
            className="absolute inset-0 bg-black/40"
          />
          <View
            style={{ width: '100%', maxWidth: 480, height: '70%', maxHeight: 640 }}
            className="overflow-hidden rounded-3xl bg-surface-light-muted dark:bg-surface-dark"
            accessibilityViewIsModal
          >
            <RegionPicker
              options={model.regions}
              city={model.city}
              neighborhood={model.neighborhood}
              dismissIcon="close"
              onDismiss={() => setPickingRegion(false)}
              onSelect={(city, neighborhood) => {
                model.setRegion(city, neighborhood);
                setPickingRegion(false);
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function FilterRow({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="gap-2 px-4"
    >
      {children}
    </ScrollView>
  );
}

function CompactFilterBar({
  model,
  resultCount,
  isFetching,
}: { model: FilterModel } & FilterBarProps) {
  const [open, setOpen] = useState(false);

  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-2 pl-4">
        <Button
          title={model.activeCount > 0 ? `Filtros (${model.activeCount})` : 'Filtros'}
          icon="tune-variant"
          variant={model.activeCount > 0 ? 'primary' : 'outline'}
          onPress={() => setOpen(true)}
          accessibilityHint="Abre os filtros por tipo de resíduo, distância e região"
        />

        {model.active.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2 pr-4"
          >
            {model.active.map((filter) => (
              <Chip
                key={filter.key}
                label={filter.label}
                icon="close"
                selected
                onPress={filter.remove}
              />
            ))}
          </ScrollView>
        ) : (
          <AppText variant="caption" tone="muted" className="flex-1 pr-4">
            Resíduo, distância e região
          </AppText>
        )}
      </View>

      {model.needsLocation ? <LocationHint className="px-4" /> : null}

      <FilterSheet
        visible={open}
        onClose={() => setOpen(false)}
        model={model}
        resultCount={resultCount}
        isFetching={isFetching}
      />
    </View>
  );
}

function FilterSheet({
  visible,
  onClose,
  model,
  resultCount,
  isFetching,
}: {
  visible: boolean;
  onClose: () => void;
  model: FilterModel;
  resultCount: number;
  isFetching: boolean;
}) {
  const insets = useSafeAreaInsets();
  // The region picker is a second step inside the same sheet — no modal on
  // top of a modal, and "back" returns to the filters.
  const [step, setStep] = useState<'filters' | 'region'>('filters');

  const close = () => {
    setStep('filters');
    onClose();
  };

  // Filters apply live (RB07 — result within 2s), so the button only confirms
  // what the user already sees updating behind the sheet.
  const confirmLabel = isFetching
    ? 'Atualizando…'
    : resultCount === 0
      ? 'Nenhum ponto encontrado'
      : `Ver ${resultCount} ${resultCount === 1 ? 'ponto' : 'pontos'}`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={() => (step === 'region' ? setStep('filters') : close())}
    >
      <View className="flex-1 justify-end">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar filtros"
          onPress={close}
          className="absolute inset-0 bg-black/40"
        />

        <View
          style={{
            // The picker's list needs a fixed height to scroll; the filters just fit content.
            ...(step === 'region' ? { height: '85%' } : { maxHeight: '85%' }),
            paddingBottom: insets.bottom + 12,
          }}
          className="rounded-t-3xl bg-surface-light-muted dark:bg-surface-dark"
          accessibilityViewIsModal
        >
          <View className="items-center pt-2">
            <View className="h-1 w-10 rounded-pill bg-black/15 dark:bg-white/20" />
          </View>

          {step === 'region' ? (
            <RegionPicker
              options={model.regions}
              city={model.city}
              neighborhood={model.neighborhood}
              dismissIcon="arrow-left"
              onDismiss={() => setStep('filters')}
              onSelect={(city, neighborhood) => {
                model.setRegion(city, neighborhood);
                setStep('filters');
              }}
            />
          ) : (
            <>
              <View className="min-h-[56px] flex-row items-center justify-between px-4">
                <AppText variant="title">Filtros</AppText>
                {model.activeCount > 0 ? (
                  <Button title="Limpar" variant="ghost" onPress={model.clear} />
                ) : null}
              </View>

              <ScrollView contentContainerClassName="gap-5 px-4 pb-4">
                <FilterSection title="Tipo de resíduo">
                  <CategoryChips model={model} />
                </FilterSection>

                {model.showRegion ? (
                  <FilterSection title="Região">
                    <RegionField
                      label={model.selectedRegion ?? 'Todas as regiões'}
                      selected={model.selectedRegion !== null}
                      onPress={() => setStep('region')}
                    />
                  </FilterSection>
                ) : null}

                <FilterSection title="Distância">
                  <RadiusChips model={model} />
                </FilterSection>

                {model.needsLocation ? <LocationHint /> : null}

                <FilterSection title="Funcionamento">
                  <OpenNowChip model={model} />
                </FilterSection>
              </ScrollView>

              <View className="px-4 pt-2">
                <Button title={confirmLabel} fullWidth onPress={close} />
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function FilterSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-2">
      <AppText variant="overline" tone="muted">
        {title}
      </AppText>
      <View className="flex-row flex-wrap gap-2">{children}</View>
    </View>
  );
}

function RegionField({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Região: ${label}`}
      accessibilityHint="Abre a busca de cidade ou bairro"
      onPress={onPress}
      className={[
        'min-h-[52px] w-full flex-row items-center gap-3 rounded-2xl border px-4 active:opacity-80',
        selected
          ? 'border-brand-600 bg-brand-50 dark:bg-brand-900'
          : 'border-black/10 bg-surface-light dark:border-white/15 dark:bg-surface-dark-muted',
      ].join(' ')}
    >
      <MaterialCommunityIcons name="map-marker-outline" size={20} color="#059669" />
      <AppText variant="body" className="flex-1" numberOfLines={1}>
        {label}
      </AppText>
      <MaterialCommunityIcons name="chevron-right" size={22} color="#5A655F" />
    </Pressable>
  );
}

function CategoryChips({ model }: { model: FilterModel }) {
  return WASTE_CATEGORIES.map((category) => (
    <Chip
      key={category.id}
      label={category.name}
      icon={category.icon as never}
      color={category.color}
      selected={model.categories.includes(category.id)}
      onPress={() => model.toggleCategory(category.id)}
    />
  ));
}

function RadiusChips({ model }: { model: FilterModel }) {
  return RADII_KM.map((radius) => (
    <Chip
      key={radius}
      label={`até ${radius} km`}
      icon="map-marker-radius-outline"
      selected={model.radiusKm === radius}
      onPress={() => model.selectRadius(radius)}
    />
  ));
}

function OpenNowChip({ model }: { model: FilterModel }) {
  return (
    <Chip
      label="Aberto agora"
      icon="clock-check-outline"
      selected={model.onlyOpen}
      onPress={model.toggleOnlyOpen}
    />
  );
}

function LocationHint({ className = '' }: { className?: string }) {
  return (
    <AppText
      variant="caption"
      tone="warning"
      className={className}
      accessibilityLiveRegion="polite"
    >
      Permita o acesso à localização para filtrar por distância.
    </AppText>
  );
}
