import type { ZodType } from 'zod';

import {
  ContractMismatchError,
  ForbiddenError,
  NetworkError,
  NotFoundError,
  ServerError,
  TimeoutError,
  UnauthenticatedError,
  ValidationError,
  type AppError,
} from '@/core/errors';
import { err, ok, type Result } from '@/core/result';
import { logger } from '@/core/logger';

export type TokenProvider = () => Promise<string | null>;

export type HttpRequest<T> = {
  readonly path: string;
  readonly method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  readonly body?: unknown;
  readonly query?: Record<string, string | number | boolean | undefined | null>;
  /** Response body schema. Without it, the response is ignored. */
  readonly schema?: ZodType<T>;
  /** Sends `Authorization: Bearer <jwt>` (section 8.1). */
  readonly authenticated?: boolean;
  readonly timeoutMs?: number;
};

/**
 * HTTP client for the EcoPonto REST API.
 *
 * Three guarantees that justify not using `fetch` directly in the repositories:
 *  1. **timeout** — RN does not abort requests on its own; without this the
 *     screen hangs indefinitely on a bad network (NFR of response < 2s, RN07);
 *  2. **validated contract** — the response goes through Zod before becoming
 *     domain, so a silent API change becomes a handled error, not `undefined` in the UI;
 *  3. **normalized errors** — the HTTP status becomes an `AppError` with a pt-BR message.
 */
export class HttpClient {
  constructor(
    private readonly baseUrl: string,
    private readonly defaultTimeoutMs: number,
    private readonly getToken: TokenProvider,
  ) {}

  async request<T>(config: HttpRequest<T>): Promise<Result<T, AppError>> {
    const { path, method = 'GET', body, query, schema, authenticated, timeoutMs } = config;

    const url = this.buildUrl(path, query);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs ?? this.defaultTimeoutMs);

    try {
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (body !== undefined) headers['Content-Type'] = 'application/json';

      if (authenticated) {
        const token = await this.getToken();
        if (token) headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        return err(await mapHttpError(response, path));
      }

      if (!schema) return ok(undefined as T);

      const json = await response.json().catch(() => undefined);
      const parsed = schema.safeParse(json);

      if (!parsed.success) {
        logger.error('Resposta fora do contrato', { path, issues: parsed.error.issues });
        return err(new ContractMismatchError(parsed.error));
      }

      return ok(parsed.data);
    } catch (cause) {
      if (cause instanceof Error && cause.name === 'AbortError') {
        logger.warn('Requisição expirou', { path });
        return err(new TimeoutError(cause));
      }

      logger.error('Falha de rede', { path, cause: String(cause) });
      return err(new NetworkError(cause));
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildUrl(path: string, query?: HttpRequest<unknown>['query']): string {
    const base = this.baseUrl.replace(/\/+$/, '');
    const route = path.startsWith('/') ? path : `/${path}`;

    if (!query) return `${base}${route}`;

    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue;
      params.append(key, String(value));
    }

    const queryString = params.toString();
    return queryString ? `${base}${route}?${queryString}` : `${base}${route}`;
  }
}

async function mapHttpError(response: Response, resource: string): Promise<AppError> {
  const body = await response.text().catch(() => '');

  switch (response.status) {
    case 400:
    case 422:
      return new ValidationError(extractMessage(body) ?? 'Dados inválidos.', body);
    case 401:
      return new UnauthenticatedError();
    case 403:
      return new ForbiddenError();
    case 404:
      return new NotFoundError(resource);
    case 408:
      return new TimeoutError(body);
    default:
      return new ServerError(response.status, body);
  }
}

/** Reuses the API message when it comes as `{ message }` or `{ error }`. */
function extractMessage(body: string): string | null {
  try {
    const json = JSON.parse(body) as { message?: unknown; error?: unknown };
    const message = json.message ?? json.error;
    return typeof message === 'string' && message.trim() ? message : null;
  } catch {
    return null;
  }
}
