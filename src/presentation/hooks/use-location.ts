import { useCallback, useEffect, useState } from 'react';

import type { LocationPermissionStatus } from '@/application/ports/location.gateway';
import { logger } from '@/core/logger';
import { Coordinate } from '@/domain/value-objects/coordinate';

import { useContainer } from '../providers/container-provider';

export type LocationState = {
  readonly coordinate: Coordinate | null;
  readonly permission: LocationPermissionStatus;
  readonly loading: boolean;
  readonly request: () => Promise<void>;
};

/**
 * User location to sort points by proximity (RB07).
 *
 * Principle: **never block**. RB01 guarantees public map lookup, so a denied
 * permission does not prevent use — the distance just disappears and the map
 * opens centered on the default city.
 */
export function useLocation(): LocationState {
  const { gateways } = useContainer();
  const [coordinate, setCoordinate] = useState<Coordinate | null>(null);
  const [permission, setPermission] = useState<LocationPermissionStatus>('undetermined');
  const [loading, setLoading] = useState(true);

  const loadPosition = useCallback(async () => {
    const position = await gateways.location.getCurrentPosition();

    if (position.ok) setCoordinate(position.value);
    else logger.info('Sem localização disponível', { code: position.error.code });
  }, [gateways.location]);

  // On mount we only check; we don't ask for permission before the user shows
  // interest — a request in the first second is usually denied.
  useEffect(() => {
    let active = true;

    (async () => {
      const status = await gateways.location.checkPermission();
      if (!active) return;

      setPermission(status);
      if (status === 'granted') await loadPosition();
      if (active) setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [gateways.location, loadPosition]);

  const request = useCallback(async () => {
    setLoading(true);

    const status = await gateways.location.requestPermission();
    setPermission(status);

    if (status === 'granted') await loadPosition();
    setLoading(false);
  }, [gateways.location, loadPosition]);

  return { coordinate, permission, loading, request };
}
