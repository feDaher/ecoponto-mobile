import { useMemo, useRef } from 'react';
import MapView, { Marker, PROVIDER_DEFAULT, type Region } from 'react-native-maps';

import type { NearbyPoint } from '@/application/use-cases/list-nearby-points.use-case';
import type { Coordinate } from '@/domain/value-objects/coordinate';
import { getCategory } from '@/domain/value-objects/waste-category';

import { DEFAULT_REGION } from '../../theme/tokens';

export type PointsMapProps = {
  points: readonly NearbyPoint[];
  origin: Coordinate | null;
  onSelect: (pointId: string) => void;
};

/**
 * Georeferenced map of the approved points (RB04, RB07).
 *
 * Environment notes:
 *  - on **Expo Go** the map uses Expo's own key and works without
 *    configuration; in a custom build the Google Maps key must be provided
 *    in `app.json` (`android.config.googleMaps.apiKey` and `ios.config.
 *    googleMapsApiKey`);
 *  - we use `PROVIDER_DEFAULT` (Apple Maps on iOS, Google on Android) so as not
 *    to require a key on iOS;
 *  - the pin color follows the point's **first category**, which gives an
 *    immediate read of "what this place accepts" without opening its page.
 */
export function PointsMap({ points, origin, onSelect }: PointsMapProps) {
  const mapRef = useRef<MapView>(null);

  const initialRegion = useMemo<Region>(
    () =>
      origin
        ? {
            latitude: origin.latitude,
            longitude: origin.longitude,
            latitudeDelta: 0.04,
            longitudeDelta: 0.04,
          }
        : DEFAULT_REGION,
    [origin],
  );

  return (
    <MapView
      ref={mapRef}
      provider={PROVIDER_DEFAULT}
      style={{ flex: 1 }}
      initialRegion={initialRegion}
      showsUserLocation={origin !== null}
      showsMyLocationButton
      toolbarEnabled={false}
      accessibilityLabel="Mapa com os pontos de coleta credenciados"
    >
      {points.map(({ point, isOpenNow }) => {
        const category = getCategory(point.categories[0]);

        return (
          <Marker
            key={point.id}
            identifier={point.id}
            coordinate={{
              latitude: point.coordinate.latitude,
              longitude: point.coordinate.longitude,
            }}
            title={point.name}
            description={`${isOpenNow ? 'Aberto agora' : 'Fechado agora'} · ${category.name}`}
            pinColor={category.color}
            onCalloutPress={() => onSelect(point.id)}
          />
        );
      })}
    </MapView>
  );
}
