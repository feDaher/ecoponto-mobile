import type { AppError } from '@/core/errors';
import type { Result } from '@/core/result';
import type { Coordinate } from '@/domain/value-objects/coordinate';

export type PlaceSuggestion = {
  readonly placeId: string;
  readonly title: string;
  readonly subtitle: string;
};

export type Viewport = {
  readonly southWest: Coordinate;
  readonly northEast: Coordinate;
};

export type PlaceResult = {
  readonly coordinate: Coordinate;
  readonly label: string;
  /** Area to frame on the map (a neighborhood or a city has one; an address may not). */
  readonly viewport: Viewport | null;
};

/**
 * Address suggestions while the user types (RB07 — search by location).
 *
 * The implementation goes through the ecoponto-api, which holds the Google key
 * on the server; the app never calls Google directly. The screens do not know that.
 *
 * Billing: `suggest` and `details` must share the same `sessionToken` — Google
 * then charges the typing as one session that ends in `details`. After
 * `details`, the caller discards the token and starts a new one.
 */
export interface PlacesGateway {
  suggest(
    input: string,
    sessionToken: string,
    near?: Coordinate,
  ): Promise<Result<PlaceSuggestion[], AppError>>;

  details(placeId: string, sessionToken: string): Promise<Result<PlaceResult, AppError>>;
}
