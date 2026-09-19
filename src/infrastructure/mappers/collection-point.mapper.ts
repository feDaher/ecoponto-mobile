import { ContractMismatchError, type AppError } from '@/core/errors';
import { logger } from '@/core/logger';
import { err, ok, type Result } from '@/core/result';
import { CollectionPoint } from '@/domain/entities/collection-point';
import { OpeningHours } from '@/domain/entities/opening-hours';
import { Coordinate } from '@/domain/value-objects/coordinate';
import { Phone } from '@/domain/value-objects/phone';
import { isWasteCategoryId, type WasteCategoryId } from '@/domain/value-objects/waste-category';

import type { CollectionPointDto } from '../dto/api.schemas';

/**
 * API DTO → domain entity.
 *
 * Tolerance policy:
 *  - an unknown category is **dropped with a log** (the app catalog may be
 *    behind the server; better to show the point with the categories we
 *    understand than to hide the point from the citizen);
 *  - a malformed opening hour is dropped the same way;
 *  - an invalid coordinate **invalidates the point** — RB04 allows no exception.
 */
export function collectionPointFromDto(dto: CollectionPointDto): Result<CollectionPoint, AppError> {
  const coordinate = Coordinate.create(dto.latitude, dto.longitude);
  if (!coordinate.ok) {
    logger.warn('Ponto descartado por coordenada inválida (RB04)', { id: dto.id });
    return err(new ContractMismatchError(coordinate.error));
  }

  const categories: WasteCategoryId[] = [];
  for (const raw of dto.categories) {
    if (isWasteCategoryId(raw)) categories.push(raw);
    else logger.warn('Categoria desconhecida ignorada', { category: raw, id: dto.id });
  }

  const openingHours: OpeningHours[] = [];
  for (const raw of dto.openingHours) {
    const hours = OpeningHours.create({
      id: raw.id,
      weekday: raw.weekday,
      opensAt: normalizeTime(raw.opensAt),
      closesAt: normalizeTime(raw.closesAt),
    });

    if (hours.ok) openingHours.push(hours.value);
    else logger.warn('Horário inválido ignorado', { id: raw.id });
  }

  let whatsAppContact = null;
  if (dto.whatsAppContact) {
    const phone = Phone.create(dto.whatsAppContact);
    if (phone.ok) whatsAppContact = phone.value;
    else logger.warn('Telefone de WhatsApp inválido ignorado', { id: dto.id });
  }

  const point = CollectionPoint.create({
    id: dto.id,
    collectorId: dto.collectorId,
    name: dto.name,
    address: dto.address,
    city: dto.city,
    coordinate: coordinate.value,
    categories,
    openingHours,
    status: dto.approvalStatus,
    updatedAt: dto.updatedAt,
    accreditedAt: dto.accreditedAt ?? null,
    description: dto.description ?? null,
    whatsAppContact,
    showWhatsApp: dto.showWhatsApp ?? false,
    averageRating: dto.averageRating ?? null,
    reviewCount: dto.reviewCount ?? 0,
  });

  if (!point.ok) return err(new ContractMismatchError(point.error));
  return ok(point.value);
}

/**
 * Converts a list, skipping items that do not form a valid entity.
 * A single corrupted record in the database must not bring down the whole map.
 */
export function collectionPointsFromDto(dtos: readonly CollectionPointDto[]): CollectionPoint[] {
  const points: CollectionPoint[] = [];

  for (const dto of dtos) {
    const result = collectionPointFromDto(dto);
    if (result.ok) points.push(result.value);
    else logger.warn('Ponto inválido descartado da listagem', { id: dto.id });
  }

  return points;
}

/** MySQL `TIME` arrives as `HH:mm:ss`; the domain works with `HH:mm`. */
function normalizeTime(time: string): string {
  return time.trim().slice(0, 5);
}
