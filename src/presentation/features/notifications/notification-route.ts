import type { Href } from 'expo-router';
import { z } from 'zod';

/**
 * Push payload → app screen (FE-12, acceptance criterion 2).
 *
 * Contract the backend sends in `data` (Expo Push API):
 *   { "type": "pickup" | "promotion" | "news", "url"?: "/point/12", "pointId"?: "12" }
 *
 * `url` wins when it is on the allowlist. A payload is outside data, so a route
 * that is not listed here is ignored — a push must not be able to open any
 * screen (sign-up, sitemap…) or an external link.
 */
export const NOTIFICATION_TYPES = ['pickup', 'promotion', 'news'] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

const APP_SCHEME = 'ecopontomobile://';
const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

const payloadSchema = z.object({
  type: z.enum(NOTIFICATION_TYPES).optional().catch(undefined),
  url: z.string().trim().optional().catch(undefined),
  pointId: z.union([z.string(), z.number()]).transform(String).optional().catch(undefined),
});

// `/` is the splash screen (`app/index.tsx`): the map tab lives at `/home`.
const HOME: Href = '/home';

const STATIC_ROUTES: Record<string, Href> = {
  // Backends naturally send `/` for "open the app"; it means the map, not the splash.
  '/': HOME,
  '/home': HOME,
  '/education': '/education',
  '/ranking': '/ranking',
  '/profile': '/profile',
};

function pointRoute(id: string): Href | null {
  return ID_PATTERN.test(id) ? { pathname: '/point/[id]', params: { id } } : null;
}

/** Allowlisted route for a `url`, or `null`. Accepts `/path` and `ecopontomobile://path`. */
function routeFromUrl(raw: string): Href | null {
  let path = raw.startsWith(APP_SCHEME) ? `/${raw.slice(APP_SCHEME.length)}` : raw;
  // Query and hash are not used by any allowlisted screen.
  path = path.split(/[?#]/, 1)[0] ?? '';
  if (path.length > 1) path = path.replace(/\/+$/, '');

  const staticRoute = STATIC_ROUTES[path];
  if (staticRoute) return staticRoute;

  const point = /^\/point\/([^/]+)$/.exec(path);
  return point?.[1] ? pointRoute(point[1]) : null;
}

/** Default screen for each type when the payload has no usable `url`. */
function routeFromType(type: NotificationType | undefined, pointId?: string): Href | null {
  switch (type) {
    case 'pickup':
      return (pointId && pointRoute(pointId)) || HOME;
    case 'news':
      return '/education';
    case 'promotion':
      return '/profile';
    default:
      return null;
  }
}

/** Screen to open when the user taps a notification. Never throws; falls back to Home. */
export function resolveNotificationRoute(data: unknown): Href {
  const parsed = payloadSchema.safeParse(data ?? {});
  if (!parsed.success) return HOME;

  const { type, url, pointId } = parsed.data;
  return (url && routeFromUrl(url)) || routeFromType(type, pointId) || HOME;
}
