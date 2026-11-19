import { z } from 'zod';

import { APPROVAL_STATUSES } from '@/domain/entities/collection-point';
import { DISPOSAL_STATUSES } from '@/domain/entities/disposal-record';
import { REVIEW_STATUSES } from '@/domain/entities/review';
import { USER_ROLES } from '@/domain/value-objects/user-role';

import {
  API_APPROVAL_STATUSES,
  API_DISPOSAL_STATUSES,
  API_ROLES,
  API_WEEKDAYS,
  APPROVAL_STATUS_BY_API_STATUS,
  DISPOSAL_STATUS_BY_API_STATUS,
  fromApiWasteType,
  ROLE_BY_API_ROLE,
} from './api-enums';

/**
 * REST API contracts (section 4.3.1 of the specification).
 *
 * Field names are in English and map to the ERD entities (`PONTO_COLETA`,
 * `USUARIO`, `AVALIACAO`, …). Conversion into domain entities happens in the
 * mappers — no DTO crosses into the application layer.
 *
 * Two families live here:
 *  - the **canonical** schemas (`collectionPointDtoSchema`, `userDtoSchema`…) —
 *    the shape the mappers and the offline demo data use;
 *  - the **`api*`** schemas — what ecoponto-api actually returns. Each one
 *    validates the backend payload and translates it into the canonical shape,
 *    so the mappers and the domain never see backend field names.
 * Any divergence becomes a visible `ContractMismatchError` in development,
 * instead of a silent `undefined` on screen.
 */

/** IDs may arrive as `int` (MySQL) or string (JSON). We normalize to string. */
const idSchema = z.union([z.string().min(1), z.number().int()]).transform(String);

/** Accepts `decimal` serialized as a number or a string (the MySQL driver does this). */
const numberSchema = z.union([z.number(), z.string()]).transform(Number);

const dateSchema = z
  .union([z.string(), z.number()])
  .transform((value) => new Date(value))
  .refine((date) => !Number.isNaN(date.getTime()), { message: 'Data inválida' });

export const openingHoursDtoSchema = z.object({
  id: idSchema,
  weekday: z.union([z.number().int(), z.string()]).transform(Number),
  opensAt: z.string(),
  closesAt: z.string(),
});

export const collectionPointDtoSchema = z.object({
  id: idSchema,
  collectorId: idSchema,
  name: z.string(),
  address: z.string(),
  city: z.string(),
  neighborhood: z.string().nullish(),
  latitude: numberSchema,
  longitude: numberSchema,
  approvalStatus: z.enum(APPROVAL_STATUSES),
  updatedAt: dateSchema,
  categories: z.array(z.string()),
  openingHours: z.array(openingHoursDtoSchema).default([]),
  description: z.string().nullish(),
  whatsAppContact: z.string().nullish(),
  showWhatsApp: z.boolean().nullish(),
  accreditedAt: dateSchema.nullish(),
  averageRating: numberSchema.nullish(),
  reviewCount: z.number().int().nullish(),
});

const apiOperatingHourSchema = z.object({
  id: idSchema.optional(),
  weekday: z.string(),
  openTime: z.string(),
  closeTime: z.string(),
  isActive: z.boolean().optional(),
});

export const apiCollectionPointDtoSchema = z
  .object({
    id: idSchema,
    collectorId: idSchema,
    name: z.string(),
    address: z.string(),
    city: z.string(),
    latitude: numberSchema,
    longitude: numberSchema,
    status: z.enum(API_APPROVAL_STATUSES),
    wasteCategories: z.array(z.string()),
    // The API returns the point's active operating hours as `hours`.
    hours: z.array(apiOperatingHourSchema).default([]),
    description: z.string().nullish(),
    whatsappContact: z.string().nullish(),
    showWhatsappContact: z.boolean().nullish(),
    hoursConfirmedAt: dateSchema.nullish(),
    updatedAt: dateSchema,
  })
  .transform((point): CollectionPointDto => ({
    id: point.id,
    collectorId: point.collectorId,
    name: point.name,
    address: point.address,
    city: point.city,
    latitude: point.latitude,
    longitude: point.longitude,
    approvalStatus: APPROVAL_STATUS_BY_API_STATUS[point.status],
    updatedAt: point.hoursConfirmedAt ?? point.updatedAt,
    categories: point.wasteCategories.map(fromApiWasteType),
    // Inactive slots are history, not opening hours.
    openingHours: point.hours
      .filter((hours) => hours.isActive !== false)
      .map((hours, index) => ({
        id: hours.id ?? `${point.id}-${hours.weekday}-${index}`,
        weekday: API_WEEKDAYS[hours.weekday] ?? -1,
        opensAt: hours.openTime,
        closesAt: hours.closeTime,
      })),
    description: point.description,
    whatsAppContact: point.whatsappContact,
    showWhatsApp: point.showWhatsappContact,
  }));

