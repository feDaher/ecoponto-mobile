import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { NearbyPoint } from '@/application/use-cases/list-nearby-points.use-case';
import { EmptyState, ErrorState, Loading } from '@/presentation/components/ui/states';
import { AppText } from '@/presentation/components/ui/text';
import { FilterBar } from '@/presentation/features/points/filter-bar';
import { PointCard } from '@/presentation/features/points/point-card';
import { PointsMap } from '@/presentation/features/points/points-map';
import { useLocation } from '@/presentation/hooks/use-location';
import { useNearbyPoints } from '@/presentation/hooks/use-points';
import { useContainer } from '@/presentation/providers/container-provider';
import { useActiveFilterCount, useFiltersStore } from '@/presentation/stores/filters.store';

/**
 * Main screen — map + list of collection points.
 *
 * RB01: public, no sign-in required.
 * RB03: shows only approved points (guaranteed in the use case).
 * RB07: combined filters by waste type, radius, city/neighborhood and availability.
 */
export default function MapScreen() {
  const router = useRouter();
  const { info } = useContainer();
  const { coordinate, permission, request } = useLocation();
  const query = useNearbyPoints(coordinate);
  const clearFilters = useFiltersStore((state) => state.clear);
  const activeFilters = useActiveFilterCount();

  const openPoint = (id: string) => router.push(`/point/${id}`);

  return (
    <View className="flex-1 bg-surface-light-muted dark:bg-surface-dark">
      <View className="h-[36%] w-full overflow-hidden">
        <PointsMap points={query.data ?? []} origin={coordinate} onSelect={openPoint} />

        <SafeAreaView edges={['top']} className="absolute left-0 right-0 top-0">
          <View className="m-3 flex-row items-center gap-2 rounded-2xl bg-surface-light/95 px-3 py-2 dark:bg-surface-dark/95">
            <MaterialCommunityIcons name="recycle" size={20} color="#059669" />
            <View className="flex-1">
              <AppText variant="heading">EcoPonto Digital</AppText>
              <AppText variant="caption" tone="muted" accessibilityLiveRegion="polite">
                {resultLabel(query.data?.length ?? 0, activeFilters > 0)}
              </AppText>
            </View>

            {query.isFetching ? (
              <ActivityIndicator
                size="small"
                color="#059669"
                accessibilityLabel="Aplicando filtros"
              />
            ) : null}
          </View>
        </SafeAreaView>
      </View>

      <View className="-mt-5 flex-1 rounded-t-3xl bg-surface-light-muted pt-4 dark:bg-surface-dark">
        {info.dataSource === 'in-memory' ? <DemoModeNotice /> : null}

        {permission !== 'granted' ? <LocationPrompt onAllow={request} /> : null}

        <FilterBar
          hasLocation={coordinate !== null}
          onRequestLocation={request}
          resultCount={query.data?.length ?? 0}
          isFetching={query.isFetching}
        />

        <PointList query={query} onOpen={openPoint} onClearFilters={clearFilters} />
      </View>
    </View>
  );
}

function resultLabel(count: number, filtered: boolean): string {
  const noun = count === 1 ? 'ponto' : 'pontos';
  if (filtered) return `${count} ${noun} ${count === 1 ? 'encontrado' : 'encontrados'}`;
  return `${count} ${noun} ${count === 1 ? 'credenciado' : 'credenciados'}`;
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
  if (query.isPending) return <Loading label="Buscando pontos de coleta" />;

  if (query.isError) {
    return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  }

  return (
    <FlatList<NearbyPoint>
      data={query.data}
      keyExtractor={(item) => item.point.id}
      renderItem={({ item }) => <PointCard item={item} onPress={() => onOpen(item.point.id)} />}
      contentContainerClassName="gap-3 px-4 pb-8 pt-3"
      showsVerticalScrollIndicator={false}
      refreshing={query.isRefetching}
      onRefresh={() => query.refetch()}
      ListEmptyComponent={
        <EmptyState
          title="Nenhum ponto encontrado"
          description="Tente ampliar o raio de busca ou remover alguns filtros de resíduo."
          action={{ title: 'Limpar filtros', onPress: onClearFilters }}
        />
      }
    />
  );
}

/** RB07 — distance only exists with a location; we ask with context, not at boot. */
function LocationPrompt({ onAllow }: { onAllow: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Permitir acesso à localização"
      onPress={onAllow}
      className="mx-4 mb-3 flex-row items-center gap-3 rounded-2xl bg-brand-100 p-3 active:opacity-80 dark:bg-brand-900"
    >
      <MaterialCommunityIcons name="crosshairs-gps" size={22} color="#047857" />
      <View className="flex-1">
        <AppText variant="heading" tone="brand">
          Usar minha localização
        </AppText>
        <AppText variant="caption" tone="muted">
          Para ordenar por proximidade e traçar rotas até o ponto.
        </AppText>
      </View>
    </Pressable>
  );
}

/** Transparency: makes it clear the data on screen is not real yet. */
function DemoModeNotice() {
  return (
    <View className="mx-4 mb-3 flex-row items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-100/70 px-3 py-2 dark:bg-amber-900/30">
      <MaterialCommunityIcons name="flask-outline" size={18} color="#D97706" />
      <AppText variant="caption" tone="warning" className="flex-1">
        Modo demonstração: dados fictícios de Manhuaçu–MG, sem conexão com a API.
      </AppText>
    </View>
  );
}
