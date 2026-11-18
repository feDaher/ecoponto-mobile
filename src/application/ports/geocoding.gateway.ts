import type { AppError } from '@/core/errors';
import type { Result } from '@/core/result';
import type { Coordinate } from '@/domain/value-objects/coordinate';

/**
 * Free-text address or CEP → coordinate (RB07 — search by location).
 *
 * Used when the user submits the search without picking a suggestion; it
 * handles a bare CEP better than the autocomplete. Runs on the device's
 * native geocoder, so it has no API cost.
 */
export interface GeocodingGateway {
  /** `null` when nothing was found — not an error. */
  geocode(address: string): Promise<Result<Coordinate | null, AppError>>;
}
