import { DAYS_UNTIL_OUTDATED_INFO } from '@/domain/entities/collection-point';

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
