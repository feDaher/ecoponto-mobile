import type { AppError } from '@/core/errors';
import type { Result } from '@/core/result';

import type { ApprovalStatus, CollectionPoint } from '../entities/collection-point';
import type { Coordinate } from '../value-objects/coordinate';
import type { WasteCategoryId } from '../value-objects/waste-category';

/**
 * RB07 — Filter and search by proximity, waste type and city.
 * Filters can be combined; missing fields mean "do not filter".
 */
export type PointFilter = {
  readonly categories?: readonly WasteCategoryId[];
  readonly city?: string;
  readonly neighborhood?: string;
  readonly origin?: Coordinate;
  readonly radiusKm?: number;
  /** Text search by place name or address. */
  readonly searchTerm?: string;
  /** Only points open at query time. */
  readonly onlyOpen?: boolean;
  /**
   * RB03 — the public app only reads approved points. Internal roles
   * (collector viewing their own points, admin moderating) pass other statuses.
   */
  readonly statuses?: readonly ApprovalStatus[];
};

export type NewCollectionPoint = {
  readonly name: string;
  readonly address: string;
  readonly city: string;
  readonly neighborhood?: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly categories: readonly WasteCategoryId[];
  readonly openingHours: readonly { weekday: number; opensAt: string; closesAt: string }[];
  readonly description?: string;
  readonly whatsAppContact?: string;
  readonly showWhatsApp?: boolean;
};

/**
 * Access port for collection points.
 *
 * The domain declares the contract; the infrastructure decides whether it is
 * fulfilled over HTTP (the specification's REST API) or by the in-memory
 * repository used on Expo Go without a backend. No layer above knows the difference.
 */
export interface CollectionPointRepository {
  list(filter: PointFilter): Promise<Result<CollectionPoint[], AppError>>;

  getById(id: string): Promise<Result<CollectionPoint, AppError>>;

  /** RB03 — the point is born `pending` and only the administrator approves it. */
  register(
    data: NewCollectionPoint,
    collectorId: string,
  ): Promise<Result<CollectionPoint, AppError>>;

  listByCollector(collectorId: string): Promise<Result<CollectionPoint[], AppError>>;
}
