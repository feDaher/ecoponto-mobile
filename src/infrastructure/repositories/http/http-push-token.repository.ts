import { Platform } from 'react-native';

import type { PushTokenRepository } from '@/application/ports/push-token.repository';
import type { AppError } from '@/core/errors';
import { logger } from '@/core/logger';
import { ok, type Result } from '@/core/result';

import type { HttpClient } from '../../http/http-client';

/**
 * Push tokens via API (FE-12).
 *   POST   /users/me/push-tokens          body `{ token, platform }` (authenticated)
 *   DELETE /users/me/push-tokens/:token                               (authenticated)
 *
 * The routes belong to a separate backend task. Until they exist the API
 * answers 404: that is logged and treated as success, so sign-in and sign-out
 * never fail because of push.
 */
export class HttpPushTokenRepository implements PushTokenRepository {
  constructor(private readonly http: HttpClient) {}

  async register(token: string): Promise<Result<void, AppError>> {
    const response = await this.http.request({
      path: '/users/me/push-tokens',
      method: 'POST',
      authenticated: true,
      body: { token, platform: Platform.OS },
    });

    return this.tolerateMissingRoute(response, 'registrar');
  }

  async unregister(token: string): Promise<Result<void, AppError>> {
    const response = await this.http.request({
      path: `/users/me/push-tokens/${encodeURIComponent(token)}`,
      method: 'DELETE',
      authenticated: true,
    });

    return this.tolerateMissingRoute(response, 'remover');
  }

  private tolerateMissingRoute(
    response: Result<unknown, AppError>,
    action: string,
  ): Result<void, AppError> {
    if (response.ok) return ok();
    if (response.error.code === 'NOT_FOUND') {
      logger.info(`API ainda não tem a rota para ${action} o push token (task de backend).`);
      return ok();
    }
    return response;
  }
}
