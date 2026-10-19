import type {
  PlaceResult,
  PlaceSuggestion,
  PlacesGateway,
} from '@/application/ports/places.gateway';
import type { AppError } from '@/core/errors';
import { mapResult, type Result } from '@/core/result';
import type { Coordinate } from '@/domain/value-objects/coordinate';

import { placeDetailsDtoSchema, placeSuggestionListSchema } from '../dto/api.schemas';
import type { HttpClient } from '../http/http-client';
import { placeFromDto, placeSuggestionFromDto } from '../mappers/place.mapper';

/** Typing should feel instant; a slow suggestion is worse than none. */
const SUGGEST_TIMEOUT_MS = 4000;

/**
 * Address search through the ecoponto-api, which proxies Google Places API (New).
 *
 * Expected endpoints (public, like the map — RB01; the backend rate-limits them):
 *   GET /places/autocomplete?input=&sessionToken=&latitude=&longitude=  → PlaceSuggestion[]
 *   GET /places/:placeId?sessionToken=                                   → place details
 *
 * The Google key, the `X-Goog-FieldMask` (location,viewport,formattedAddress),
 * region `br` and language `pt-BR` are the backend's responsibility.
 */
export class HttpPlacesGateway implements PlacesGateway {
  constructor(private readonly http: HttpClient) {}

  async suggest(
    input: string,
    sessionToken: string,
    near?: Coordinate,
  ): Promise<Result<PlaceSuggestion[], AppError>> {
    const response = await this.http.request({
      path: '/places/autocomplete',
      schema: placeSuggestionListSchema,
      timeoutMs: SUGGEST_TIMEOUT_MS,
      query: {
        input,
        sessionToken,
        latitude: near?.latitude,
        longitude: near?.longitude,
      },
    });

    return mapResult(response, (items) => items.map(placeSuggestionFromDto));
  }

  async details(placeId: string, sessionToken: string): Promise<Result<PlaceResult, AppError>> {
    const response = await this.http.request({
      path: `/places/${encodeURIComponent(placeId)}`,
      schema: placeDetailsDtoSchema,
      query: { sessionToken },
    });

    if (!response.ok) return response;
    return placeFromDto(response.value);
  }
}
