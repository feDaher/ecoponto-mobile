import { ValidationError } from '@/core/errors';
import { err, ok, type Result } from '@/core/result';

/** Index compatible with `Date.getDay()`: 0 = Sunday … 6 = Saturday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const WEEKDAY_NAME: Record<Weekday, string> = {
  0: 'Domingo',
  1: 'Segunda',
  2: 'Terça',
  3: 'Quarta',
  4: 'Quinta',
  5: 'Sexta',
  6: 'Sábado',
};

export const WEEKDAY_SHORT_NAME: Record<Weekday, string> = {
  0: 'Dom',
  1: 'Seg',
  2: 'Ter',
  3: 'Qua',
  4: 'Qui',
  5: 'Sex',
  6: 'Sáb',
};

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export type OpeningHoursProps = {
  id: string;
  weekday: number;
  /** `HH:mm` (24h), mirroring `HORARIO_FUNCIONAMENTO.hAbertura` from the ERD. */
  opensAt: string;
  closesAt: string;
};

/**
 * Service window of a point on a given weekday.
 *
 * RB06 — Mandatory opening hours: every point must provide days and hours
 * at registration time.
 */
export class OpeningHours {
  private constructor(
    readonly id: string,
    readonly weekday: Weekday,
    readonly opensAt: string,
    readonly closesAt: string,
    private readonly opensAtMinutes: number,
    private readonly closesAtMinutes: number,
  ) {
    Object.freeze(this);
  }

  static create(props: OpeningHoursProps): Result<OpeningHours, ValidationError> {
    const { id, weekday, opensAt, closesAt } = props;

    if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
      return err(new ValidationError('Dia da semana inválido.', undefined, 'openingHours'));
    }

    if (!TIME_PATTERN.test(opensAt) || !TIME_PATTERN.test(closesAt)) {
      return err(
        new ValidationError('Horário deve estar no formato HH:mm.', undefined, 'openingHours'),
      );
    }

    const opensAtMinutes = toMinutes(opensAt);
    const closesAtMinutes = toMinutes(closesAt);

    if (opensAtMinutes === closesAtMinutes) {
      return err(
        new ValidationError(
          'Abertura e fechamento não podem ser iguais.',
          undefined,
          'openingHours',
        ),
      );
    }

    return ok(
      new OpeningHours(id, weekday as Weekday, opensAt, closesAt, opensAtMinutes, closesAtMinutes),
    );
  }

  /** Runs past midnight (e.g.: 22:00 → 02:00). */
  get crossesMidnight(): boolean {
    return this.closesAtMinutes < this.opensAtMinutes;
  }

  /** Is the point within this window at the given instant? */
  contains(moment: Date): boolean {
    const minutes = moment.getHours() * 60 + moment.getMinutes();
    const day = moment.getDay() as Weekday;

    if (this.crossesMidnight) {
      // E.g.: Friday 22:00–02:00 covers Friday night and early Saturday morning.
      const previousDay = ((day + 6) % 7) as Weekday;
      if (day === this.weekday && minutes >= this.opensAtMinutes) return true;
      return previousDay === this.weekday && minutes < this.closesAtMinutes;
    }

    return day === this.weekday && minutes >= this.opensAtMinutes && minutes < this.closesAtMinutes;
  }

  get label(): string {
    return `${this.opensAt} às ${this.closesAt}`;
  }

  toJSON() {
    return {
      id: this.id,
      weekday: this.weekday,
      opensAt: this.opensAt,
      closesAt: this.closesAt,
    };
  }
}

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Groups hours by day, in weekday order, for display on the point's page. */
export function groupByDay(
  hours: readonly OpeningHours[],
): { day: Weekday; windows: OpeningHours[] }[] {
  const map = new Map<Weekday, OpeningHours[]>();

  for (const entry of hours) {
    const list = map.get(entry.weekday) ?? [];
    list.push(entry);
    map.set(entry.weekday, list);
  }

  return [...map.entries()]
    .sort(([a], [b]) => a - b)
    .map(([day, windows]) => ({
      day,
      windows: windows.sort((a, b) => a.opensAt.localeCompare(b.opensAt)),
    }));
}
