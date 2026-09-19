import { ValidationError } from '@/core/errors';
import { err, ok, type Result } from '@/core/result';

import type { WasteCategoryId } from '../value-objects/waste-category';

/** Maximum weight accepted in a single record — above this it's a typo. */
export const MAX_WEIGHT_KG = 500;
export const MIN_WEIGHT_KG = 0.1;

export type DisposalRecordProps = {
  id: string;
  citizenId: string;
  collectionPointId: string;
  category: WasteCategoryId;
  weightKg: number;
  pointsEarned: number;
  disposedAt: Date;
  collectionPointName?: string | null;
};

/**
 * Disposal made by a citizen — `REGISTRO_DESCARTE` table in the ERD.
 *
 * RB01 — only exists linked to a registered citizen.
 * RB09 — it is the source of gamification points (calculated in
 * `domain/services/gamification.ts`, not here: the entity only stores the
 * already computed result, so the history does not change if the rule changes).
 */
export class DisposalRecord {
  readonly id: string;
  readonly citizenId: string;
  readonly collectionPointId: string;
  readonly category: WasteCategoryId;
  readonly weightKg: number;
  readonly pointsEarned: number;
  readonly disposedAt: Date;
  readonly collectionPointName: string | null;

  private constructor(props: Required<DisposalRecordProps>) {
    this.id = props.id;
    this.citizenId = props.citizenId;
    this.collectionPointId = props.collectionPointId;
    this.category = props.category;
    this.weightKg = props.weightKg;
    this.pointsEarned = props.pointsEarned;
    this.disposedAt = props.disposedAt;
    this.collectionPointName = props.collectionPointName;
    Object.freeze(this);
  }

  static create(props: DisposalRecordProps): Result<DisposalRecord, ValidationError> {
    const { weightKg, pointsEarned } = props;

    if (!Number.isFinite(weightKg) || weightKg < MIN_WEIGHT_KG) {
      return err(
        new ValidationError(
          `Informe um peso a partir de ${MIN_WEIGHT_KG} kg.`,
          undefined,
          'weightKg',
        ),
      );
    }

    if (weightKg > MAX_WEIGHT_KG) {
      return err(
        new ValidationError(
          `Peso acima do limite de ${MAX_WEIGHT_KG} kg por registro.`,
          undefined,
          'weightKg',
        ),
      );
    }

    if (!Number.isInteger(pointsEarned) || pointsEarned < 0) {
      return err(new ValidationError('Pontuação inválida.', undefined, 'pointsEarned'));
    }

    return ok(
      new DisposalRecord({
        ...props,
        weightKg: Math.round(weightKg * 100) / 100,
        collectionPointName: props.collectionPointName ?? null,
      }),
    );
  }
}