export const userDtoSchema = z.object({
  id: idSchema,
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  city: z.string(),
  role: z.enum(USER_ROLES),
  registeredAt: dateSchema,
  points: z.number().int().nullish(),
  avatarUrl: z.string().nullish(),
});

export const sessionDtoSchema = z.object({
  token: z.string().min(1),
  user: userDtoSchema,
});

/**
 * `User` row as ecoponto-api returns it (login and `GET /auth/me`). Points are
 * not part of the user there: they come from `/disposals/me/summary`.
 */
export const apiUserDtoSchema = z
  .object({
    id: idSchema,
    name: z.string(),
    email: z.string(),
    phone: z.string(),
    city: z.string(),
    role: z.enum(API_ROLES),
    createdAt: dateSchema,
  })
  .transform((user): UserDto => ({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    city: user.city,
    role: ROLE_BY_API_ROLE[user.role],
    registeredAt: user.createdAt,
    points: null,
    avatarUrl: null,
  }));

/** Firebase's `expiresIn` arrives as a string of seconds ("3600"). */
const secondsSchema = z.union([z.string(), z.number()]).transform(Number);

export const apiSessionTokensSchema = z.object({
  idToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresIn: secondsSchema,
});

export const apiLoginResponseSchema = apiSessionTokensSchema.extend({ user: apiUserDtoSchema });

export const reviewDtoSchema = z.object({
  id: idSchema,
  citizenId: idSchema,
  collectionPointId: idSchema,
  rating: z.number().int(),
  reviewedAt: dateSchema,
  comment: z.string().nullish(),
  author: z.string().nullish(),
  status: z.enum(REVIEW_STATUSES).nullish(),
});

export const disposalRecordDtoSchema = z.object({
  id: idSchema,
  citizenId: idSchema,
  collectionPointId: idSchema,
  categoryId: z.string(),
  weightKg: numberSchema,
  pointsEarned: z.number().int(),
  disposedAt: dateSchema,
  collectionPointName: z.string().nullish(),
  status: z.enum(DISPOSAL_STATUSES).nullish(),
});

/** Disposal as ecoponto-api returns it; the category travels as its code (`PLASTIC`). */
export const apiDisposalDtoSchema = z
  .object({
    id: idSchema,
    citizenId: idSchema,
    collectionPointId: idSchema,
    weightKg: numberSchema,
    pointsEarned: z.number().int(),
    status: z.enum(API_DISPOSAL_STATUSES),
    disposedAt: dateSchema,
    collectionPoint: z.object({ name: z.string() }).nullish(),
    category: z.object({ name: z.string() }),
  })
  .transform((disposal): DisposalRecordDto => ({
    id: disposal.id,
    citizenId: disposal.citizenId,
    collectionPointId: disposal.collectionPointId,
    categoryId: fromApiWasteType(disposal.category.name),
    weightKg: disposal.weightKg,
    pointsEarned: disposal.pointsEarned,
    disposedAt: disposal.disposedAt,
    collectionPointName: disposal.collectionPoint?.name ?? null,
    status: DISPOSAL_STATUS_BY_API_STATUS[disposal.status],
  }));

export const apiDisposalPageSchema = z.object({
  items: z.array(apiDisposalDtoSchema),
  total: z.number().int(),
});

export const apiDisposalSummarySchema = z.object({ totalPoints: z.number().int() });

export const rankingEntryDtoSchema = z.object({
  name: z.string(),
  city: z.string(),
  points: z.number().int(),
  position: z.number().int(),
});

export const myRankingDtoSchema = z.object({
  name: z.string(),
  points: z.number().int(),
  position: z.number().int().nullable(),
});

