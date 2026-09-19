import type { AppError } from '@/core/errors';
import type { Result } from '@/core/result';

/**
 * Push notifications (Expo Push API — section 6.6 of the specification).
 *
 * Known Expo Go limitation: **remote** push is not supported on Expo Go
 * for Android since SDK 53 — `registerDevice` returns `null` in that
 * scenario and the app keeps working. Local notifications work normally.
 * For real remote push, create a development build (EAS Build).
 */
export interface NotificationGateway {
  /** Expo Push Token, or `null` when unavailable in the current environment. */
  registerDevice(): Promise<Result<string | null, AppError>>;

  scheduleLocal(params: {
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }): Promise<Result<void, AppError>>;
}
