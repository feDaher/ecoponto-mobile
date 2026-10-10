import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { getCategory } from '@/domain/value-objects/waste-category';
import { Button } from '@/presentation/components/ui/button';
import { Card } from '@/presentation/components/ui/card';
import { Screen } from '@/presentation/components/ui/screen';
import { ErrorState, Loading } from '@/presentation/components/ui/states';
import { AppText } from '@/presentation/components/ui/text';
import { usePointDetails } from '@/presentation/hooks/use-points';
import { usePermission } from '@/presentation/stores/session.store';

/** Point details with the FE-08 entry point for disposal registration. */
export default function PointDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = usePointDetails(id, null);
  const canRegisterDisposal = usePermission('disposal:register');

  if (query.isPending) return <Loading label="Carregando ponto de coleta" />;
  if (query.isError || !query.data) {
    return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  }

  const { point, isOpenNow, isInfoOutdated } = query.data;

  return (
    <Screen title={point.name} subtitle={`${point.address} · ${point.city}`} noPadding>
      <ScrollView contentContainerClassName="gap-3 px-4 pb-10" showsVerticalScrollIndicator={false}>
        <Card className="gap-3">
          <View className="flex-row items-center gap-2">
            <MaterialCommunityIcons name="clock-outline" size={20} color={isOpenNow ? '#059669' : '#9AA7A0'} />
            <AppText variant="heading" tone={isOpenNow ? 'brand' : 'muted'}>
              {isOpenNow ? 'Aberto agora' : 'Fechado agora'}
            </AppText>
          </View>
          {point.description ? <AppText variant="body" tone="muted">{point.description}</AppText> : null}
          {isInfoOutdated ? (
            <AppText variant="caption" tone="warning">Os dados deste ponto podem estar desatualizados.</AppText>
          ) : null}
        </Card>

        <Card className="gap-3">
          <AppText variant="overline" tone="muted">Materiais aceitos</AppText>
          <View className="flex-row flex-wrap gap-2">
            {point.categories.map((id) => {
              const category = getCategory(id);
              return (
                <View key={id} className="flex-row items-center gap-2 rounded-2xl bg-black/[0.03] px-3 py-2 dark:bg-white/5">
                  <MaterialCommunityIcons name={category.icon as never} size={18} color={category.color} />
                  <AppText variant="caption">{category.name}</AppText>
                </View>
              );
            })}
          </View>
        </Card>

        <Card className="gap-3 border-brand-200">
          <View className="flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900">
              <MaterialCommunityIcons name="recycle" size={24} color="#059669" />
            </View>
            <View className="flex-1">
              <AppText variant="heading">Fez um descarte aqui?</AppText>
              <AppText variant="caption" tone="muted">Registre para ganhar pontos e subir no ranking.</AppText>
            </View>
          </View>
          <Button
            title={canRegisterDisposal ? 'Registrar descarte' : 'Entrar para registrar'}
            icon="plus-circle-outline"
            fullWidth
            onPress={() => {
              if (canRegisterDisposal) router.push(`/disposal/${point.id}`);
              else router.push('/sign-in');
            }}
          />
        </Card>

        <Button title="Voltar ao mapa" variant="ghost" icon="arrow-left" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}
