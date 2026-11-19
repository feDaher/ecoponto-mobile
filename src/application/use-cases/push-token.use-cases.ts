import type { AppError } from '@/core/errors';
import { ok, type Result } from '@/core/result';

import type { NotificationGateway } from '../ports/notification.gateway';
import type { PushTokenRepository } from '../ports/push-token.repository';
import type { NoInputUseCase } from './use-case';

/**
 * Asks for permission, gets the Expo Push Token and saves it for the current
 * user. Returns `null` when push is unavailable (Expo Go Android, emulator,
 * permission denied, no EAS project id) — an expected state, not an error.
 */
export class RegisterPushTokenUseCase implements NoInputUseCase<string | null> {
  private current: string | null = null;

  constructor(
    private readonly notifications: NotificationGateway,
    private readonly tokens: PushTokenRepository,
  ) {}

  /** Last token saved in this app session; used to remove it on sign-out. */
  get currentToken(): string | null {
    return this.current;
  }

  async execute(): Promise<Result<string | null, AppError>> {
    const device = await this.notifications.registerDevice();
    if (!device.ok) return device;

    const token = device.value;
    if (!token) return ok(null);

    const saved = await this.tokens.register(token);
    if (!saved.ok) return saved;

    this.current = token;
    return ok(token);
  }

  /** Called after the token was removed from the backend. */
  forget(): void {
    this.current = null;
  }
}

/**
 * Removes this device's token from the user's account, so a signed-out phone
 * stops receiving their notifications (LGPD). Must run **before** ending the
 * session: the request is authenticated.
 */
export class UnregisterPushTokenUseCase implements NoInputUseCase<void> {
  constructor(
    private readonly registration: RegisterPushTokenUseCase,
    private readonly tokens: PushTokenRepository,
  ) {}

  async execute(): Promise<Result<void, AppError>> {
    const token = this.registration.currentToken;
    if (!token) return ok();

    const removed = await this.tokens.unregister(token);
    if (removed.ok) this.registration.forget();
    return removed;
  }
}
