import { ValidationError, type AppError } from '@/core/errors';
import { err, type Result } from '@/core/result';
import type { Coordinate } from '@/domain/value-objects/coordinate';

import type { GeocodingGateway } from '../ports/geocoding.gateway';
import type { UseCase } from './use-case';

export type GeocodeAddressInput = {
  readonly address: string;
};

const CEP_DIGITS = /^\d{8}$/;

/**
 * RB07 — search by CEP or full address when no suggestion was picked.
 *
 * The native geocoder has no region parameter, so the country is appended to
 * keep "Centro" or a bare CEP from resolving to another country.
 */
export class GeocodeAddressUseCase implements UseCase<GeocodeAddressInput, Coordinate | null> {
  constructor(private readonly geocoding: GeocodingGateway) {}

  async execute(input: GeocodeAddressInput): Promise<Result<Coordinate | null, AppError>> {
    const address = input.address.trim();

    if (!address) {
      return err(new ValidationError('Digite um CEP ou endereço.', undefined, 'address'));
    }

    return this.geocoding.geocode(toBrazilianQuery(address));
  }
}

/** "36900000" / "36900-000" → "36900-000, Brasil"; other text gets ", Brasil". */
export function toBrazilianQuery(address: string): string {
  const digits = address.replace(/\D/g, '');
  const isCep = CEP_DIGITS.test(digits) && /^[\d\s.-]+$/.test(address);

  if (isCep) return `${digits.slice(0, 5)}-${digits.slice(5)}, Brasil`;
  return /\bbrasil\b/i.test(address) ? address : `${address}, Brasil`;
}
