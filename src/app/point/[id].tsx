import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, ScrollView, View } from 'react-native';
import { useState } from 'react';

import { Button } from '@/presentation/components/ui/button';
import { Card } from '@/presentation/components/ui/card';
import { StarRating } from '@/presentation/components/ui/star-rating';
import { TextField } from '@/presentation/components/ui/text-field';
import { AppText } from '@/presentation/components/ui/text';
import { ErrorState, Loading } from '@/presentation/components/ui/states';
import { useLocation } from '@/presentation/hooks/use-location';
import { usePointDetails } from '@/presentation/hooks/use-points';
import { useReviewPoint } from '@/presentation/hooks/use-point-actions';
import { useSessionStatus, useUser } from '@/presentation/stores/session.store';

/**
 * Collection point details (RN03, RN08, RB06, RB08, RB11, RB12).
 *
 * RB12 — the point page is public, while publishing a review requires an
 * authenticated user. The average is calculated from published reviews by
 * the application/domain layer.
 */
export default function PointDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { coordinate } = useLocation();
  const query = usePointDetails(id, coordinate);
  const user = useUser();
  const sessionStatus = useSessionStatus();
  const reviewMutation = useReviewPoint(id ?? '');
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');

  if (query.isPending) return <Loading label="Carregando informações do ponto" />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  if (!query.data) return null;

  const { point, reviews, averageRating, isOpenNow, isInfoOutdated } = query.data;

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
      Alert.alert(
        'Não foi possível avaliar',
        error instanceof Error ? error.message : 'Tente novamente em alguns instantes.',
      );
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

        {point.description ? <AppText>{point.description}</AppText> : null}

        {isInfoOutdated ? (
          <View className="flex-row items-center gap-2 rounded-xl bg-amber-100 p-3 dark:bg-amber-900/30">
            <MaterialCommunityIcons name="alert-outline" size={20} color="#D97706" />
            <AppText variant="caption" tone="warning" className="flex-1">
              As informações deste ponto podem estar desatualizadas.
            </AppText>
          </View>
        ) : null}
      </Card>

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
