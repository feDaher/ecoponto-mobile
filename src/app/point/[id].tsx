import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, ScrollView, View } from 'react-native';
import { useState } from 'react';

import { WEEKDAY_NAME, groupByDay, type Weekday } from '@/domain/entities/opening-hours';
import { getCategory } from '@/domain/value-objects/waste-category';
import { Badge } from '@/presentation/components/ui/badge';
import { Button } from '@/presentation/components/ui/button';
import { Card } from '@/presentation/components/ui/card';
import { StarRating } from '@/presentation/components/ui/star-rating';
import { TextField } from '@/presentation/components/ui/text-field';
import { AppText } from '@/presentation/components/ui/text';
import { ErrorState, Loading } from '@/presentation/components/ui/states';
import { PointMapPreview } from '@/presentation/features/points/point-map-preview';
import {
  formatDistance,
  openingStatusLabel,
  outdatedNotice,
} from '@/presentation/features/points/formatting';
import { getErrorMessage } from '@/presentation/hooks/result';
import { useLocation } from '@/presentation/hooks/use-location';
import { usePointDetails } from '@/presentation/hooks/use-points';
import {
  useContactWhatsApp,
  usePlotRoute,
  useReviewPoint,
} from '@/presentation/hooks/use-point-actions';
import { usePermission, useSessionStatus, useUser } from '@/presentation/stores/session.store';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const WEEKDAYS: readonly Weekday[] = [0, 1, 2, 3, 4, 5, 6];

/**
 * Collection point details (RN03, RN08, RB04, RB06, RB08, RB09, RB11, RB12).
 *
 * RB01 — the page is public; publishing a review (RB12) and registering a
 * disposal (RB09) are the parts that require an account. The average comes
 * from published reviews, calculated by the application/domain layer.
 */
