import type { AppError } from '@/core/errors';
import type { Result } from '@/core/result';
import type { Coordinate } from '@/domain/value-objects/coordinate';

export type LocationPermissionStatus = 'granted' | 'denied' | 'undetermined';

/**
 * Access to the device location (RB07 — proximity search).
 *
 * A denied permission is **not** a fatal error: the map stays public
 * (RB01), just centered on the default city instead of the user's position.
 */
export interface LocationGateway {
  checkPermission(): Promise<LocationPermissionStatus>;

  requestPermission(): Promise<LocationPermissionStatus>;

  getCurrentPosition(): Promise<Result<Coordinate, AppError>>;
}
