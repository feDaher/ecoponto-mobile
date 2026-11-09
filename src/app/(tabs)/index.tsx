import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import type { NearbyPoint } from '@/application/use-cases/list-nearby-points.use-case';
import { getCategory, type WasteCategoryId } from '@/domain/value-objects/waste-category';
import { Badge } from '@/presentation/components/ui/badge';
import { Chip } from '@/presentation/components/ui/chip';
import { EmptyState, ErrorState, Loading } from '@/presentation/components/ui/states';
import { AppText } from '@/presentation/components/ui/text';
import { FilterBar } from '@/presentation/features/points/filter-bar';
import { PointCard } from '@/presentation/features/points/point-card';
import { PointsMap } from '@/presentation/features/points/points-map';
import { useLocation } from '@/presentation/hooks/use-location';
import { useNearbyPoints } from '@/presentation/hooks/use-points';
import { useTabBarInset } from '@/presentation/hooks/use-tab-bar-inset';
import { useContainer } from '@/presentation/providers/container-provider';
import { useActiveFilterCount, useFiltersStore } from '@/presentation/stores/filters.store';
import { colors } from '@/presentation/theme/tokens';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

/** Shortcuts for the e-waste the field survey found sitting in people's homes. */
const QUICK_CATEGORIES: readonly WasteCategoryId[] = ['batteries', 'cell-phones', 'computers'];

const CARD_SPACING = 12;

/**
 * Main screen — search, map and carousel of collection points.
 *
 * RB01: public, no sign-in required.
 * RB03: shows only approved points (guaranteed in the use case).
 * RB07: combined filters by waste type, radius, city/neighborhood and availability.
 */