export default function PointDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { coordinate } = useLocation();
  const query = usePointDetails(id, coordinate);
  const user = useUser();
  const sessionStatus = useSessionStatus();
  const canRegisterDisposal = usePermission('disposal:register');
  const reviewMutation = useReviewPoint(id ?? '');
  const routeMutation = usePlotRoute(coordinate);
  const whatsAppMutation = useContactWhatsApp();
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');

  if (query.isPending) return <Loading label="Carregando informações do ponto" />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  if (!query.data) return null;

  const { point, reviews, averageRating, distanceKm, isOpenNow, isInfoOutdated, daysSinceUpdate } =
    query.data;

  const distance = formatDistance(distanceKm);
  const hoursByDay = groupByDay(point.openingHours);

  // RB11 — the route opens in Google Maps, outside the app.
  const openRoute = async () => {
    try {
      await routeMutation.mutateAsync(point);
    } catch (error) {
      Alert.alert('Não foi possível abrir a rota', getErrorMessage(error));
    }
  };

  // RB08 — only reachable when the collector authorized showing the number.
  const openWhatsApp = async () => {
    try {
      await whatsAppMutation.mutateAsync(point);
    } catch (error) {
      Alert.alert('Não foi possível abrir o WhatsApp', getErrorMessage(error));
    }
  };

  const submitReview = async () => {
    if (!user) {
      router.push('/sign-in');
      return;
    }

    if (rating === 0) {
      Alert.alert('Informe sua nota', 'Escolha de 1 a 5 estrelas para avaliar o ponto.');
      return;
    }

    try {
      await reviewMutation.mutateAsync({ rating, comment: comment.trim() || undefined });
      setRating(0);
      setComment('');
      Alert.alert('Avaliação enviada', 'Obrigado por compartilhar sua experiência.');
    } catch (error) {
      Alert.alert('Não foi possível avaliar', getErrorMessage(error));
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-surface-light-muted dark:bg-surface-dark"
      contentContainerClassName="gap-4 p-4 pb-8"
      showsVerticalScrollIndicator={false}
    >
      <Card className="gap-3">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-1">
            <AppText variant="title">{point.name}</AppText>
            <AppText variant="body" tone="muted">
              {point.address}
              {point.neighborhood ? ` • ${point.neighborhood}` : ''}
              {point.city ? ` • ${point.city}` : ''}
            </AppText>
          </View>

          <View className="items-center rounded-xl bg-brand-100 px-2 py-1 dark:bg-brand-900">
            <MaterialCommunityIcons
              name={isOpenNow ? 'clock-check-outline' : 'clock-outline'}
              size={20}
              color="#047857"
            />
            <AppText variant="caption" tone="brand">
              {isOpenNow ? 'Aberto' : 'Fechado'}
            </AppText>
          </View>
        </View>

        <View className="flex-row flex-wrap items-center gap-2">
          {distance ? (
            <Badge label={distance} tone="info" icon="navigation-variant-outline" />
          ) : null}
          <Badge
            label={openingStatusLabel(point.openingHours)}
            tone={isOpenNow ? 'success' : 'neutral'}
            icon="clock-outline"
          />
        </View>

        {point.description ? <AppText>{point.description}</AppText> : null}

        {isInfoOutdated ? (
          <View
            accessibilityRole="alert"
            className="flex-row items-center gap-2 rounded-xl bg-amber-100 p-3 dark:bg-amber-900/30"
          >
            <MaterialCommunityIcons name="alert-outline" size={20} color="#D97706" />
            <AppText variant="caption" tone="warning" className="flex-1">
              {outdatedNotice(daysSinceUpdate)}
            </AppText>
          </View>
        ) : null}
      </Card>

      <View className="flex-row gap-3">
        <Button
          title="Como chegar"
          icon="directions"
          loading={routeMutation.isPending}
          onPress={openRoute}
          className="flex-1"
        />

        {point.isWhatsAppAvailable ? (
          <Button
            title="WhatsApp"
            icon="whatsapp"
            variant="secondary"
            loading={whatsAppMutation.isPending}
            onPress={openWhatsApp}
            accessibilityLabel="Falar com o responsável pelo ponto no WhatsApp"
            className="flex-1"
          />
        ) : null}
      </View>

      {/* RB09 — entry point for the disposal registration (FE-08). */}
      <Card className="gap-3">
        <View className="flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900">
            <MaterialCommunityIcons name="recycle" size={24} color="#047857" />
          </View>
          <View className="flex-1">
            <AppText variant="heading">Fez um descarte aqui?</AppText>
            <AppText variant="caption" tone="muted">
              Registre para ganhar pontos e subir no ranking.
            </AppText>
          </View>
        </View>

        <Button
          title={canRegisterDisposal ? 'Registrar descarte' : 'Entrar para registrar'}
          icon={canRegisterDisposal ? 'plus-circle-outline' : 'login'}
          variant={canRegisterDisposal ? 'primary' : 'outline'}
          fullWidth
          onPress={() =>
            canRegisterDisposal ? router.push(`/disposal/${point.id}`) : router.push('/sign-in')
          }
        />
      </Card>

      <Card className="gap-3">
        <AppText variant="heading">Materiais aceitos</AppText>

        <View className="flex-row flex-wrap gap-2">
          {point.categories.map((categoryId) => {
            const category = getCategory(categoryId);

            return (
              <View
                key={category.id}
                className="flex-row items-center gap-2 rounded-pill bg-black/[0.04] px-3 py-2 dark:bg-white/10"
              >
                <MaterialCommunityIcons
                  name={category.icon as IconName}
                  size={18}
                  color={category.color}
                />
                <AppText variant="caption">{category.name}</AppText>
              </View>
            );
          })}
        </View>
      </Card>

      {/* RB06 — the published hours, day by day. */}
      <Card className="gap-2">
        <AppText variant="heading">Horários</AppText>

        {WEEKDAYS.map((weekday) => {
          const windows = hoursByDay.find((entry) => entry.day === weekday)?.windows ?? [];
          const today = weekday === new Date().getDay();

          return (
            <View key={weekday} className="flex-row justify-between gap-3">
              <AppText variant="caption" tone={today ? 'brand' : 'muted'}>
                {WEEKDAY_NAME[weekday]}
                {today ? ' (hoje)' : ''}
              </AppText>
              <AppText variant="caption" className="flex-1 text-right">
                {windows.length > 0 ? windows.map((window) => window.label).join(' · ') : 'Fechado'}
              </AppText>
            </View>
          );
        })}
      </Card>

      <PointMapPreview point={point} />

      <Card className="gap-3">
        <AppText variant="heading">Avaliação do ponto</AppText>

        <View className="flex-row items-center gap-3">
          <StarRating rating={averageRating} reviewCount={reviews.length} size={22} />
          {reviews.length === 0 ? (
            <AppText variant="caption" tone="muted">
              Ainda não há avaliações
            </AppText>
          ) : null}
        </View>

        <AppText variant="caption" tone="muted">
          A média considera somente avaliações publicadas.
        </AppText>
      </Card>

      <Card className="gap-4">
        <View className="gap-1">
          <AppText variant="heading">Deixe sua avaliação</AppText>
          <AppText variant="caption" tone="muted">
            {user
              ? 'Conte como foi sua experiência neste ponto.'
              : 'Entre na sua conta para avaliar este ponto.'}
          </AppText>
        </View>

        <View className="gap-2">
          <AppText variant="caption" tone="muted">
            Sua nota
          </AppText>
          <StarRating rating={rating} onSelect={setRating} size={32} />
        </View>

        <TextField
          label="Comentário"
          value={comment}
          onChangeText={setComment}
          placeholder="Compartilhe sua experiência (opcional)"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={500}
          className="min-h-[110px]"
          editable={!reviewMutation.isPending}
          hint={`${comment.length}/500 caracteres`}
        />

        <Button
          title={user ? 'Publicar avaliação' : 'Entrar para avaliar'}
          icon={user ? 'star-plus-outline' : 'login'}
          loading={reviewMutation.isPending}
          disabled={sessionStatus === 'loading' || (Boolean(user) && rating === 0)}
          onPress={submitReview}
          fullWidth
        />
      </Card>

      {reviews.length > 0 ? (
        <View className="gap-3">
          <AppText variant="heading">Comentários</AppText>
          {reviews.map((review) => (
            <Card key={review.id} className="gap-2">
              <View className="flex-row items-center justify-between gap-3">
                <AppText variant="heading" numberOfLines={1} className="flex-1">
                  {review.author || 'Usuário'}
                </AppText>
                <StarRating rating={review.rating} size={16} />
              </View>
              {review.comment ? <AppText>{review.comment}</AppText> : null}
              <AppText variant="caption" tone="muted">
                {review.reviewedAt.toLocaleDateString('pt-BR')}
              </AppText>
            </Card>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}
