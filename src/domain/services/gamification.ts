import { getCategory, type WasteCategoryId } from '../value-objects/waste-category';

/**
 * RB09 — Gamification and rewards system for correct disposal.
 *
 * "Scoring rules must consider: waste type, quantity and disposal
 * frequency. Accumulated points must generate recognition through
 * ranking, seals and badges."
 *
 * Calculation:
 *   points = pointsPerKg(type) × weight(kg) × frequencyMultiplier(30 days)
 *
 * Pure function: same input, same output. It is the rule the backend must
 * replicate — the source of truth for persisted scores is always the server;
 * here it exists for an immediate UI preview and for offline mode.
 */

/** Multiplier for consistency over the last 30 days. */
const FREQUENCY_TIERS = [
  { minDisposals: 10, multiplier: 1.3, label: 'Sequência exemplar' },
  { minDisposals: 5, multiplier: 1.2, label: 'Hábito consolidado' },
  { minDisposals: 2, multiplier: 1.1, label: 'Ritmo constante' },
  { minDisposals: 0, multiplier: 1.0, label: 'Primeiros passos' },
] as const;

export type PointsCalculation = {
  readonly points: number;
  readonly basePoints: number;
  readonly frequencyMultiplier: number;
  readonly frequencyLabel: string;
};

export function calculateDisposalPoints(params: {
  category: WasteCategoryId;
  weightKg: number;
  /** The citizen's disposals over the last 30 days, not counting the current one. */
  disposalsLast30Days?: number;
}): PointsCalculation {
  const { category, weightKg, disposalsLast30Days = 0 } = params;

  const basePoints = getCategory(category).pointsPerKg * Math.max(weightKg, 0);
  const tier =
    FREQUENCY_TIERS.find((t) => disposalsLast30Days >= t.minDisposals) ??
    FREQUENCY_TIERS[FREQUENCY_TIERS.length - 1];

  return {
    points: Math.round(basePoints * tier.multiplier),
    basePoints: Math.round(basePoints),
    frequencyMultiplier: tier.multiplier,
    frequencyLabel: tier.label,
  };
}

/* -------------------------------------------------------------------------- */
/* Levels (ranking)                                                           */
/* -------------------------------------------------------------------------- */

export type Level = {
  readonly id: string;
  readonly title: string;
  readonly minPoints: number;
  readonly color: string;
};

export const LEVELS: readonly Level[] = [
  { id: 'beginner', title: 'Iniciante', minPoints: 0, color: '#9AA7A0' },
  { id: 'bronze', title: 'Reciclador Bronze', minPoints: 100, color: '#B45309' },
  { id: 'silver', title: 'Reciclador Prata', minPoints: 500, color: '#6B7280' },
  { id: 'gold', title: 'Reciclador Ouro', minPoints: 1500, color: '#CA8A04' },
  { id: 'guardian', title: 'Guardião do EcoPonto', minPoints: 5000, color: '#059669' },
] as const;

export function levelFor(points: number): Level {
  return [...LEVELS].reverse().find((level) => points >= level.minPoints) ?? LEVELS[0];
}

export function progressToNextLevel(points: number): {
  current: Level;
  next: Level | null;
  progress: number;
  pointsRemaining: number;
} {
  const current = levelFor(points);
  const next = LEVELS.find((level) => level.minPoints > points) ?? null;

  if (!next) {
    return { current, next: null, progress: 1, pointsRemaining: 0 };
  }

  const range = next.minPoints - current.minPoints;
  const covered = points - current.minPoints;

  return {
    current,
    next,
    progress: Math.min(Math.max(covered / range, 0), 1),
    pointsRemaining: next.minPoints - points,
  };
}

/* -------------------------------------------------------------------------- */
/* Seals and badges (CONQUISTA / CONQUISTA_USUARIO tables in the ERD)          */
/* -------------------------------------------------------------------------- */

export type Achievement = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly icon: string;
  readonly requiredPoints: number;
};

export const ACHIEVEMENTS: readonly Achievement[] = [
  {
    id: 'first-disposal',
    title: 'Primeiro passo',
    description: 'Registrou seu primeiro descarte no EcoPonto.',
    icon: 'seed-outline',
    requiredPoints: 1,
  },
  {
    id: 'conscious-electronics',
    title: 'Eletrônico consciente',
    description: 'Acumulou 250 pontos com descarte de eletrônicos.',
    icon: 'chip',
    requiredPoints: 250,
  },
  {
    id: 'bronze',
    title: 'Reciclador Bronze',
    description: 'Alcançou 100 pontos de descarte correto.',
    icon: 'medal-outline',
    requiredPoints: 100,
  },
  {
    id: 'silver',
    title: 'Reciclador Prata',
    description: 'Alcançou 500 pontos de descarte correto.',
    icon: 'medal',
    requiredPoints: 500,
  },
  {
    id: 'gold',
    title: 'Reciclador Ouro',
    description: 'Alcançou 1.500 pontos de descarte correto.',
    icon: 'trophy-outline',
    requiredPoints: 1500,
  },
  {
    id: 'guardian',
    title: 'Guardião do EcoPonto',
    description: 'Alcançou 5.000 pontos. Referência na sua cidade.',
    icon: 'shield-star-outline',
    requiredPoints: 5000,
  },
] as const;

export function unlockedAchievements(points: number): Achievement[] {
  return ACHIEVEMENTS.filter((achievement) => points >= achievement.requiredPoints);
}