export default function MapScreen() {
  const router = useRouter();
  const { info } = useContainer();
  const [openFilters, setOpenFilters] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const { coordinate, permission, request } = useLocation();
  const query = useNearbyPoints(coordinate);
  const tabBarInset = useTabBarInset();

  const clearFilters = useFiltersStore((state) => state.clear);
  const searchTerm = useFiltersStore((state) => state.searchTerm);
  const setSearchTerm = useFiltersStore((state) => state.setSearchTerm);
  const selectedCategories = useFiltersStore((state) => state.categories);
  const toggleCategory = useFiltersStore((state) => state.toggleCategory);
  const activeFilters = useActiveFilterCount();
  // The typed text already shows in the field; the badge counts the other filters.
  const sheetFilters = activeFilters - (searchTerm.trim() ? 1 : 0);

  const openPoint = (id: string) => router.push(`/point/${id}`);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-light-muted dark:bg-surface-dark">
      <View className="flex-row items-center gap-3 px-4 py-3">
        <Pressable
          onPress={() => setMenuVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Abrir menu"
          hitSlop={8}
        >
          <MaterialCommunityIcons name="menu" size={26} color={colors.brand[600]} />
        </Pressable>

        <AppText variant="heading" className="flex-1">
          EcoPonto
        </AppText>

        {/* Transparency: makes it clear the data on screen is not real yet. */}
        {info.dataSource === 'in-memory' ? (
          <Badge label="Modo demo" tone="warning" icon="flask-outline" />
        ) : null}

        <Pressable
          onPress={() => router.push('/profile')}
          accessibilityRole="button"
          accessibilityLabel="Abrir perfil"
          hitSlop={8}
        >
          <MaterialCommunityIcons
            name="account-circle-outline"
            size={28}
            color={colors.brand[600]}
          />
        </Pressable>
      </View>

      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />

      <View className="mx-4 mb-3 flex-row items-center rounded-pill border border-black/10 bg-surface-light px-4 dark:border-white/15 dark:bg-surface-dark-muted">
        <MaterialCommunityIcons name="magnify" size={22} color={colors.text.lightMuted} />

        <TextInput
          className="flex-1 px-3 py-3 text-body text-content-light dark:text-content-dark"
          placeholder="Buscar pontos de reciclagem..."
          placeholderTextColor={colors.text.darkMuted}
          accessibilityLabel="Buscar pontos de coleta por nome ou endereço"
          returnKeyType="search"
          clearButtonMode="while-editing"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />

        <Pressable
          onPress={() => setOpenFilters(true)}
          accessibilityRole="button"
          accessibilityLabel={
            sheetFilters > 0 ? `Abrir filtros, ${sheetFilters} ativos` : 'Abrir filtros'
          }
          hitSlop={8}
          className="border-l border-black/10 py-1 pl-3 dark:border-white/15"
        >
          <MaterialCommunityIcons name="tune-variant" size={23} color={colors.brand[600]} />
          {sheetFilters > 0 ? (
            <View className="absolute -right-2 -top-1.5 min-w-[18px] items-center rounded-pill bg-brand-600 px-1">
              <AppText variant="overline" tone="inverse">
                {sheetFilters}
              </AppText>
            </View>
          ) : null}
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-3 grow-0"
        contentContainerClassName="gap-2 px-4"
      >
        {QUICK_CATEGORIES.map((id) => {
          const category = getCategory(id);

          return (
            <Chip
              key={id}
              label={category.name}
              icon={category.icon as IconName}
              color={category.color}
              selected={selectedCategories.includes(id)}
              onPress={() => toggleCategory(id)}
            />
          );
        })}
      </ScrollView>

      <FilterBar
        hasLocation={coordinate !== null}
        onRequestLocation={request}
        resultCount={query.data?.length ?? 0}
        isFetching={query.isFetching}
        openRequested={openFilters}
        onOpenRequestHandled={() => setOpenFilters(false)}
      />

      {permission !== 'granted' ? <LocationPrompt onAllow={request} /> : null}

      <View className="mx-3 min-h-[160px] flex-1 overflow-hidden rounded-2xl" style={{ zIndex: 0 }}>
        <PointsMap points={query.data ?? []} origin={coordinate} onSelect={openPoint} />
      </View>

      <View style={{ flexShrink: 0, paddingBottom: tabBarInset, zIndex: 1, elevation: 2 }}>
        <PointCarousel
          query={query}
          filtered={activeFilters > 0}
          onOpen={openPoint}
          onClearFilters={clearFilters}
        />
      </View>
    </SafeAreaView>
  );
}

function SideMenu({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const navigateTo = (
    route: '/(tabs)' | '/(tabs)/education' | '/(tabs)/ranking' | '/(tabs)/profile',
  ) => {
    onClose();
    router.push(route);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 flex-row">
        <View
          style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }}
          className="h-full w-[78%] max-w-[320px] bg-surface-light px-5 dark:bg-surface-dark"
          accessibilityViewIsModal
        >
          <View className="mb-8 flex-row items-center justify-between">
            <AppText variant="title" tone="brand">
              EcoPonto
            </AppText>

            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fechar menu"
              hitSlop={8}
            >
              <MaterialCommunityIcons name="close" size={26} color={colors.brand[600]} />
            </Pressable>
          </View>

          <View className="mb-6 rounded-2xl bg-brand-50 p-4 dark:bg-brand-900">
            <MaterialCommunityIcons name="leaf" size={30} color={colors.brand[600]} />
            <AppText variant="heading" className="mt-2">
              Faça parte da mudança!
            </AppText>
            <AppText variant="caption" tone="muted" className="mt-1">
              Encontre pontos de coleta e cuide do meio ambiente.
            </AppText>
          </View>

          <View className="gap-2">
            <MenuItem
              icon="map-marker-radius-outline"
              label="Mapa"
              onPress={() => navigateTo('/(tabs)')}
            />
            <MenuItem
              icon="book-open-variant"
              label="Educação"
              onPress={() => navigateTo('/(tabs)/education')}
            />
            <MenuItem
              icon="trophy-outline"
              label="Ranking"
              onPress={() => navigateTo('/(tabs)/ranking')}
            />
            <MenuItem
              icon="account-circle-outline"
              label="Perfil"
              onPress={() => navigateTo('/(tabs)/profile')}
            />
          </View>
        </View>

        <Pressable
          className="flex-1 bg-black/45"
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Fechar menu"
        />
      </View>
    </Modal>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="flex-row items-center gap-4 rounded-xl px-3 py-4 active:bg-brand-50 dark:active:bg-brand-900"
    >
      <MaterialCommunityIcons name={icon} size={23} color={colors.brand[600]} />
      <AppText variant="body">{label}</AppText>
    </Pressable>
  );
}

