import { z } from 'zod';

const optionalString = z
  .string()
  .trim()
  .min(1)
  .optional()
  .catch(undefined)
  .transform((value) => (value === '' ? undefined : value));

const envSchema = z.object({
  apiUrl: z.url().optional().catch(undefined),
  apiTimeoutMs: z.coerce.number().int().positive().catch(8000),
  googleMapsApiKey: optionalString,
  firebaseApiKey: optionalString,
  firebaseAuthDomain: optionalString,
  firebaseProjectId: optionalString,
  firebaseAppId: optionalString,
});

const parsed = envSchema.parse({
  apiUrl: process.env.EXPO_PUBLIC_API_URL,
  apiTimeoutMs: process.env.EXPO_PUBLIC_API_TIMEOUT_MS,
  googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
  firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
});

const hasFirebase = Boolean(
  parsed.firebaseApiKey && parsed.firebaseAuthDomain && parsed.firebaseProjectId,
);

export const env = {
  ...parsed,
  isDev: __DEV__,

  /**
   * Without `EXPO_PUBLIC_API_URL` the app boots with in-memory repositories
   * (Manhuaçu–MG seed). This is what allows running on Expo Go with no backend up.
   */
  dataSource: parsed.apiUrl ? ('http' as const) : ('in-memory' as const),

  /**
   * The Firebase adapter depends on the API to read the user profile
   * (`role`, city and points live in MySQL, not in Firebase Auth).
   * Without both, we fall back to the local adapter with demo accounts.
   */
  authProvider: hasFirebase && parsed.apiUrl ? ('firebase' as const) : ('in-memory' as const),
} as const;

export type Env = typeof env;
