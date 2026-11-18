import type { AppError } from '@/core/errors';
import type { Result } from '@/core/result';

/**
 * Where the device's Expo Push Token is stored, tied to the signed-in user, so
 * the backend knows which devices to notify (pickup, promotions, news — FE-12).
 *
 * Proposed backend contract (separate BE task; not implemented in the API yet):
 *   POST   /users/me/push-tokens          body `{ token, platform }`  (authenticated)
 *   DELETE /users/me/push-tokens/:token                                (authenticated)
 */
export interface PushTokenRepository {
  register(token: string): Promise<Result<void, AppError>>;
  unregister(token: string): Promise<Result<void, AppError>>;
}
