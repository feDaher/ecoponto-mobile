import type { OpeningHours } from '@/domain/entities/opening-hours';

const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export function getOpeningLabel(hours: readonly OpeningHours[], now: Date = new Date()): string {
  const today = hours.filter((h) => h.weekday === now.getDay());
  const current = now.getHours() * 60 + now.getMinutes();

  const openNow = today.find(
    (h) => toMinutes(h.opensAt) <= current && current < toMinutes(h.closesAt),
  );
  if (openNow) return `Aberto hoje até ${openNow.closesAt}`;

  const nextToday = today
    .filter((h) => toMinutes(h.opensAt) > current)
    .sort((a, b) => toMinutes(a.opensAt) - toMinutes(b.opensAt))[0];
  if (nextToday) return `Fechado agora · abre às ${nextToday.opensAt}`;

  return 'Fechado hoje';
}
