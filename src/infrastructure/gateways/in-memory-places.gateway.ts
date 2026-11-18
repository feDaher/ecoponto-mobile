import type {
  PlaceResult,
  PlaceSuggestion,
  PlacesGateway,
} from '@/application/ports/places.gateway';
import { NotFoundError, type AppError } from '@/core/errors';
import { err, ok, type Result } from '@/core/result';
import { normalizeText } from '@/core/text';

import { placeDetailsDtoSchema, placeSuggestionDtoSchema } from '../dto/api.schemas';
import { placeFromDto, placeSuggestionFromDto } from '../mappers/place.mapper';
import { simulateLatency } from '../repositories/in-memory/latency';
import { DEMO_PLACES } from '../seed/demo-places';

const MAX_SUGGESTIONS = 5;

/**
 * Address search for demo mode (no `EXPO_PUBLIC_API_URL`).
 *
 * Searches a fixed list of Manhuaçu addresses, ignoring accents and case. The
 * seed goes through the same schemas and mapper as the API response, so the
 * screen receives exactly what the HTTP gateway would give it.
 */
export class InMemoryPlacesGateway implements PlacesGateway {
  async suggest(input: string): Promise<Result<PlaceSuggestion[], AppError>> {
    await simulateLatency();

    const wanted = normalizeText(input);
    const matches = DEMO_PLACES.filter((place) =>
      normalizeText(`${place.title} ${place.subtitle ?? ''}`).includes(wanted),
    )
      .slice(0, MAX_SUGGESTIONS)
      .map((place) => placeSuggestionFromDto(placeSuggestionDtoSchema.parse(place)));

    return ok(matches);
  }

  async details(placeId: string): Promise<Result<PlaceResult, AppError>> {
    await simulateLatency();

    const place = DEMO_PLACES.find((candidate) => candidate.placeId === placeId);
    if (!place) return err(new NotFoundError('Endereço'));

    return placeFromDto(placeDetailsDtoSchema.parse(place.details));
  }
}
