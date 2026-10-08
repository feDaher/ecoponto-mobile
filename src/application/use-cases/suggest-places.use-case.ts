import type { AppError } from '@/core/errors';
import { logger } from '@/core/logger';
import { ok, type Result } from '@/core/result';
import type { CollectionPoint } from '@/domain/entities/collection-point';
import type { CollectionPointRepository } from '@/domain/repositories/collection-point.repository';
import type { Coordinate } from '@/domain/value-objects/coordinate';

import type { PlaceSuggestion, PlacesGateway } from '../ports/places.gateway';
import type { UseCase } from './use-case';

/** Below this, suggestions are too broad and every keystroke would cost a request. */
export const MIN_SEARCH_LENGTH = 3;

const MAX_POINT_SUGGESTIONS = 3;

export type SearchSuggestion =
  | { readonly kind: 'point'; readonly point: CollectionPoint }
  | { readonly kind: 'place'; readonly place: PlaceSuggestion };

export type SuggestPlacesInput = {
  readonly term: string;
  /** One per search session; see `PlacesGateway`. */
  readonly sessionToken: string;
  /** Biases addresses toward the user or the visible map area. */
  readonly near?: Coordinate;
};

/**
 * RB07 — search by place name or address while typing.
 *
 * Registered points come first (matched by name/address), then Google
 * addresses: someone typing "Cooperativa" wants the point, not a street.
 * RB03 — only approved points are suggested.
 *
 * Partial failure is tolerated: if the address search fails but points were
 * found, the user still gets those; the error only surfaces when nothing is left.
 */
export class SuggestPlacesUseCase implements UseCase<SuggestPlacesInput, SearchSuggestion[]> {
  constructor(
    private readonly points: CollectionPointRepository,
    private readonly places: PlacesGateway,
  ) {}

  async execute(input: SuggestPlacesInput): Promise<Result<SearchSuggestion[], AppError>> {
    const term = input.term.trim();
    if (term.length < MIN_SEARCH_LENGTH) return ok([]);

    const [pointsResult, placesResult] = await Promise.all([
      this.points.list({ searchTerm: term, statuses: ['approved'] }),
      this.places.suggest(term, input.sessionToken, input.near),
    ]);

    const points: SearchSuggestion[] = pointsResult.ok
      ? pointsResult.value
          .filter((point) => point.isVisibleOnMap)
          .slice(0, MAX_POINT_SUGGESTIONS)
          .map((point) => ({ kind: 'point', point }))
      : [];

    if (!pointsResult.ok) {
      logger.warn('Sugestões sem pontos cadastrados', { code: pointsResult.error.code });
    }

    if (!placesResult.ok) {
      if (points.length === 0) return placesResult;
      logger.warn('Sugestões sem endereços', { code: placesResult.error.code });
      return ok(points);
    }

    return ok([
      ...points,
      ...placesResult.value.map((place) => ({ kind: 'place' as const, place })),
    ]);
  }
}
