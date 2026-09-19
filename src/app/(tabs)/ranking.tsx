import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { FlatList, View } from 'react-native';

import type { RankingEntry } from '@/domain/repositories/disposal.repository';
import { levelFor } from '@/domain/services/gamification';
import { Badge } from '@/presentation/components/ui/badge';
import { Card } from '@/presentation/components/ui/card';
import { Screen } from '@/presentation/components/ui/screen';
import { EmptyState, ErrorState, Loading } from '@/presentation/components/ui/states';
import { AppText } from '@/presentation/components/ui/text';
import { formatPoints } from '@/presentation/features/points/formatting';
import { useRanking } from '@/presentation/hooks/use-gamification';
import { useUser } from '@/presentation/stores/session.store';

/** RB09 — recognition through ranking, seals and badges. */
export default function RankingScreen() {
  const query = useRanking();
  const user = useUser();

  return (
    <Screen title="Ranking" subtitle="Quem mais descarta corretamente na região." noPadding>
      {query.isPending ? (
        <Loading label="Carregando ranking" />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : (
        <FlatList<RankingEntry>
          data={query.data}
          keyExtractor={(item) => item.userId}
          renderItem={({ item }) => (
            <RankingRow entry={item} highlighted={item.userId === user?.id} />
          )}
          contentContainerClassName="gap-2 px-4 pb-8"
          showsVerticalScrollIndicator={false}
          refreshing={query.isRefetching}
          onRefresh={() => query.refetch()}
          ListEmptyComponent={
            <EmptyState
              icon="trophy-outline"
              title="Ranking ainda vazio"
              description="Registre o primeiro descarte e inaugure a lista."
            />
          }
        />
      )}
    </Screen>
  );
}

const MEDALS: Record<number, { icon: string; color: string }> = {
  1: { icon: 'trophy', color: '#CA8A04' },
  2: { icon: 'medal', color: '#9CA3AF' },
  3: { icon: 'medal-outline', color: '#B45309' },
};

function RankingRow({ entry, highlighted }: { entry: RankingEntry; highlighted: boolean }) {
  const medal = MEDALS[entry.position];
  const level = levelFor(entry.points);

  return (
    <Card
      className={
        highlighted ? 'flex-row items-center gap-3 border-brand-500' : 'flex-row items-center gap-3'
      }
    >
      <View className="w-9 items-center">
        {medal ? (
          <MaterialCommunityIcons name={medal.icon as never} size={24} color={medal.color} />
        ) : (
          <AppText variant="heading" tone="muted">
            {entry.position}
          </AppText>
        )}
      </View>

      <View className="flex-1 gap-1">
        <AppText variant="heading" numberOfLines={1}>
          {entry.name}
          {highlighted ? ' (você)' : ''}
        </AppText>
        <Badge label={level.title} tone="success" icon="leaf" />
      </View>

      <View className="items-end">
        <AppText variant="heading" tone="brand">
          {formatPoints(entry.points)}
        </AppText>
        <AppText variant="overline" tone="muted">
          pontos
        </AppText>
      </View>
    </Card>
  );
}
