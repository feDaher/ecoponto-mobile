import { NotFoundError, ValidationError, type AppError } from '@/core/errors';
import { createId } from '@/core/id';
import { err, ok, type Result } from '@/core/result';
import { CollectionPoint } from '@/domain/entities/collection-point';
import { OpeningHours } from '@/domain/entities/opening-hours';
import type {
  CollectionPointRepository,
  NewCollectionPoint,
  PointFilter,
} from '@/domain/repositories/collection-point.repository';
import { Coordinate } from '@/domain/value-objects/coordinate';
import { Phone } from '@/domain/value-objects/phone';
import { isWasteCategoryId } from '@/domain/value-objects/waste-category';

import { pointListSchema } from '../../dto/api.schemas';
import { collectionPointsFromDto } from '../../mappers/collection-point.mapper';
import { DEMO_POINTS } from '../../seed/demo-data';
import { simulateLatency } from './latency';

/**
 * In-memory points repository.
 *
 * Used when `EXPO_PUBLIC_API_URL` is not set. Implements the same filters the
 * API will (RB07), including the status cut (RB03), so that switching to the
 * HTTP repository does not change the screen's behavior.
 *
 * State lives in the process: reloading the app discards registrations made here.
 */
export class InMemoryCollectionPointRepository implements CollectionPointRepository {
  private points: CollectionPoint[];

  constructor() {
    // The seed goes through schema + mapper, so a data error surfaces here and
    // does not turn into a broken screen further down the line.
    this.points = collectionPointsFromDto(pointListSchema.parse(DEMO_POINTS));
  }

  async list(filter: PointFilter): Promise<Result<CollectionPoint[], AppError>> {
    await simulateLatency();

    const acceptedStatuses = filter.statuses ?? ['approved'];
    const term = filter.searchTerm?.trim().toLowerCase();
    const now = new Date();

    const result = this.points.filter((point) => {
      if (!acceptedStatuses.includes(point.status)) return false;
      if (!point.isLocatedIn(filter)) return false;
      if (!point.acceptsAny(filter.categories ?? [])) return false;
      if (filter.onlyOpen && !point.isOpenAt(now)) return false;

      if (filter.origin && filter.radiusKm !== undefined) {
        if (point.distanceKmFrom(filter.origin) > filter.radiusKm) return false;
      }

      if (term) {
        const target = `${point.name} ${point.address}`.toLowerCase();
        if (!target.includes(term)) return false;
      }

      return true;
    });

    return ok(result);
  }

  async getById(id: string): Promise<Result<CollectionPoint, AppError>> {
    await simulateLatency();

    const point = this.points.find((candidate) => candidate.id === id);
    if (!point) return err(new NotFoundError('Ponto de coleta'));

    return ok(point);
  }

  async register(
    data: NewCollectionPoint,
    collectorId: string,
  ): Promise<Result<CollectionPoint, AppError>> {
    await simulateLatency();

    const coordinate = Coordinate.create(data.latitude, data.longitude);
    if (!coordinate.ok) return coordinate;

    const categories = data.categories.filter(isWasteCategoryId);
    if (categories.length === 0) {
      return err(new ValidationError('Categoria de resíduo inválida.', undefined, 'categories'));
    }

    const openingHours: OpeningHours[] = [];
    for (const [index, raw] of data.openingHours.entries()) {
      const hours = OpeningHours.create({ id: `h-${index}-${createId()}`, ...raw });
      if (!hours.ok) return hours;
      openingHours.push(hours.value);
    }

    let whatsAppContact = null;
    if (data.whatsAppContact) {
      const phone = Phone.create(data.whatsAppContact);
      if (!phone.ok) return phone;
      whatsAppContact = phone.value;
    }

    const point = CollectionPoint.create({
      id: createId('point'),
      collectorId,
      name: data.name,
      address: data.address,
      city: data.city,
      neighborhood: data.neighborhood ?? null,
      coordinate: coordinate.value,
      categories,
      openingHours,
      // RB03 — born pending; only the administrator publishes it.
      status: 'pending',
      updatedAt: new Date(),
      accreditedAt: null,
      description: data.description ?? null,
      whatsAppContact,
      showWhatsApp: data.showWhatsApp ?? false,
      averageRating: null,
      reviewCount: 0,
    });

    if (!point.ok) return point;

    this.points = [...this.points, point.value];
    return ok(point.value);
  }

  async listByCollector(collectorId: string): Promise<Result<CollectionPoint[], AppError>> {
    await simulateLatency();
    return ok(this.points.filter((point) => point.collectorId === collectorId));
  }
}
