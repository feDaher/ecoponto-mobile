import { View } from 'react-native';

import type { NearbyPoint } from '@/application/use-cases/list-nearby-points.use-case';
import { getCategory } from '@/domain/value-objects/waste-category';

import { Badge } from '../../components/ui/badge';
import { Card } from '../../components/ui/card';
import { StarRating } from '../../components/ui/star-rating';
import { AppText } from '../../components/ui/text';
import { formatDistance } from './formatting';

export type PointCardProps = {
  item: NearbyPoint;
  onPress: () => void;
  currentIndex: number;
  totalPoints: number;
};

export function PointCard({ item, onPress, currentIndex, totalPoints }: PointCardProps) {
  const { point, distanceKm, isOpenNow, isInfoOutdated } = item;
  const distance = formatDistance(distanceKm);

  const visibleCategories = point.categories.slice(0, 2);
  const remaining = point.categories.length - visibleCategories.length;

  return (
    <Card
      onPress={onPress}
      accessibilityLabel={`${point.name}. ${
        isOpenNow ? 'Aberto agora' : 'Fechado agora'
      }${distance ? `. A ${distance}` : ''}`}
      className="h-[190px] p-3"
    >
      <View className="flex-1 justify-between">
        <View className="gap-2">
          {/* Nome e endereço */}
          <View className="flex-row items-start justify-between gap-2">
            <View className="flex-1 gap-1">
              <AppText variant="heading" numberOfLines={1}>
                {point.name}
              </AppText>

              <AppText variant="caption" tone="muted" numberOfLines={1}>
                {point.address}
              </AppText>
            </View>

            {distance ? (
              <AppText variant="caption" tone="brand">
                {distance}
              </AppText>
            ) : null}
          </View>

          {/* Situação e contato */}
          <View className="flex-row flex-wrap items-center gap-1.5">
            <Badge
              label={isOpenNow ? 'Aberto agora' : 'Fechado agora'}
              tone={isOpenNow ? 'success' : 'neutral'}
              icon={isOpenNow ? 'clock-check-outline' : 'clock-outline'}
            />

            {isInfoOutdated ? (
              <Badge label="Dado desatualizado" tone="warning" icon="alert-outline" />
            ) : null}

            {point.isWhatsAppAvailable ? (
              <Badge label="WhatsApp" tone="success" icon="whatsapp" />
            ) : null}
          </View>

          {/* Materiais aceitos */}
          <View className="flex-row flex-wrap items-center gap-1">
            {visibleCategories.map((id) => {
              const category = getCategory(id);

              return (
                <View
                  key={id}
                  style={{ backgroundColor: `${category.color}1A` }}
                  className="rounded-pill px-2 py-1"
                >
                  <AppText variant="overline" numberOfLines={1} style={{ color: category.color }}>
                    {category.name}
                  </AppText>
                </View>
              );
            })}

            {remaining > 0 ? (
              <AppText variant="caption" tone="muted">
                +{remaining}
              </AppText>
            ) : null}
          </View>

          {/* Avaliação */}
          {point.averageRating !== null ? (
            <StarRating rating={point.averageRating} reviewCount={point.reviewCount} />
          ) : null}
        </View>

        {/* Barra de progresso */}
        <View className="gap-1">
          <View className="flex-row items-center justify-between">
            <AppText variant="caption" tone="muted">
              Pontos de coleta
            </AppText>

            <AppText variant="caption" tone="muted">
              {currentIndex + 1} de {totalPoints}
            </AppText>
          </View>

          <View className="flex-row gap-1">
            {Array.from({ length: totalPoints }).map((_, index) => (
              <View
                key={index}
                style={{
                  flex: 1,
                  height: 5,
                  borderRadius: 10,
                  backgroundColor: index <= currentIndex ? '#059669' : '#D1D5DB',
                }}
              />
            ))}
          </View>
        </View>
      </View>
    </Card>
  );
}
