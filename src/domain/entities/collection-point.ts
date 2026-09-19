import { BusinessRuleError, ValidationError } from '@/core/errors';
import { err, ok, type Result } from '@/core/result';

import { Coordinate } from '../value-objects/coordinate';
import type { Phone } from '../value-objects/phone';
import type { WasteCategoryId } from '../value-objects/waste-category';
import type { OpeningHours } from './opening-hours';

/** Mirrors `PONTO_COLETA.statusAprovacao` from the ERD. */
export const APPROVAL_STATUSES = ['pending', 'approved', 'rejected', 'suspended'] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

/** RB06 — with no update for more than 60 days, the information is flagged. */
export const DAYS_UNTIL_OUTDATED_INFO = 60;

const MS_PER_DAY = 86_400_000;

export type CollectionPointProps = {
  id: string;
  collectorId: string;
  name: string;
  address: string;
  city: string;
  coordinate: Coordinate;
  categories: readonly WasteCategoryId[];
  openingHours: readonly OpeningHours[];
  status: ApprovalStatus;
  updatedAt: Date;
  accreditedAt?: Date | null;
  description?: string | null;
  whatsAppContact?: Phone | null;
  /** RB08 — the collector must explicitly authorize displaying the number. */
  showWhatsApp?: boolean;
  averageRating?: number | null;
  reviewCount?: number;
};

/**
 * Accredited collection point — the system's aggregate root.
 *
 * Concentrates the specification rules that cannot depend on a screen or an API:
 *  - RB03 mandatory administrative approval before being displayed;
 *  - RB04 mandatory and validated geolocation;
 *  - RB05 mandatory categorization by waste type;
 *  - RB06 mandatory opening hours + outdated data flag;
 *  - RB08 WhatsApp only when provided AND authorized.
 */
export class CollectionPoint {
  readonly id: string;
  readonly collectorId: string;
  readonly name: string;
  readonly address: string;
  readonly city: string;
  readonly coordinate: Coordinate;
  readonly categories: readonly WasteCategoryId[];
  readonly openingHours: readonly OpeningHours[];
  readonly status: ApprovalStatus;
  readonly updatedAt: Date;
  readonly accreditedAt: Date | null;
  readonly description: string | null;
  readonly whatsAppContact: Phone | null;
  readonly showWhatsApp: boolean;
  readonly averageRating: number | null;
  readonly reviewCount: number;

  private constructor(props: Required<CollectionPointProps>) {
    this.id = props.id;
    this.collectorId = props.collectorId;
    this.name = props.name;
    this.address = props.address;
    this.city = props.city;
    this.coordinate = props.coordinate;
    this.categories = Object.freeze([...props.categories]);
    this.openingHours = Object.freeze([...props.openingHours]);
    this.status = props.status;
    this.updatedAt = props.updatedAt;
    this.accreditedAt = props.accreditedAt;
    this.description = props.description;
    this.whatsAppContact = props.whatsAppContact;
    this.showWhatsApp = props.showWhatsApp;
    this.averageRating = props.averageRating;
    this.reviewCount = props.reviewCount;
    Object.freeze(this);
  }

