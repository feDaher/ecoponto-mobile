import type { AppError } from '@/core/errors';
import type { Result } from '@/core/result';
import type { Coordinate } from '@/domain/value-objects/coordinate';

export type RouteRequest = {
  readonly destination: Coordinate;
  /** Missing = the maps app uses the device's current location (RB11). */
  readonly origin?: Coordinate | null;
  readonly destinationLabel?: string;
};

export type WhatsAppRequest = {
  /** E.164 without `+`, e.g.: `5533988887777`. */
  readonly phone: string;
  readonly message?: string;
};

/**
 * Exits from the app to external applications.
 *
 * RB11 — open the route in Google Maps using the current location as origin.
 * RB08 — direct WhatsApp contact button on the point's page.
 */
export interface ExternalNavigationGateway {
  openRoute(request: RouteRequest): Promise<Result<void, AppError>>;

  openWhatsApp(request: WhatsAppRequest): Promise<Result<void, AppError>>;

  openUrl(url: string): Promise<Result<void, AppError>>;
}