/** Public review: first name only, no citizen id (LGPD minimization on the API). */
export const apiReviewDtoSchema = z.object({
  id: idSchema,
  rating: z.number().int(),
  comment: z.string().nullish(),
  authorName: z.string().nullish(),
  createdAt: dateSchema,
});

/** Category taxonomy (RB05): the API identifies categories by UUID, the app by slug. */
export const apiWasteCategorySchema = z.object({
  id: idSchema,
  name: z.string(),
  active: z.boolean().optional(),
});

/** Guide as the API returns it: one Markdown `content`, split into sections by the mapper. */
export const apiEducationalContentDtoSchema = z.object({
  id: idSchema,
  title: z.string(),
  summary: z.string(),
  content: z.string(),
  categoryId: idSchema,
  publishedAt: dateSchema.nullish(),
  createdAt: dateSchema,
});

export const educationalContentDtoSchema = z.object({
  id: idSchema,
  title: z.string(),
  summary: z.string(),
  categoryId: z.string(),
  howToDispose: z.array(z.string()).default([]),
  whyRecycle: z.string(),
  environmentalImpact: z.string(),
  body: z.string().default(''),
  publishedAt: dateSchema,
});

const latLngDtoSchema = z.object({ latitude: numberSchema, longitude: numberSchema });

/**
 * Address search proxied by the API (`/places/*`). The backend holds the Google
 * key, calls Places API (New) and returns this reduced shape — the app never
 * sees the Google payload, so swapping the provider does not touch the app.
 */
export const placeSuggestionDtoSchema = z.object({
  placeId: z.string().min(1),
  title: z.string(),
  subtitle: z
    .string()
    .nullish()
    .transform((value) => value ?? ''),
});

export const placeDetailsDtoSchema = z.object({
  label: z.string(),
  latitude: numberSchema,
  longitude: numberSchema,
  viewport: z.object({ southWest: latLngDtoSchema, northEast: latLngDtoSchema }).nullish(),
});

export const pointListSchema = z.array(collectionPointDtoSchema);
export const apiPointListSchema = z.array(apiCollectionPointDtoSchema);
export const placeSuggestionListSchema = z.array(placeSuggestionDtoSchema);
export const reviewListSchema = z.array(reviewDtoSchema);
export const disposalListSchema = z.array(disposalRecordDtoSchema);
export const rankingListSchema = z.array(rankingEntryDtoSchema);
export const apiReviewListSchema = z.array(apiReviewDtoSchema);
export const apiWasteCategoryListSchema = z.array(apiWasteCategorySchema);
export const apiContentListSchema = z.array(apiEducationalContentDtoSchema);
export const contentListSchema = z.array(educationalContentDtoSchema);
export const countSchema = z.object({ total: z.number().int() });

/** Output types — already normalized (dates as `Date`, ids as `string`). */
export type CollectionPointDto = z.infer<typeof collectionPointDtoSchema>;
export type UserDto = z.infer<typeof userDtoSchema>;
export type SessionDto = z.infer<typeof sessionDtoSchema>;
export type ReviewDto = z.infer<typeof reviewDtoSchema>;
export type DisposalRecordDto = z.infer<typeof disposalRecordDtoSchema>;
export type EducationalContentDto = z.infer<typeof educationalContentDtoSchema>;
export type ApiReviewDto = z.infer<typeof apiReviewDtoSchema>;
export type ApiEducationalContentDto = z.infer<typeof apiEducationalContentDtoSchema>;
export type PlaceSuggestionDto = z.infer<typeof placeSuggestionDtoSchema>;
export type PlaceDetailsDto = z.infer<typeof placeDetailsDtoSchema>;

/**
 * Input types — the raw JSON as it arrives over the network (dates as strings).
 * This is the shape used by the demo data, ensuring the seed goes through
 * exactly the same validation as a real API response.
 */
export type CollectionPointDtoInput = z.input<typeof collectionPointDtoSchema>;
export type UserDtoInput = z.input<typeof userDtoSchema>;
export type ReviewDtoInput = z.input<typeof reviewDtoSchema>;
export type DisposalRecordDtoInput = z.input<typeof disposalRecordDtoSchema>;
export type EducationalContentDtoInput = z.input<typeof educationalContentDtoSchema>;
export type PlaceSuggestionDtoInput = z.input<typeof placeSuggestionDtoSchema>;
export type PlaceDetailsDtoInput = z.input<typeof placeDetailsDtoSchema>;
