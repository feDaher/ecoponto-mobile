import type { AppError } from '@/core/errors';
import type { Result } from '@/core/result';

/** What the app needs from a received/tapped notification — free of Expo types. */
export type IncomingNotification = {
  readonly title: string | null;
  readonly body: string | null;
  /** Raw `data` payload; validated by whoever uses it (it comes from outside). */
  readonly data: Record<string, unknown>;
};

/** Removes a listener. Safe to call more than once. */
export type Unsubscribe = () => void;

/**
 * Push notifications (Expo Push API — section 6.6 of the specification, FE-12).
 *
 * Known Expo Go limitation: **remote** push is not supported on Expo Go
 * for Android since SDK 53 — `registerDevice` returns `null` in that
 * scenario, the listeners are no-ops and the app keeps working.
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

  /**
   * With the app in the foreground the OS banner is suppressed: the app shows
   * its own toast through `onReceived` instead.
   */
  configureForegroundPresentation(): void;

  /** Notification arrived while the app is in the foreground. */
  onReceived(listener: (notification: IncomingNotification) => void): Unsubscribe;

  /** User tapped a notification while the app was running (foreground or background). */
  onTapped(listener: (notification: IncomingNotification) => void): Unsubscribe;

  /**
   * Notification tapped to launch the app from the closed state (cold start).
   * Returned once: it is cleared so a later remount doesn't navigate again.
   */
  consumeLaunchNotification(): Promise<IncomingNotification | null>;

  /** The native push token rotated — the Expo token must be registered again. */
  onTokenRefresh(listener: () => void): Unsubscribe;
}
