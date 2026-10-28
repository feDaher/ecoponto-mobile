import { useCallback, useEffect, useMemo, useRef } from 'react';
import MapView, { Marker, type Region } from 'react-native-maps';

import type { NearbyPoint } from '@/application/use-cases/list-nearby-points.use-case';
import { logger } from '@/core/logger';
import type { Coordinate } from '@/domain/value-objects/coordinate';
import { getCategory } from '@/domain/value-objects/waste-category';

import { DEFAULT_REGION } from '../../theme/tokens';
import { IS_ANDROID_MAPS_KEY_MISSING, MAP_PROVIDER } from './map-provider';

if (IS_ANDROID_MAPS_KEY_MISSING) {
  logger.warn(
    'GOOGLE_MAPS_ANDROID_API_KEY não definida: o mapa fica em branco nesta build. ' +
      'Preencha o .env.local e refaça o build nativo.',
  );
}

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
 *    configuration; in a custom build the Android key comes from
 *    `GOOGLE_MAPS_ANDROID_API_KEY`, applied by the `react-native-maps` plugin
 *    in `app.config.ts`;
 *  - the engine comes from `MAP_PROVIDER` (`./map-provider`): Google on
 *    Android; on iOS Apple Maps (no key) unless the build has
 *    `GOOGLE_MAPS_IOS_API_KEY`;
 *  - the pin color follows the point's **first category**, which gives an
 *    immediate read of "what this place accepts" without opening its page.
 */
export function PointsMap({ points, origin, onSelect }: PointsMapProps) {
  const mapRef = useRef<MapView>(null);
  const fittedKey = useRef<string | null>(null);

  const fitToResult = useCallback(() => {
    const key = points.map(({ point }) => point.id).join(',');
    if (points.length === 0 || key === fittedKey.current || !mapRef.current) return;
    fittedKey.current = key;

    const coordinates = points.map(({ point }) => ({
      latitude: point.coordinate.latitude,
      longitude: point.coordinate.longitude,
    }));

    if (coordinates.length === 1) {
      mapRef.current.animateToRegion(
        { ...coordinates[0], latitudeDelta: 0.012, longitudeDelta: 0.012 },
        350,
      );
      return;
    }

    mapRef.current.fitToCoordinates(coordinates, {
      edgePadding: { top: 96, right: 48, bottom: 48, left: 48 },
      animated: true,
    });
  }, [points]);

  useEffect(fitToResult, [fitToResult]);

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
      provider={MAP_PROVIDER}
      style={{ flex: 1 }}
      initialRegion={initialRegion}
      onMapReady={fitToResult}
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
