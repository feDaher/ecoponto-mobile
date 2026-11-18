import type { AppError } from '@/core/errors';
import { mapResult, type Result } from '@/core/result';
import { normalizeText } from '@/core/text';
import type { CollectionPoint } from '@/domain/entities/collection-point';
import type {
  CollectionPointRepository,
  NewCollectionPoint,
  PointFilter,
} from '@/domain/repositories/collection-point.repository';

import { toApiWasteType } from '../../dto/api-enums';
import {
  apiCollectionPointDtoSchema,
  apiPointListSchema,
  collectionPointDtoSchema,
  pointListSchema,
} from '../../dto/api.schemas';
import type { HttpClient } from '../../http/http-client';
import {
  collectionPointFromDto,
  collectionPointsFromDto,
} from '../../mappers/collection-point.mapper';

/**
 * HTTP implementation of the points repository (REST API — section 4.3.1).
 *
 * Expected endpoints:
 *   GET  /collection-points                    → filtered list
 *   GET  /collection-points/:id                → details
 *   POST /collection-points                    → accreditation (authenticated, collector)
 *   GET  /collectors/:id/collection-points     → the collector's points (authenticated)
 */
const SEARCH_PAGE_SIZE = 200;

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
      schema: collectionPointDtoSchema,
      body: {
        name: data.name,
        address: data.address,
        city: data.city,
        neighborhood: data.neighborhood,
        latitude: data.latitude,
        longitude: data.longitude,
        categories: data.categories,
        openingHours: data.openingHours.map((hours) => ({
          weekday: hours.weekday,
          opensAt: hours.opensAt,
          closesAt: hours.closesAt,
        })),
        description: data.description,
        whatsAppContact: data.whatsAppContact,
        showWhatsApp: data.showWhatsApp ?? false,
      },
    });

    if (!response.ok) return response;
    return collectionPointFromDto(response.value);
  }

  async listByCollector(collectorId: string): Promise<Result<CollectionPoint[], AppError>> {
    const response = await this.http.request({
      path: `/collectors/${encodeURIComponent(collectorId)}/collection-points`,
      authenticated: true,
      schema: pointListSchema,
    });

    return mapResult(response, collectionPointsFromDto);
  }
}

function matchingSearchTerm(points: CollectionPoint[], searchTerm: string | undefined) {
  const term = normalizeText(searchTerm ?? '');
  if (!term) return points;

  return points.filter((point) => normalizeText(`${point.name} ${point.address}`).includes(term));
}
