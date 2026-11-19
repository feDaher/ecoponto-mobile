import type { AppError } from '@/core/errors';
import { mapResult, type Result } from '@/core/result';
import { normalizeText } from '@/core/text';
import type { CollectionPoint } from '@/domain/entities/collection-point';
import type {
  CollectionPointRepository,
  NewCollectionPoint,
  PointFilter,
} from '@/domain/repositories/collection-point.repository';

import { toApiWasteType, toApiWeekday } from '../../dto/api-enums';
import { apiCollectionPointDtoSchema, apiPointListSchema } from '../../dto/api.schemas';
import type { HttpClient } from '../../http/http-client';
import {
  collectionPointFromDto,
  collectionPointsFromDto,
} from '../../mappers/collection-point.mapper';

/** The API caps a page at 500; 200 covers a city and keeps the response fast (RN07). */
const SEARCH_PAGE_SIZE = 200;

/**
 * HTTP implementation of the points repository (REST API — section 4.3.1).
 *
 * Endpoints (ecoponto-api):
 *   GET  /collection-points        → approved points, combined filters (BE-07)
 *   GET  /collection-points/:id    → details
 *   POST /collection-points        → accreditation (COLLECTOR; born PENDING)
 *   GET  /collection-points/mine   → the collector's own points (COLLECTOR)
 */
export class HttpCollectionPointRepository implements CollectionPointRepository {
  constructor(private readonly http: HttpClient) {}

  async list(filter: PointFilter): Promise<Result<CollectionPoint[], AppError>> {
    const response = await this.http.request({
      path: '/collection-points',
      schema: apiPointListSchema,
      query: {
        city: filter.city,
        wasteType: filter.categories?.length
          ? filter.categories.map(toApiWasteType).join(',')
          : undefined,
        latitude: filter.origin?.latitude,
        longitude: filter.origin?.longitude,
        radius: filter.origin ? filter.radiusKm : undefined,
        limit: SEARCH_PAGE_SIZE,
      },
    });

    return mapResult(response, (dtos) =>
      matchingSearchTerm(collectionPointsFromDto(dtos), filter.searchTerm),
    );
  }

  async getById(id: string): Promise<Result<CollectionPoint, AppError>> {
    const response = await this.http.request({
      path: `/collection-points/${encodeURIComponent(id)}`,
      schema: apiCollectionPointDtoSchema,
    });

    if (!response.ok) return response;
    return collectionPointFromDto(response.value);
  }

  async register(
    data: NewCollectionPoint,
    _collectorId: string,
  ): Promise<Result<CollectionPoint, AppError>> {
    // The collector comes from the JWT on the server; sending the id in the body
    // would mean trusting the client to decide who authored the registration.
    const response = await this.http.request({
      path: '/collection-points',
      method: 'POST',
      authenticated: true,
      schema: apiCollectionPointDtoSchema,
      // The API has no neighborhood field; the point is born PENDING (RB03).
      body: {
        name: data.name,
        address: data.address,
        city: data.city,
        latitude: data.latitude,
        longitude: data.longitude,
        wasteCategories: data.categories.map(toApiWasteType),
        operatingHours: data.openingHours.map((hours) => ({
          weekday: toApiWeekday(hours.weekday),
          openTime: hours.opensAt,
          closeTime: hours.closesAt,
        })),
        description: data.description,
        whatsappContact: data.whatsAppContact,
        showWhatsappContact: data.showWhatsApp ?? false,
      },
    });

    if (!response.ok) return response;
    return collectionPointFromDto(response.value);
  }

  async listByCollector(_collectorId: string): Promise<Result<CollectionPoint[], AppError>> {
    // The collector is the token's user: the API answers with their own points, any status.
    const response = await this.http.request({
      path: '/collection-points/mine',
      authenticated: true,
      schema: apiPointListSchema,
    });

    return mapResult(response, collectionPointsFromDto);
  }
}

function matchingSearchTerm(points: CollectionPoint[], searchTerm: string | undefined) {
  const term = normalizeText(searchTerm ?? '');
  if (!term) return points;

  return points.filter((point) => normalizeText(`${point.name} ${point.address}`).includes(term));
}
