import { ValidationError } from '@/core/errors';
import { err, ok, type Result } from '@/core/result';

const BRAZIL_COUNTRY_CODE = '55';

/**
 * Brazilian phone number, stored as digits only (area code + number).
 *
 * RB01 — phone is a mandatory sign-up field.
 * RB08 — it is the basis of the WhatsApp contact link on the point's page.
 */
export class Phone {
  private constructor(
    /** Digits only, no country code. E.g.: `33988887777`. */
    readonly digits: string,
  ) {
    Object.freeze(this);
  }

  static create(input: unknown): Result<Phone, ValidationError> {
    if (typeof input !== 'string' || input.trim() === '') {
      return err(new ValidationError('Informe um telefone.', undefined, 'phone'));
    }

    let digits = input.replace(/\D/g, '');

    // Accepts both "+55 33 9..." and "33 9..." coming from the form.
    if (digits.length > 11 && digits.startsWith(BRAZIL_COUNTRY_CODE)) {
      digits = digits.slice(BRAZIL_COUNTRY_CODE.length);
    }

    if (digits.length !== 10 && digits.length !== 11) {
      return err(
        new ValidationError(
          'Telefone deve ter DDD + número (10 ou 11 dígitos).',
          undefined,
          'phone',
        ),
      );
    }

    const areaCode = Number(digits.slice(0, 2));
    if (areaCode < 11 || areaCode > 99) {
      return err(new ValidationError('DDD inválido.', undefined, 'phone'));
    }

    // In Brazil a mobile number (11 digits) always starts with 9 after the area code.
    if (digits.length === 11 && digits[2] !== '9') {
      return err(new ValidationError('Número de celular inválido.', undefined, 'phone'));
    }

    return ok(new Phone(digits));
  }

  /** E.164 format without `+`, required by the `wa.me` link. */
  get forWhatsApp(): string {
    return `${BRAZIL_COUNTRY_CODE}${this.digits}`;
  }

  /** `(33) 98888-7777` */
  get formatted(): string {
    const areaCode = this.digits.slice(0, 2);
    const rest = this.digits.slice(2);
    const middle = rest.length === 9 ? rest.slice(0, 5) : rest.slice(0, 4);
    const end = rest.length === 9 ? rest.slice(5) : rest.slice(4);
    return `(${areaCode}) ${middle}-${end}`;
  }

  equals(other: Phone): boolean {
    return this.digits === other.digits;
  }

  toJSON(): string {
    return this.digits;
  }
}
