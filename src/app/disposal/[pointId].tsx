import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { calculateDisposalPoints } from '@/domain/services/gamification';
import { getCategory, type WasteCategoryId } from '@/domain/value-objects/waste-category';
import { Button } from '@/presentation/components/ui/button';
import { Card } from '@/presentation/components/ui/card';
import { Screen } from '@/presentation/components/ui/screen';
import { ErrorState, Loading } from '@/presentation/components/ui/states';
import { AppText } from '@/presentation/components/ui/text';
import { TextField } from '@/presentation/components/ui/text-field';
import { formatPoints } from '@/presentation/features/points/formatting';
import { useRegisterDisposal } from '@/presentation/hooks/use-point-actions';
import { usePointDetails } from '@/presentation/hooks/use-points';
import { useUser } from '@/presentation/stores/session.store';

/** FE-08 / RB09 — citizen flow to register a disposal and receive gamification points. */
export default function RegisterDisposalScreen() {
  const { pointId } = useLocalSearchParams<{ pointId: string }>();
  const user = useUser();
  const pointQuery = usePointDetails(pointId, null);
  const mutation = useRegisterDisposal();
  const [category, setCategory] = useState<WasteCategoryId | null>(null);
  const [weight, setWeight] = useState('');
  const [weightError, setWeightError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    pointsEarned: number;
    totalPoints: number;
    level: string;
    achievements: string[];
  } | null>(null);

  const weightKg = Number(weight.replace(',', '.'));
  const preview = useMemo(() => {
    if (!category || !Number.isFinite(weightKg) || weightKg <= 0) return null;
    return calculateDisposalPoints({ category, weightKg });
  }, [category, weightKg]);

  if (!user) {
    return (
      <Screen title="Registrar descarte" subtitle="Entre na sua conta para acumular pontos.">
        <View className="flex-1 items-center justify-center gap-4">
          <MaterialCommunityIcons name="account-lock-outline" size={52} color="#059669" />
          <AppText variant="body" tone="muted" className="text-center">
            O registro de descarte e a gamificação são exclusivos para cidadãos autenticados.
          </AppText>
          <Button title="Entrar" icon="login" onPress={() => router.push('/sign-in')} />
        </View>
      </Screen>
    );
  }

  if (pointQuery.isPending) return <Loading label="Carregando ponto de coleta" />;
  if (pointQuery.isError || !pointQuery.data) {
    return <ErrorState error={pointQuery.error} onRetry={() => pointQuery.refetch()} />;
  }

  const point = pointQuery.data.point;

  async function submit() {
    setWeightError(null);
    setSubmitError(null);
    if (!category) {
      setSubmitError('Escolha o tipo de material que você descartou.');
      return;
    }
    if (!Number.isFinite(weightKg) || weightKg <= 0) {
      setWeightError('Informe uma quantidade maior que zero. Ex.: 2,5 kg.');
      return;
    }
    if (weightKg > 1000) {
      setWeightError('Confira o peso informado. O limite por registro é 1.000 kg.');
      return;
    }

    try {
      const output = await mutation.mutateAsync({
        collectionPointId: point.id,
        category,
        weightKg,
      });

      setSuccess({
        pointsEarned: output.record.pointsEarned,
        totalPoints: output.totalPoints,
        level: output.level,
        achievements: output.newAchievements.map((item) => item.title),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível registrar o descarte.';
      setSubmitError(message);
    }
  }

  if (success) {
    return (
      <Screen title="Descarte registrado" subtitle={point.name} noPadding>
        <ScrollView contentContainerClassName="gap-4 px-4 pb-10">
          <Card className="items-center gap-3 border-brand-200 bg-brand-50 py-6 dark:bg-brand-950">
            <MaterialCommunityIcons name="check-decagram" size={56} color="#059669" />
            <AppText variant="heading" className="text-center">Descarte registrado com sucesso!</AppText>
            <AppText variant="display" tone="brand">+{success.pointsEarned} pontos</AppText>
            <AppText variant="body" tone="muted" className="text-center">
              Seu saldo agora é {formatPoints(success.totalPoints)} pontos e seu nível é {success.level}.
            </AppText>
          </Card>

          {success.achievements.length > 0 ? (
            <Card className="gap-2">
              <View className="flex-row items-center gap-2">
                <MaterialCommunityIcons name="trophy-award" size={24} color="#059669" />
                <AppText variant="heading">Nova conquista</AppText>
              </View>
              <AppText variant="body">{success.achievements.join(', ')}</AppText>
            </Card>
          ) : null}

          <Button
            title="Ver meu progresso"
            icon="chart-line"
            size="lg"
            fullWidth
            onPress={() => router.replace('/(tabs)/profile')}
          />
          <Button
            title="Registrar outro descarte"
            icon="recycle"
            variant="outline"
            fullWidth
            onPress={() => {
              setSuccess(null);
              setCategory(null);
              setWeight('');
              setSubmitError(null);
            }}
          />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen title="Registrar descarte" subtitle={point.name} noPadding>
      <ScrollView contentContainerClassName="gap-4 px-4 pb-10" keyboardShouldPersistTaps="handled">
        <Card className="gap-2">
          <AppText variant="overline" tone="muted">Local do descarte</AppText>
          <AppText variant="heading">{point.name}</AppText>
          <AppText variant="caption" tone="muted">{point.address} · {point.city}</AppText>
        </Card>

        <View className="gap-2">
          <AppText variant="heading">1. O que você descartou?</AppText>
          <AppText variant="caption" tone="muted">
            Mostramos apenas materiais aceitos por este EcoPonto.
          </AppText>
          <View className="flex-row flex-wrap gap-2">
            {point.categories.map((id) => {
              const item = getCategory(id);
              const selected = category === id;
              return (
                <Pressable
                  key={id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => setCategory(id)}
                  className={[
                    'min-h-[48px] flex-row items-center gap-2 rounded-2xl border px-3 py-2',
                    selected ? 'border-brand-600 bg-brand-50 dark:bg-brand-900' : 'border-black/10 bg-white dark:border-white/10 dark:bg-surface-dark-muted',
                  ].join(' ')}
                >
                  <MaterialCommunityIcons name={item.icon as never} size={20} color={item.color} />
                  <AppText variant="caption">{item.name}</AppText>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="gap-2">
          <AppText variant="heading">2. Qual foi a quantidade?</AppText>
          <TextField
            label="Peso aproximado (kg)"
            placeholder="Ex.: 2,5"
            keyboardType="decimal-pad"
            value={weight}
            onChangeText={setWeight}
            error={weightError}
            hint="Você pode informar um peso aproximado."
          />
        </View>

        {category && preview ? (
          <Card className="gap-3 border-brand-200 bg-brand-50 dark:bg-brand-950">
            <View className="flex-row items-center justify-between">
              <View>
                <AppText variant="overline" tone="muted">Prévia de pontos</AppText>
                <AppText variant="display" tone="brand">+{preview.points}</AppText>
              </View>
              <MaterialCommunityIcons name="star-circle" size={40} color="#059669" />
            </View>
            <AppText variant="caption" tone="muted">
              {getCategory(category).pointsPerKg} pts/kg × {weightKg.toLocaleString('pt-BR')} kg. A pontuação final também considera sua frequência de descartes nos últimos 30 dias.
            </AppText>
          </Card>
        ) : null}

        {submitError ? (
          <Card className="border-state-danger/30">
            <View className="flex-row items-center gap-2">
              <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#DC2626" />
              <AppText variant="caption">{submitError}</AppText>
            </View>
          </Card>
        ) : null}

        <Button
          title="Confirmar descarte"
          icon="recycle"
          size="lg"
          fullWidth
          loading={mutation.isPending}
          onPress={submit}
        />
        <AppText variant="caption" tone="muted" className="text-center">
          Ao confirmar, o descarte entra no seu histórico, atualiza seus pontos, ranking e conquistas.
        </AppText>
      </ScrollView>
    </Screen>
  );
}
