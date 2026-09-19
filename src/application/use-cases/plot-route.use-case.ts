import type { AppError } from '@/core/errors';
import { type Result } from '@/core/result';
import type { CollectionPoint } from '@/domain/entities/collection-point';
import type { Coordinate } from '@/domain/value-objects/coordinate';

import type { ExternalNavigationGateway } from '../ports/external-navigation.gateway';
import type { LocationGateway } from '../ports/location.gateway';
import type { UseCase } from './use-case';

export type PlotRouteInput = {
  readonly point: CollectionPoint;
  /** Origin already known by the screen; if missing, we try the GPS. */
  readonly origin?: Coordinate | null;
};

/**
 * RB11 — Google Maps integration for external navigation.
 * "Open the route directly in Google Maps, using your current location
 * as the starting point."
 *
 * If the location is unavailable, the route is opened anyway: the maps app
 * itself resolves the origin. Losing the route for lack of GPS would be a
 * usability regression.
 */
export class PlotRouteUseCase implements UseCase<PlotRouteInput, void> {
  constructor(
    private readonly navigation: ExternalNavigationGateway,
    private readonly location: LocationGateway,
  ) {}

  async execute(input: PlotRouteInput): Promise<Result<void, AppError>> {
    const origin = input.origin ?? (await this.tryGetOrigin());

    return this.navigation.openRoute({
      destination: input.point.coordinate,
      origin,
      destinationLabel: input.point.name,
    });
  }

  private async tryGetOrigin(): Promise<Coordinate | null> {
    const permission = await this.location.checkPermission();
    if (permission !== 'granted') return null;

    const position = await this.location.getCurrentPosition();
    return position.ok ? position.value : null;
  }
}
