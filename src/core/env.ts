import { z } from 'zod';

const envSchema = z.object({
  apiUrl: z.url().optional().catch(undefined),
  apiTimeoutMs: z.coerce.number().int().positive().catch(8000),
});

const parsed = envSchema.parse({
  apiUrl: process.env.EXPO_PUBLIC_API_URL,
  apiTimeoutMs: process.env.EXPO_PUBLIC_API_TIMEOUT_MS,
});

export const env = {
  ...parsed,
  isDev: __DEV__,

  /**
   * Without `EXPO_PUBLIC_API_URL` the app boots with in-memory repositories
   * (Manhuaçu–MG seed). This is what allows running on Expo Go with no backend up.
   */
  dataSource: parsed.apiUrl ? ('http' as const) : ('in-memory' as const),

  /**
   * With the API, sign-in goes through it (`/auth/*`): ecoponto-api holds the
   * Firebase credentials, so the app needs no Firebase key. Without it, the
   * local adapter with the demo accounts.
   */
  authProvider: parsed.apiUrl ? ('http' as const) : ('in-memory' as const),
} as const;

export type Env = typeof env;
