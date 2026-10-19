import type { AppError } from '@/core/errors';
import type { Result } from '@/core/result';

import type { PlaceResult, PlacesGateway } from '../ports/places.gateway';
import type { UseCase } from './use-case';

export type ResolvePlaceInput = {
  readonly placeId: string;
  /** Same token used in the suggestions; discard it after this call. */
  readonly sessionToken: string;
};

/** RB07 — turns the chosen address suggestion into a map location. */
export class ResolvePlaceUseCase implements UseCase<ResolvePlaceInput, PlaceResult> {
  constructor(private readonly places: PlacesGateway) {}

  execute(input: ResolvePlaceInput): Promise<Result<PlaceResult, AppError>> {
    return this.places.details(input.placeId, input.sessionToken);
  }
}
