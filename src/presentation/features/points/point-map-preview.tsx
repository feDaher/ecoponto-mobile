import { View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import type { CollectionPoint } from '@/domain/entities/collection-point';
import { getCategory } from '@/domain/value-objects/waste-category';

import { MAP_PROVIDER } from './map-provider';

export type PointMapPreviewProps = {
  point: CollectionPoint;
};

/**
 * Static map of a single point on its page (RB04).
 *
 * Non-interactive on purpose: the gestures belong to the full map on the home
 * screen, and a scrollable map inside a `ScrollView` fights the page scroll.
 * Getting there is the job of the "Como chegar" button (RB11).
 */
export function PointMapPreview({ point }: PointMapPreviewProps) {
  const color = getCategory(point.categories[0]).color;

  return (
    <View className="h-40 overflow-hidden rounded-card">
      <MapView
        style={{ flex: 1 }}
        provider={MAP_PROVIDER}
        pointerEvents="none"
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        initialRegion={{
          latitude: point.coordinate.latitude,
          longitude: point.coordinate.longitude,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        }}
      >
        <Marker
          coordinate={{
            latitude: point.coordinate.latitude,
            longitude: point.coordinate.longitude,
          }}
          title={point.name}
          pinColor={color}
        />
      </MapView>
    </View>
  );
}
