import type { AppError } from '@/core/errors';
import { err, ok, type Result } from '@/core/result';

import type { NotificationGateway } from '../ports/notification.gateway';
import type { PushTokenRepository } from '../ports/push-token.repository';
import type { NoInputUseCase } from './use-case';

/**
 * Asks for permission, gets the Expo Push Token and saves it for the current
 * user. Returns `null` when push is unavailable (Expo Go Android, emulator,
 * permission denied, no EAS project id) — an expected state, not an error.
 */
export class RegisterPushTokenUseCase implements NoInputUseCase<string | null> {
  private readonly registeredTokens = new Set<string>();

  constructor(
    private readonly notifications: NotificationGateway,
    private readonly tokens: PushTokenRepository,
  ) {}

  /** Tokens saved during this app session, including tokens rotated by the OS. */
  get currentTokens(): readonly string[] {
    return [...this.registeredTokens];
  }

  async execute(): Promise<Result<string | null, AppError>> {
    const device = await this.notifications.registerDevice();
    if (!device.ok) return device;

    const token = device.value;
    if (!token) return ok(null);

    const saved = await this.tokens.register(token);
    if (!saved.ok) return saved;

    this.registeredTokens.add(token);
    return ok(token);
  }

  /** Called after a token was removed from the backend. */
  forget(token: string): void {
    this.registeredTokens.delete(token);
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
    const tokens = this.registration.currentTokens;
    if (tokens.length === 0) return ok();

    let firstError: AppError | null = null;
    for (const token of tokens) {
      const removed = await this.tokens.unregister(token);
      if (removed.ok) {
        this.registration.forget(token);
      } else {
        firstError ??= removed.error;
      }
    }

    return firstError ? err(firstError) : ok();
  }
}
