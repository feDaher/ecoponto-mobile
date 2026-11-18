import type { PointMapPreviewProps } from './point-map-preview';

/**
 * No map preview on the web.
 *
 * Same reason as `points-map.web.tsx`: `react-native-maps` has no web
 * implementation. The address and the "Como chegar" button already carry the
 * location, so the page simply renders without the preview.
 *
 * Metro picks this file automatically through the `.web.tsx` extension.
 */
export function PointMapPreview(_props: PointMapPreviewProps) {
  return null;
}
