import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { MAX_WEIGHT_KG, MIN_WEIGHT_KG } from '@/domain/entities/disposal-record';
import { calculateDisposalPoints } from '@/domain/services/gamification';
import { getCategory, type WasteCategoryId } from '@/domain/value-objects/waste-category';
import { Button } from '@/presentation/components/ui/button';
import { Card } from '@/presentation/components/ui/card';
import { Chip } from '@/presentation/components/ui/chip';
import { Screen } from '@/presentation/components/ui/screen';
import { ErrorState, Loading } from '@/presentation/components/ui/states';
import { AppText } from '@/presentation/components/ui/text';
import { TextField } from '@/presentation/components/ui/text-field';
import { formatPoints, formatWeight } from '@/presentation/features/points/formatting';
import { getErrorMessage } from '@/presentation/hooks/result';
import { useMyDisposals } from '@/presentation/hooks/use-gamification';
import { useRegisterDisposal } from '@/presentation/hooks/use-point-actions';
import { usePointDetails } from '@/presentation/hooks/use-points';
import { useUser } from '@/presentation/stores/session.store';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

type SuccessState = {
  readonly pointsEarned: number;
  readonly totalPoints: number;
  readonly level: string;
  readonly achievements: readonly string[];
};

/**
 * Disposal registration and gamification (FE-08).
 *
 * RB01 / RB02 — an active interaction: only an authenticated Citizen registers.
 * RB05 — the materials offered are the ones this point accepts.
 * RB09 — the score comes from the domain service (type × quantity × frequency);
 * the server remains the source of truth for the persisted total.
 */
export default function RegisterDisposalScreen() {
  const { pointId } = useLocalSearchParams<{ pointId: string }>();
  const user = useUser();
  const pointQuery = usePointDetails(pointId, null);
  const history = useMyDisposals();
  const mutation = useRegisterDisposal();
  const [category, setCategory] = useState<WasteCategoryId | null>(null);
  const [weight, setWeight] = useState('');
  const [weightError, setWeightError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessState | null>(null);

  const weightKg = Number(weight.replace(',', '.'));

  // RB09 — the same frequency the use case applies, so the preview doesn't
  // promise less than the citizen actually receives. The window is counted in
  // the application layer, which keeps this screen free of clock reads.
  const disposalsLast30Days = history.data?.disposalsLast30Days ?? 0;

  const preview = useMemo(() => {
    if (!category || !Number.isFinite(weightKg) || weightKg <= 0) return null;
    return calculateDisposalPoints({ category, weightKg, disposalsLast30Days });
  }, [category, weightKg, disposalsLast30Days]);

  // RB01 — registering a disposal requires an account; the map stays public.
  if (!user) {
    return (
      <Screen edges={[]}>
        <View className="flex-1 items-center justify-center gap-4">
          <MaterialCommunityIcons name="account-lock-outline" size={52} color="#047857" />
          <AppText variant="heading" className="text-center">
            Entre para registrar seu descarte
          </AppText>
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

  const submit = async () => {
    setWeightError(null);
    setSubmitError(null);

    if (!category) {
      setSubmitError('Escolha o tipo de material que você descartou.');
      return;
    }

    // The same limits the entity validates (`DisposalRecord.create`), checked
    // here only to answer before the round trip.
    if (!Number.isFinite(weightKg) || weightKg < MIN_WEIGHT_KG) {
      setWeightError(`Informe um peso a partir de ${formatWeight(MIN_WEIGHT_KG)}. Ex.: 2,5 kg.`);
      return;
    }

    if (weightKg > MAX_WEIGHT_KG) {
      setWeightError(`O limite por registro é ${formatWeight(MAX_WEIGHT_KG)}.`);
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
      setSubmitError(getErrorMessage(error));
    }
  };

  if (success) {
    return (
      <Screen edges={[]} noPadding>
        <ScrollView contentContainerClassName="gap-4 px-4 py-4 pb-10">
          <Card className="dark:bg-brand-950 items-center gap-3 border-brand-200 bg-brand-50 py-6">
            <MaterialCommunityIcons name="check-decagram" size={56} color="#047857" />
            <AppText variant="heading" className="text-center">
              Descarte registrado com sucesso!
            </AppText>
            <AppText variant="display" tone="brand">
              +{formatPoints(success.pointsEarned)} pontos
            </AppText>
            <AppText variant="body" tone="muted" className="text-center">
              Seu saldo agora é {formatPoints(success.totalPoints)} pontos e seu nível é{' '}
              {success.level}.
            </AppText>
          </Card>

          {success.achievements.length > 0 ? (
            <Card className="gap-2">
              <View className="flex-row items-center gap-2">
                <MaterialCommunityIcons name="trophy-award" size={24} color="#047857" />
                <AppText variant="heading">
                  {success.achievements.length === 1 ? 'Nova conquista' : 'Novas conquistas'}
                </AppText>
              </View>
              <AppText variant="body">{success.achievements.join(', ')}</AppText>
            </Card>
          ) : null}

          <Button
            title="Ver meu progresso"
            icon="chart-line"
            size="lg"
            fullWidth
            onPress={() => router.replace('/profile')}
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
              setWeightError(null);
              setSubmitError(null);
            }}
          />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen edges={[]} noPadding>
      <ScrollView
        contentContainerClassName="gap-4 px-4 py-4 pb-10"
        keyboardShouldPersistTaps="handled"
      >
        <Card className="gap-1">
          <AppText variant="overline" tone="muted">
            Local do descarte
          </AppText>
          <AppText variant="heading">{point.name}</AppText>
          <AppText variant="caption" tone="muted">
            {point.address} · {point.city}
          </AppText>
        </Card>

        <View className="gap-2">
          <AppText variant="heading">1. O que você descartou?</AppText>
          <AppText variant="caption" tone="muted">
            Mostramos apenas os materiais aceitos por este EcoPonto.
          </AppText>

          <View className="flex-row flex-wrap gap-2">
            {point.categories.map((categoryId) => {
              const item = getCategory(categoryId);

              return (
                <Chip
                  key={item.id}
                  label={item.name}
                  icon={item.icon as IconName}
                  color={item.color}
                  selected={category === item.id}
                  onPress={() => setCategory(item.id)}
                />
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

        {preview ? (
          <Card className="dark:bg-brand-950 gap-3 border-brand-200 bg-brand-50">
            <View className="flex-row items-center justify-between">
              <View>
                <AppText variant="overline" tone="muted">
                  Prévia de pontos
                </AppText>
                <AppText variant="display" tone="brand">
                  +{formatPoints(preview.points)}
                </AppText>
              </View>
              <MaterialCommunityIcons name="star-circle" size={40} color="#047857" />
            </View>

            <AppText variant="caption" tone="muted">
              {getCategory(category as WasteCategoryId).pointsPerKg} pts/kg ×{' '}
              {weightKg.toLocaleString('pt-BR')} kg × {preview.frequencyMultiplier} (
              {preview.frequencyLabel.toLocaleLowerCase('pt-BR')}). O valor final é confirmado pelo
              servidor.
            </AppText>
          </Card>
        ) : null}

        {submitError ? (
          <Card
            accessibilityRole="alert"
            className="flex-row items-center gap-2 border-state-danger/30"
          >
            <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#DC2626" />
            <AppText variant="caption" className="flex-1">
              {submitError}
            </AppText>
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
          Ao confirmar, o descarte entra no seu histórico e atualiza seus pontos, ranking e
          conquistas.
        </AppText>
      </ScrollView>
    </Screen>
  );
}
