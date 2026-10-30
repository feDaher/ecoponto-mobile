import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Modal, Pressable, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { NearbyPoint } from '@/application/use-cases/list-nearby-points.use-case';
import { EmptyState, ErrorState, Loading } from '@/presentation/components/ui/states';
import { AppText } from '@/presentation/components/ui/text';
import { FilterBar } from '@/presentation/features/points/filter-bar';
import { PointCard } from '@/presentation/features/points/point-card';
import { PointsMap } from '@/presentation/features/points/points-map';
import { useLocation } from '@/presentation/hooks/use-location';
import { useNearbyPoints } from '@/presentation/hooks/use-points';
import { useFiltersStore } from '@/presentation/stores/filters.store';

export default function MapScreen() {
  const router = useRouter();
  const [openFilters, setOpenFilters] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const { coordinate, request } = useLocation();
  const query = useNearbyPoints(coordinate);

  const clearFilters = useFiltersStore((state) => state.clear);
  const searchTerm = useFiltersStore((state) => state.searchTerm);
  const setSearchTerm = useFiltersStore((state) => state.setSearchTerm);
  const selectedCategories = useFiltersStore((state) => state.categories);
  const toggleCategory = useFiltersStore((state) => state.toggleCategory);

  const openPoint = (id: string) => router.push(`/point/${id}`);

  const navigateTo = (
    route: '/(tabs)' | '/(tabs)/education' | '/(tabs)/ranking' | '/(tabs)/profile',
  ) => {
    setMenuVisible(false);
    router.push(route);
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-light-muted dark:bg-surface-dark">
      {/* Cabeçalho */}
      <View className="flex-row items-center px-4 py-3">
        <Pressable
          onPress={() => setMenuVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Abrir menu"
        >
          <MaterialCommunityIcons name="menu" size={26} color="#059669" />
        </Pressable>

        <AppText variant="heading" className="ml-3 flex-1">
          EcoPonto
        </AppText>

        <Pressable
          onPress={() => router.push('/profile')}
          accessibilityRole="button"
          accessibilityLabel="Abrir perfil"
        >
          <MaterialCommunityIcons name="account-circle-outline" size={28} color="#059669" />
        </Pressable>
      </View>

      {/* Menu lateral */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <View className="flex-1 flex-row">
          <View className="h-full w-[78%] max-w-[320px] bg-white px-5 pb-8 pt-14 dark:bg-surface-dark">
            <View className="mb-8 flex-row items-center justify-between">
              <AppText variant="title" tone="brand">
                EcoPonto
              </AppText>

              <Pressable
                onPress={() => setMenuVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Fechar menu"
              >
                <MaterialCommunityIcons name="close" size={26} color="#059669" />
              </Pressable>
            </View>

            <View className="mb-6 rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-950">
              <MaterialCommunityIcons name="leaf" size={30} color="#059669" />
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
            onPress={() => setMenuVisible(false)}
            accessibilityRole="button"
            accessibilityLabel="Fechar menu"
          />
        </View>
      </Modal>

      {/* Busca */}
      <View className="mx-4 mb-3 flex-row items-center rounded-full border border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-surface-dark">
        <MaterialCommunityIcons name="magnify" size={22} color="#6B7280" />

        <TextInput
          className="flex-1 px-3 py-3 text-gray-800 dark:text-white"
          placeholder="Buscar pontos de reciclagem..."
          placeholderTextColor="#9CA3AF"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />

        <Pressable
          onPress={() => setOpenFilters(true)}
          accessibilityRole="button"
          accessibilityLabel="Abrir filtros"
          className="border-l border-gray-200 py-1 pl-3 dark:border-gray-700"
        >
          <MaterialCommunityIcons name="tune-variant" size={23} color="#059669" />
        </Pressable>
      </View>

      {/* Filtros rápidos */}
      <View className="mb-3 flex-row flex-wrap gap-2 px-4">
        {[
          { id: 'batteries' as const, label: 'Baterias', icon: 'battery' as const },
          { id: 'cell-phones' as const, label: 'Celulares', icon: 'cellphone' as const },
          { id: 'computers' as const, label: 'Laptops', icon: 'laptop' as const },
        ].map((category) => {
          const selected = selectedCategories.includes(category.id);

          return (
            <Pressable
              key={category.id}
              onPress={() => toggleCategory(category.id)}
              className={`flex-1 flex-row items-center justify-center gap-1 rounded-full border px-2 py-3 ${
                selected
                  ? 'border-emerald-600 bg-emerald-100'
                  : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-surface-dark'
              }`}
            >
              <MaterialCommunityIcons
                name={category.icon}
                size={16}
                color={selected ? '#047857' : '#6B7280'}
              />
              <AppText variant="caption">{category.label}</AppText>
            </Pressable>
          );
        })}
      </View>

      {/* Mapa */}
      <View className="mx-3 min-h-[220px] flex-1 overflow-hidden rounded-2xl" style={{ zIndex: 0 }}>
        <PointsMap points={query.data ?? []} origin={coordinate} onSelect={openPoint} />
      </View>

      {/* Barra de filtros */}
      <FilterBar
        hasLocation={coordinate !== null}
        onRequestLocation={request}
        resultCount={query.data?.length ?? 0}
        isFetching={query.isFetching}
        openRequested={openFilters}
        onOpenRequestHandled={() => setOpenFilters(false)}
      />

      {/* Carrossel */}
      <View
        style={{
          height: 250,
          flexShrink: 0,
          marginBottom: 76,
          zIndex: 1,
          elevation: 2,
        }}
      >
        <PointList query={query} onOpen={openPoint} onClearFilters={clearFilters} />
      </View>
    </SafeAreaView>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="flex-row items-center gap-4 rounded-xl px-3 py-4 active:bg-emerald-50 dark:active:bg-emerald-950"
    >
      <MaterialCommunityIcons name={icon} size={23} color="#059669" />
      <AppText variant="body">{label}</AppText>
    </Pressable>
  );
}

function PointList({
  query,
  onOpen,
  onClearFilters,
}: {
  query: ReturnType<typeof useNearbyPoints>;
  onOpen: (id: string) => void;
  onClearFilters: () => void;
}) {
  const { width } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);

  const points = query.data ?? [];
  const totalPoints = points.length;
  const cardWidth = width - 32;
  const cardHeight = 190;
  const cardSpacing = 12;
  const snapInterval = cardWidth + cardSpacing;

  if (query.isPending) {
    return <Loading label="Buscando pontos de coleta" />;
  }

  if (query.isError) {
    return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  }

  return (
    <View className="flex-1 pt-2">
      <AppText variant="heading" className="px-4 pb-2">
        Pontos de coleta próximos
      </AppText>

      {totalPoints > 0 ? (
        <FlatList<NearbyPoint>
          horizontal
          snapToInterval={snapInterval}
          snapToAlignment="start"
          decelerationRate="fast"
          disableIntervalMomentum
          data={points}
          keyExtractor={(item) => item.point.id}
          renderItem={({ item }) => (
            <View
              style={{
                width: cardWidth,
                height: cardHeight,
                marginRight: cardSpacing,
              }}
            >
              <PointCard
                item={item}
                onPress={() => onOpen(item.point.id)}
                currentIndex={currentIndex}
                totalPoints={totalPoints}
              />
            </View>
          )}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / snapInterval);
            setCurrentIndex(Math.max(0, Math.min(index, totalPoints - 1)));
          }}
        />
      ) : (
        <EmptyState
          title="Nenhum ponto encontrado"
          description="Tente ampliar o raio de busca ou remover alguns filtros de resíduo."
          action={{
            title: 'Limpar filtros',
            onPress: onClearFilters,
          }}
        />
      )}
    </View>
  );
}