  static create(props: CollectionPointProps): Result<CollectionPoint, ValidationError> {
    if (!props.id?.trim()) {
      return err(new ValidationError('Ponto de coleta sem identificador.'));
    }

    if (!props.name?.trim()) {
      return err(new ValidationError('Informe o nome do local.', undefined, 'name'));
    }

    if (!props.address?.trim()) {
      return err(new ValidationError('Informe o endereço completo.', undefined, 'address'));
    }

    if (!props.city?.trim()) {
      return err(new ValidationError('Informe a cidade.', undefined, 'city'));
    }

    if (!(props.coordinate instanceof Coordinate)) {
      // RB04 — without a valid location the registration is automatically rejected.
      return err(
        new ValidationError(
          'Localização inválida. Informe coordenadas ou um endereço verificável.',
          undefined,
          'coordinate',
        ),
      );
    }

    if (props.categories.length === 0) {
      // RB05 — a point without categorization cannot exist in the system.
      return err(
        new ValidationError(
          'Selecione ao menos uma categoria de resíduo aceita.',
          undefined,
          'categories',
        ),
      );
    }

    if (props.openingHours.length === 0) {
      // RB06 — days and hours are mandatory on registration.
      return err(
        new ValidationError(
          'Informe ao menos um dia e horário de funcionamento.',
          undefined,
          'openingHours',
        ),
      );
    }

    const rating = props.averageRating ?? null;
    if (rating !== null && (rating < 0 || rating > 5)) {
      return err(
        new ValidationError('Nota média fora da faixa de 0 a 5.', undefined, 'averageRating'),
      );
    }

    return ok(
      new CollectionPoint({
        ...props,
        categories: dedup(props.categories),
        accreditedAt: props.accreditedAt ?? null,
        description: props.description?.trim() || null,
        whatsAppContact: props.whatsAppContact ?? null,
        showWhatsApp: props.showWhatsApp ?? false,
        averageRating: rating,
        reviewCount: props.reviewCount ?? 0,
      }),
    );
  }

  /** RB03 — nothing shows on the map before the administrator approves it. */
  get isVisibleOnMap(): boolean {
    return this.status === 'approved';
  }

  get isAwaitingApproval(): boolean {
    return this.status === 'pending';
  }

  /** RB06 — "possibly outdated information" after 60 days without an update. */
  isInfoOutdated(now: Date = new Date()): boolean {
    const days = (now.getTime() - this.updatedAt.getTime()) / MS_PER_DAY;
    return days > DAYS_UNTIL_OUTDATED_INFO;
  }

  daysSinceUpdate(now: Date = new Date()): number {
    return Math.max(0, Math.floor((now.getTime() - this.updatedAt.getTime()) / MS_PER_DAY));
  }

  /** RB08 — number provided **and** display authorized by the collector. */
  get isWhatsAppAvailable(): boolean {
    return this.showWhatsApp && this.whatsAppContact !== null;
  }

  acceptsCategory(category: WasteCategoryId): boolean {
    return this.categories.includes(category);
  }

  /** True if the point accepts at least one of the filtered categories. */
  acceptsAny(categories: readonly WasteCategoryId[]): boolean {
    if (categories.length === 0) return true;
    return categories.some((category) => this.acceptsCategory(category));
  }

  isOpenAt(moment: Date = new Date()): boolean {
    return this.openingHours.some((hours) => hours.contains(moment));
  }

  distanceKmFrom(origin: Coordinate): number {
    return this.coordinate.distanceKmTo(origin);
  }

  /**
   * RB03 + RB05 — check the administrator runs before approving.
   * Kept in the domain so the app and the future web panel share the rule.
   */
  canBeApproved(): Result<true, BusinessRuleError> {
    if (this.categories.length === 0) {
      return err(
        new BusinessRuleError('RB05', 'Pontos sem categorização não podem ser aprovados.'),
      );
    }

    if (this.openingHours.length === 0) {
      return err(
        new BusinessRuleError('RB06', 'Informe os horários de funcionamento antes de aprovar.'),
      );
    }

    if (!this.address.trim()) {
      return err(new BusinessRuleError('RB03', 'Confira o endereço antes de aprovar o ponto.'));
    }

    return ok(true as const);
  }

  /** Immutable copy with changes — entities never mutate in place. */
  with(changes: Partial<CollectionPointProps>): Result<CollectionPoint, ValidationError> {
    return CollectionPoint.create({
      id: this.id,
      collectorId: this.collectorId,
      name: this.name,
      address: this.address,
      city: this.city,
      coordinate: this.coordinate,
      categories: this.categories,
      openingHours: this.openingHours,
      status: this.status,
      updatedAt: this.updatedAt,
      accreditedAt: this.accreditedAt,
      description: this.description,
      whatsAppContact: this.whatsAppContact,
      showWhatsApp: this.showWhatsApp,
      averageRating: this.averageRating,
      reviewCount: this.reviewCount,
      ...changes,
    });
  }
}

function dedup<T>(items: readonly T[]): T[] {
  return [...new Set(items)];
}
