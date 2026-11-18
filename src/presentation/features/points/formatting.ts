import { DAYS_UNTIL_OUTDATED_INFO } from '@/domain/entities/collection-point';
import {
  WEEKDAY_NAME,
  groupByDay,
  type OpeningHours,
  type Weekday,
} from '@/domain/entities/opening-hours';

/** `850 m`, `1,2 km`, `12 km` — below 1 km the citizen thinks in meters. */
export function formatDistance(km: number | null): string | null {
  if (km === null) return null;
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1).replace('.', ',')} km`;
  return `${Math.round(km)} km`;
}

export function formatWeight(kg: number): string {
  if (kg < 1) return `${Math.round(kg * 1000)} g`;
  return `${kg.toFixed(kg % 1 === 0 ? 0 : 1).replace('.', ',')} kg`;
}

export function formatPoints(points: number): string {
  return points.toLocaleString('pt-BR');
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** "há 3 dias", "hoje" — used in the disposal history and in reviews. */
export function formatRelativeTime(date: Date, now: Date = new Date()): string {
  const days = Math.floor((now.getTime() - date.getTime()) / 86_400_000);

  if (days <= 0) return 'hoje';
  if (days === 1) return 'ontem';
  if (days < 30) return `há ${days} dias`;

  const months = Math.floor(days / 30);
  if (months < 12) return `há ${months} ${months === 1 ? 'mês' : 'meses'}`;

  const years = Math.floor(months / 12);
  return `há ${years} ${years === 1 ? 'ano' : 'anos'}`;
}

/** RB06 — text for the possibly-outdated-information notice. */
export function outdatedNotice(days: number): string {
  return `Informação possivelmente desatualizada — sem atualização há ${days} dias (limite de ${DAYS_UNTIL_OUTDATED_INFO}).`;
}

/** `"09:30"` for the current moment — `OpeningHours` times are zero-padded, so they compare as text. */
function toHHmm(moment: Date): string {
  return `${String(moment.getHours()).padStart(2, '0')}:${String(moment.getMinutes()).padStart(2, '0')}`;
}

/**
 * The next window that opens, looking at today first and then at the following
 * days. `null` when the point has no hours at all.
 */
function nextOpening(
  hours: readonly OpeningHours[],
  now: Date,
): { day: Weekday; window: OpeningHours } | null {
  const byDay = groupByDay(hours);
  const current = toHHmm(now);

  for (let offset = 0; offset < 7; offset += 1) {
    const day = ((now.getDay() + offset) % 7) as Weekday;
    const windows = byDay.find((entry) => entry.day === day)?.windows ?? [];
    const upcoming = offset === 0 ? windows.filter((w) => w.opensAt > current) : windows;

    if (upcoming.length > 0) return { day, window: upcoming[0] };
  }

  return null;
}

/**
 * One line that answers "can I go there now?" — e.g. `Aberto agora até 17:00`
 * or `Fechado agora · abre quinta às 08:00`.
 *
 * Lives in `presentation/` because it is display text; the rule of what counts
 * as open belongs to `OpeningHours.contains`, which handles windows that cross
 * midnight.
 */
export function openingStatusLabel(hours: readonly OpeningHours[], now: Date = new Date()): string {
  const openWindow = hours.find((window) => window.contains(now));
  if (openWindow) return `Aberto agora até ${openWindow.closesAt}`;

  const next = nextOpening(hours, now);
  if (!next) return 'Horários não informados';

  const when =
    next.day === now.getDay() ? 'hoje' : WEEKDAY_NAME[next.day].toLocaleLowerCase('pt-BR');

  return `Fechado agora · abre ${when} às ${next.window.opensAt}`;
}
