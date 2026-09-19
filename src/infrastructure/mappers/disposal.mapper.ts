import { ContractMismatchError, type AppError } from '@/core/errors';
import { logger } from '@/core/logger';
import { err, ok, type Result } from '@/core/result';
import { DisposalRecord } from '@/domain/entities/disposal-record';
import { isWasteCategoryId } from '@/domain/value-objects/waste-category';

import type { DisposalRecordDto } from '../dto/api.schemas';

export function disposalRecordFromDto(dto: DisposalRecordDto): Result<DisposalRecord, AppError> {
  if (!isWasteCategoryId(dto.categoryId)) {
    return err(new ContractMismatchError(`Categoria desconhecida: ${dto.categoryId}`));
  }

  const record = DisposalRecord.create({
    id: dto.id,
    citizenId: dto.citizenId,
    collectionPointId: dto.collectionPointId,
    category: dto.categoryId,
    weightKg: dto.weightKg,
    pointsEarned: dto.pointsEarned,
    disposedAt: dto.disposedAt,
    collectionPointName: dto.collectionPointName ?? null,
  });

  if (!record.ok) return err(new ContractMismatchError(record.error));
  return ok(record.value);
}

export function disposalRecordsFromDto(dtos: readonly DisposalRecordDto[]): DisposalRecord[] {
  const records: DisposalRecord[] = [];

  for (const dto of dtos) {
    const result = disposalRecordFromDto(dto);
    if (result.ok) records.push(result.value);
    else logger.warn('Registro de descarte inválido descartado', { id: dto.id });
  }

  return records;
}