/** RB07 — distance only exists with a location; we ask with context, not at boot. */
function LocationPrompt({ onAllow }: { onAllow: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Permitir acesso à localização"
      accessibilityHint="Para ordenar por proximidade e traçar rotas até o ponto"
      onPress={onAllow}
      className="mx-4 mb-3 flex-row items-center gap-3 rounded-2xl bg-brand-100 px-3 py-2.5 active:opacity-80 dark:bg-brand-900"
    >
      <MaterialCommunityIcons name="crosshairs-gps" size={20} color={colors.brand[700]} />
      <AppText variant="caption" tone="brand" className="flex-1">
        Usar minha localização para ver distâncias e rotas
      </AppText>
      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.brand[700]} />
    </Pressable>
  );
}

function resultLabel(count: number, filtered: boolean): string {
  const noun = count === 1 ? 'ponto' : 'pontos';
  if (filtered) return `${count} ${noun} ${count === 1 ? 'encontrado' : 'encontrados'}`;
  return `${count} ${noun} ${count === 1 ? 'credenciado' : 'credenciados'}`;
}

function PointCarousel({
  query,
  filtered,
  onOpen,
  onClearFilters,
}: {
  query: ReturnType<typeof useNearbyPoints>;
  filtered: boolean;
  onOpen: (id: string) => void;
  onClearFilters: () => void;
}) {
  const { width } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);

  if (query.isPending) return <Loading label="Buscando pontos de coleta" />;

  if (query.isError) {
    return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  }

  const points = query.data ?? [];
  const total = points.length;
  const cardWidth = width - 32;
  const snapInterval = cardWidth + CARD_SPACING;
  // A new result can be shorter than the position the user had scrolled to.
  const position = Math.min(currentIndex, Math.max(total - 1, 0)) + 1;

  return (
    <View className="pt-2">
      <View className="flex-row items-end justify-between gap-3 px-4 pb-2">
        <View className="flex-1">
          <AppText variant="heading">Pontos de coleta próximos</AppText>
          <AppText variant="caption" tone="muted" accessibilityLiveRegion="polite">
            {resultLabel(total, filtered)}
          </AppText>
        </View>

        {query.isFetching ? (
          <ActivityIndicator
            size="small"
            color={colors.brand[600]}
            accessibilityLabel="Aplicando filtros"
          />
        ) : total > 1 ? (
          <AppText variant="caption" tone="muted">
            {position} de {total}
          </AppText>
        ) : null}
      </View>

      {total > 0 ? (
        <FlatList<NearbyPoint>
          horizontal
          snapToInterval={snapInterval}
          snapToAlignment="start"
          decelerationRate="fast"
          disableIntervalMomentum
          data={points}
          keyExtractor={(item) => item.point.id}
          renderItem={({ item }) => (
            <View style={{ width: cardWidth, marginRight: CARD_SPACING }}>
              <PointCard item={item} onPress={() => onOpen(item.point.id)} />
            </View>
          )}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / snapInterval);
            setCurrentIndex(Math.max(0, Math.min(index, total - 1)));
          }}
        />
      ) : (
        <EmptyState
          title="Nenhum ponto encontrado"
          description="Tente ampliar o raio de busca ou remover alguns filtros de resíduo."
          action={{ title: 'Limpar filtros', onPress: onClearFilters }}
        />
      )}
    </View>
  );
}
