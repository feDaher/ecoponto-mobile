import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, View } from 'react-native';

import { MAX_RATING } from '@/domain/entities/review';

import { AppText } from './text';

export type StarRatingProps = {
  rating: number | null;
  /** Enables selection — used in the review form (RB12). */
  onSelect?: (rating: number) => void;
  size?: number;
  reviewCount?: number;
};

/** Displays (or collects) a collection point's rating. */
export function StarRating({ rating, onSelect, size = 16, reviewCount }: StarRatingProps) {
  const value = rating ?? 0;
  const editable = Boolean(onSelect);

  return (
    <View className="flex-row items-center gap-1">
      {Array.from({ length: MAX_RATING }, (_, index) => {
        const position = index + 1;
        const filled = position <= Math.round(value);
        const icon = filled ? 'star' : 'star-outline';

        if (!editable) {
          return (
            <MaterialCommunityIcons
              key={position}
              name={icon}
              size={size}
              color={filled ? '#CA8A04' : '#9AA7A0'}
            />
          );
        }

        return (
          <Pressable
            key={position}
            accessibilityRole="radio"
            accessibilityLabel={`${position} ${position === 1 ? 'estrela' : 'estrelas'}`}
            accessibilityState={{ selected: position === Math.round(value) }}
            hitSlop={8}
            onPress={() => onSelect?.(position)}
          >
            <MaterialCommunityIcons
              name={icon}
              size={size}
              color={filled ? '#CA8A04' : '#9AA7A0'}
            />
          </Pressable>
        );
      })}

      {rating !== null && !editable ? (
        <AppText variant="caption" tone="muted" className="ml-1">
          {rating.toFixed(1).replace('.', ',')}
          {reviewCount ? ` (${reviewCount})` : ''}
        </AppText>
      ) : null}
    </View>
  );
}
