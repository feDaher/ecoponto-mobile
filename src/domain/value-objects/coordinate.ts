import { ValidationError } from '@/core/errors';
import { err, ok, type Result } from '@/core/result';

const EARTH_RADIUS_KM = 6371;

/**
 * Validated geographic coordinate.
 *
 * RB04 — Mandatory and validated geolocation: the system automatically
 * rejects registrations without a valid location. This value object is the
 * only way for a coordinate to exist in the domain, so the rule cannot be
 * bypassed by a screen or by an API payload.
 *
 * Precision follows the ERD: latitude decimal(10,8), longitude decimal(11,8).
 */
export class Coordinate {
  private constructor(
    readonly latitude: number,
    readonly longitude: number,
  ) {
    Object.freeze(this);
  }

  static create(latitude: unknown, longitude: unknown): Result<Coordinate, ValidationError> {
    if (typeof latitude !== 'number' || !Number.isFinite(latitude)) {
      return err(new ValidationError('Latitude inválida.', undefined, 'latitude'));
    }

    if (typeof longitude !== 'number' || !Number.isFinite(longitude)) {
      return err(new ValidationError('Longitude inválida.', undefined, 'longitude'));
    }

    if (latitude < -90 || latitude > 90) {
      return err(
        new ValidationError('Latitude deve estar entre -90 e 90 graus.', undefined, 'latitude'),
      );
    }

    if (longitude < -180 || longitude > 180) {
      return err(
        new ValidationError('Longitude deve estar entre -180 e 180 graus.', undefined, 'longitude'),
      );
    }

    // "Null Island": almost always an unfilled field arriving as 0.
    if (latitude === 0 && longitude === 0) {
      return err(
        new ValidationError(
          'Localização não informada. Selecione o ponto no mapa ou informe o endereço completo.',
          undefined,
          'latitude',
        ),
      );
    }

    return ok(new Coordinate(round(latitude, 8), round(longitude, 8)));
  }

  /** Distance in km using the Haversine formula (enough for urban radii). */
  distanceKmTo(other: Coordinate): number {
    const dLat = toRad(other.latitude - this.latitude);
    const dLon = toRad(other.longitude - this.longitude);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(this.latitude)) * Math.cos(toRad(other.latitude)) * Math.sin(dLon / 2) ** 2;

    return round(2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a)), 3);
  }

  equals(other: Coordinate): boolean {
    return this.latitude === other.latitude && this.longitude === other.longitude;
  }

  toJSON() {
    return { latitude: this.latitude, longitude: this.longitude };
  }
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
