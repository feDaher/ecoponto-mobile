import type { PlaceResult, PlaceSuggestion, Viewport } from '@/application/ports/places.gateway';
import type { AppError } from '@/core/errors';
import { logger } from '@/core/logger';
import { ok, type Result } from '@/core/result';
import { Coordinate } from '@/domain/value-objects/coordinate';

import type { PlaceDetailsDto, PlaceSuggestionDto } from '../dto/api.schemas';

export function placeSuggestionFromDto(dto: PlaceSuggestionDto): PlaceSuggestion {
  return { placeId: dto.placeId, title: dto.title, subtitle: dto.subtitle };
}

export function placeFromDto(dto: PlaceDetailsDto): Result<PlaceResult, AppError> {
  const coordinate = Coordinate.create(dto.latitude, dto.longitude);
  if (!coordinate.ok) return coordinate;

  return ok({ coordinate: coordinate.value, label: dto.label, viewport: viewportFromDto(dto) });
}

/** An invalid viewport is dropped, not fatal: the map still centers on the coordinate. */
function viewportFromDto(dto: PlaceDetailsDto): Viewport | null {
  if (!dto.viewport) return null;

  const southWest = Coordinate.create(
    dto.viewport.southWest.latitude,
    dto.viewport.southWest.longitude,
  );
  const northEast = Coordinate.create(
    dto.viewport.northEast.latitude,
    dto.viewport.northEast.longitude,
  );

  if (!southWest.ok || !northEast.ok) {
    logger.warn('Viewport inválido descartado', { label: dto.label });
    return null;
  }

  return { southWest: southWest.value, northEast: northEast.value };
}
