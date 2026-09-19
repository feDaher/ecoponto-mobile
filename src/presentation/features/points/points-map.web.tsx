import { View } from 'react-native';

import { EmptyState } from '../../components/ui/states';
import type { PointsMapProps } from './points-map';

/**
 * Map replacement on the web.
 *
 * `react-native-maps` has no web implementation without a Google Maps
 * JavaScript API key. Instead of breaking the web bundle, the platform falls
 * back to the points list — which delivers the same information (RB07) another way.
 *
 * Metro picks this file automatically through the `.web.tsx` extension.
 */
export function PointsMap(_props: PointsMapProps) {
  return (
    <View className="flex-1 items-center justify-center bg-surface-light-muted dark:bg-surface-dark">
      <EmptyState
        icon="map-outline"
        title="Mapa disponível no aplicativo"
        description="Na versão web, use a lista abaixo para consultar os pontos de coleta."
      />
    </View>
  );
}
