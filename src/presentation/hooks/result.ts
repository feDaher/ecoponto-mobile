import { toAppError, type AppError } from '@/core/errors';
import type { Result } from '@/core/result';

/**
 * Bridge between `Result` (application) and React Query (presentation).
 *
 * React Query signals failure through exceptions. Converting here, at the edge,
 * keeps the domain and the use cases free of `throw` and concentrates the
 * translation in a single place — the UI still receives a typed `AppError` in `query.error`.
 */
export function unwrap<T>(result: Result<T, AppError>): T {
  if (!result.ok) throw result.error;
  return result.value;
}

/** Display-ready message from any caught error. */
export function getErrorMessage(error: unknown): string {
  return toAppError(error).message;
}
