import type { WasteCategoryId } from '@/domain/value-objects/waste-category';

const API_WASTE_TYPES = {
  plastic: 'PLASTIC',
  paper: 'PAPER',
  metals: 'METALS',
  glass: 'GLASS',
  'cooking-oil': 'COOKING_OIL',
  'general-electronics': 'ELECTRONICS',
  batteries: 'BATTERIES',
  'cell-phones': 'CELL_PHONES',
  computers: 'COMPUTERS',
  printers: 'PRINTERS',
  televisions: 'TELEVISIONS',
} as const satisfies Record<WasteCategoryId, string>;

const WASTE_CATEGORY_BY_API_TYPE = new Map<string, WasteCategoryId>(
  (Object.entries(API_WASTE_TYPES) as [WasteCategoryId, string][]).map(([id, apiType]) => [
    apiType,
    id,
  ]),
);

export function toApiWasteType(category: WasteCategoryId): string {
  return API_WASTE_TYPES[category];
}

export function fromApiWasteType(apiType: string): string {
  return WASTE_CATEGORY_BY_API_TYPE.get(apiType) ?? apiType;
}

export const API_WEEKDAYS: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

/** `Date.getDay()` index (the app's `Weekday`) → the API's weekday name. */
const API_WEEKDAY_NAMES = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
] as const;

export function toApiWeekday(weekday: number): string {
  return API_WEEKDAY_NAMES[weekday];
}

export const API_APPROVAL_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'INACTIVE'] as const;

export const APPROVAL_STATUS_BY_API_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  INACTIVE: 'suspended',
} as const satisfies Record<(typeof API_APPROVAL_STATUSES)[number], string>;

export const API_ROLES = ['CITIZEN', 'COLLECTOR', 'ADMIN'] as const;

export const ROLE_BY_API_ROLE = {
  CITIZEN: 'citizen',
  COLLECTOR: 'collector',
  ADMIN: 'admin',
} as const satisfies Record<(typeof API_ROLES)[number], string>;

/** Self-registration only creates citizens and collectors (admins come from the seed). */
export const API_ROLE_BY_ROLE = {
  citizen: 'CITIZEN',
  collector: 'COLLECTOR',
  admin: 'ADMIN',
} as const;

export const API_DISPOSAL_STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED'] as const;

/** Points are credited only when the point's collector confirms the disposal. */
export const DISPOSAL_STATUS_BY_API_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
} as const satisfies Record<(typeof API_DISPOSAL_STATUSES)[number], string>;
