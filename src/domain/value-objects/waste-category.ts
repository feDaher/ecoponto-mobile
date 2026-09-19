import { ValidationError } from '@/core/errors';
import { err, ok, type Result } from '@/core/result';

/**
 * RB05 — Mandatory categorization by waste type.
 *
 * Standardized taxonomy of EcoPonto Digital. The specification defines the
 * MINIMUM mandatory set; this is the single source of truth in the app. The
 * backend must expose exactly these `slug`s in the `CATEGORIA_RESIDUO` table —
 * the mapper rejects any unknown category instead of rendering garbage on screen.
 */
export const WASTE_GROUPS = ['recyclable', 'electronic'] as const;
export type WasteGroup = (typeof WASTE_GROUPS)[number];

export type WasteCategoryId =
  | 'plastic'
  | 'paper'
  | 'metals'
  | 'glass'
  | 'cooking-oil'
  | 'general-electronics'
  | 'batteries'
  | 'cell-phones'
  | 'computers'
  | 'printers'
  | 'televisions';

export type WasteCategory = {
  readonly id: WasteCategoryId;
  readonly name: string;
  readonly group: WasteGroup;
  readonly description: string;
  /** Icon name in `@expo/vector-icons/MaterialCommunityIcons`. */
  readonly icon: string;
  /** Highlight color (hex) used in chips, map pins and legends. */
  readonly color: string;
  /**
   * RB09 — gamification scoring base: points per kilogram disposed.
   * Electronics are worth more because the environmental cost of improper
   * disposal is higher and the collection rate is the lowest per the field survey.
   */
  readonly pointsPerKg: number;
};

export const WASTE_CATEGORIES: readonly WasteCategory[] = [
  {
    id: 'plastic',
    name: 'Plástico',
    group: 'recyclable',
    description: 'Garrafas PET, embalagens, potes e sacolas limpos e secos.',
    icon: 'bottle-soda-outline',
    color: '#DC2626',
    pointsPerKg: 10,
  },
  {
    id: 'paper',
    name: 'Papel e papelão',
    group: 'recyclable',
    description: 'Caixas, jornais, revistas e folhas sem gordura ou umidade.',
    icon: 'newspaper-variant-outline',
    color: '#2563EB',
    pointsPerKg: 8,
  },
  {
    id: 'metals',
    name: 'Metais',
    group: 'recyclable',
    description: 'Latas de alumínio e aço, tampas e utensílios metálicos.',
    icon: 'silverware-fork-knife',
    color: '#F59E0B',
    pointsPerKg: 14,
  },
  {
    id: 'glass',
    name: 'Vidro',
    group: 'recyclable',
    description: 'Garrafas, potes e frascos. Embale cacos com segurança.',
    icon: 'bottle-wine-outline',
    color: '#16A34A',
    pointsPerKg: 9,
  },
  {
    id: 'cooking-oil',
    name: 'Óleo de cozinha usado',
    group: 'recyclable',
    description: 'Armazene em garrafa PET fechada. Nunca descarte na pia.',
    icon: 'oil',
    color: '#CA8A04',
    pointsPerKg: 20,
  },
  {
    id: 'general-electronics',
    name: 'Eletrônicos em geral',
    group: 'electronic',
    description: 'Pequenos aparelhos, cabos, carregadores e periféricos.',
    icon: 'chip',
    color: '#3B82F6',
    pointsPerKg: 25,
  },
  {
    id: 'batteries',
    name: 'Pilhas e baterias',
    group: 'electronic',
    description: 'Alta toxicidade. Jamais descarte no lixo comum.',
    icon: 'battery-alert-variant-outline',
    color: '#7C3AED',
    pointsPerKg: 40,
  },
  {
    id: 'cell-phones',
    name: 'Celulares',
    group: 'electronic',
    description: 'Apague seus dados e remova o chip antes de entregar.',
    icon: 'cellphone',
    color: '#0EA5E9',
    pointsPerKg: 35,
  },
  {
    id: 'computers',
    name: 'Computadores e notebooks',
    group: 'electronic',
    description: 'CPUs, notebooks, monitores, teclados e mouses.',
    icon: 'laptop',
    color: '#1D4ED8',
    pointsPerKg: 30,
  },
  {
    id: 'printers',
    name: 'Impressoras e cartuchos',
    group: 'electronic',
    description: 'Impressoras, toners e cartuchos de tinta.',
    icon: 'printer-outline',
    color: '#6D28D9',
    pointsPerKg: 28,
  },
  {
    id: 'televisions',
    name: 'Televisores',
    group: 'electronic',
    description: 'TVs de tubo, LCD e LED. Confirme o porte aceito pelo ponto.',
    icon: 'television-classic',
    color: '#4F46E5',
    pointsPerKg: 22,
  },
] as const;

const INDEX = new Map<string, WasteCategory>(WASTE_CATEGORIES.map((c) => [c.id, c]));

export function isWasteCategoryId(value: unknown): value is WasteCategoryId {
  return typeof value === 'string' && INDEX.has(value);
}

export function getCategory(id: WasteCategoryId): WasteCategory {
  const category = INDEX.get(id);
  // Invariant: the type already guarantees existence. If we get here, it's a bug.
  if (!category) throw new Error(`Categoria de resíduo desconhecida: ${id}`);
  return category;
}

export function parseCategoryId(value: unknown): Result<WasteCategoryId, ValidationError> {
  if (!isWasteCategoryId(value)) {
    return err(
      new ValidationError(
        `Categoria de resíduo desconhecida: ${String(value)}`,
        undefined,
        'categories',
      ),
    );
  }
  return ok(value);
}

export function categoriesInGroup(group: WasteGroup): WasteCategory[] {
  return WASTE_CATEGORIES.filter((category) => category.group === group);
}
