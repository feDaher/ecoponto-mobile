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
};

/**
 * Item of the points carousel — summarizes what decides the trip to the place.
 *
 * Minimum height, not a fixed one: with a larger system font the card grows
 * instead of clipping the text. The carousel stretches its cards to the same
 * height, so they still line up.
 */
export function PointCard({ item, onPress }: PointCardProps) {
  const { point, distanceKm, isOpenNow, isInfoOutdated } = item;
  const distance = formatDistance(distanceKm);

  const visibleCategories = point.categories.slice(0, 2);
  const remaining = point.categories.length - visibleCategories.length;

  return (
    <Card
      onPress={onPress}
      accessibilityLabel={`${point.name}. ${isOpenNow ? 'Aberto agora' : 'Fechado agora'}${
        distance ? `. A ${distance}` : ''
      }`}
      className="min-h-[160px] flex-1 gap-2 p-3"
    >
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

      <View className="flex-row flex-wrap items-center gap-1.5">
        <Badge
          label={isOpenNow ? 'Aberto agora' : 'Fechado agora'}
          tone={isOpenNow ? 'success' : 'neutral'}
          icon={isOpenNow ? 'clock-check-outline' : 'clock-outline'}
        />

        {/* RB06 */}
        {isInfoOutdated ? (
          <Badge label="Dado desatualizado" tone="warning" icon="alert-outline" />
        ) : null}

        {/* RB08 */}
        {point.isWhatsAppAvailable ? (
          <Badge label="WhatsApp" tone="success" icon="whatsapp" />
        ) : null}
      </View>

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

      {point.averageRating !== null ? (
        <StarRating rating={point.averageRating} reviewCount={point.reviewCount} />
      ) : null}
    </Card>
  );
}
