import { z } from 'zod';

import { APPROVAL_STATUSES } from '@/domain/entities/collection-point';
import { REVIEW_STATUSES } from '@/domain/entities/review';
import { USER_ROLES } from '@/domain/value-objects/user-role';

/**
 * REST API contracts (section 4.3.1 of the specification).
 *
 * Field names are in English and map to the ERD entities (`PONTO_COLETA`,
 * `USUARIO`, `AVALIACAO`, …). Conversion into domain entities happens in the
 * mappers — no DTO crosses into the application layer.
 *
 * The backend does not exist yet; these schemas are the executable
 * specification of what the app expects. Any divergence becomes a visible
 * `ContractMismatchError` in development, instead of a silent `undefined` on screen.
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
});

export const rankingEntryDtoSchema = z.object({
  userId: idSchema,
  name: z.string(),
  city: z.string(),
  points: z.number().int(),
  position: z.number().int(),
});

export const educationalContentDtoSchema = z.object({
  id: idSchema,
  title: z.string(),
  summary: z.string(),
  categoryId: z.string(),
  howToDispose: z.array(z.string()).default([]),
  whyRecycle: z.string(),
  environmentalImpact: z.string(),
  publishedAt: dateSchema,
});

export const pointListSchema = z.array(collectionPointDtoSchema);
export const reviewListSchema = z.array(reviewDtoSchema);
export const disposalListSchema = z.array(disposalRecordDtoSchema);
export const rankingListSchema = z.array(rankingEntryDtoSchema);
export const contentListSchema = z.array(educationalContentDtoSchema);
export const countSchema = z.object({ total: z.number().int() });

/** Output types — already normalized (dates as `Date`, ids as `string`). */
export type CollectionPointDto = z.infer<typeof collectionPointDtoSchema>;
export type UserDto = z.infer<typeof userDtoSchema>;
export type SessionDto = z.infer<typeof sessionDtoSchema>;
export type ReviewDto = z.infer<typeof reviewDtoSchema>;
export type DisposalRecordDto = z.infer<typeof disposalRecordDtoSchema>;
export type EducationalContentDto = z.infer<typeof educationalContentDtoSchema>;

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
