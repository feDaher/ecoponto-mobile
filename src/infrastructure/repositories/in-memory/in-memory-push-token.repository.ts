import type { PushTokenRepository } from '@/application/ports/push-token.repository';
import type { AppError } from '@/core/errors';
import { logger } from '@/core/logger';
import { ok, type Result } from '@/core/result';

import { simulateLatency } from './latency';

/**
 * Demo mode: keeps the tokens in memory and logs them, so the token can be
 * copied from the Metro log and used to send a test push
 * (https://expo.dev/notifications) without a backend.
 */
export class InMemoryPushTokenRepository implements PushTokenRepository {
  private readonly tokens = new Set<string>();

  async register(token: string): Promise<Result<void, AppError>> {
    await simulateLatency();
    this.tokens.add(token);
    // A push token is not personal data (LGPD); it only addresses this device.
    logger.info('Expo Push Token registrado (modo demo)', { token });
    return ok();
  }

  async unregister(token: string): Promise<Result<void, AppError>> {
    await simulateLatency();
    this.tokens.delete(token);
    return ok();
  }
}
