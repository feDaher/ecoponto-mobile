/**
 * Result<T, E> — explicit success/failure return.
 *
 * Project rule: use-cases and entities **do not throw exceptions** for expected
 * errors (validation, business rule, 404, offline). They return `Result`.
 * `throw` is reserved for programming bugs (broken invariants).
 *
 * This makes error handling part of the type — the presentation layer is
 * forced by the compiler to handle the failure before accessing the value.
 */

export type Ok<T> = { readonly ok: true; readonly value: T };
export type Err<E> = { readonly ok: false; readonly error: E };

export type Result<T, E> = Ok<T> | Err<E>;

export function ok(): Ok<void>;
export function ok<T>(value: T): Ok<T>;
export function ok<T>(value?: T): Ok<T | void> {
  return { ok: true, value: value as T };
}

export function err<E>(error: E): Err<E> {
  return { ok: false, error };
}

export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.ok;
}

export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return !result.ok;
}

/** Applies `fn` to the success value, preserving the failure. */
export function mapResult<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return result.ok ? ok(fn(result.value)) : result;
}

/** Chains operations that can also fail (flatMap). */
export function chainResult<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E> {
  return result.ok ? fn(result.value) : result;
}

/** Success value or a fallback — for paths where failure is tolerable. */
export function unwrapOr<T, E>(result: Result<T, E>, fallback: T): T {
  return result.ok ? result.value : fallback;
}

/**
 * Combines several `Result`s into one. Fails on the first error found.
 * Useful to validate multiple value objects when building an entity.
 */
export function combine<T extends readonly Result<unknown, E>[], E>(
  results: T,
): Result<{ [K in keyof T]: T[K] extends Result<infer V, E> ? V : never }, E> {
  const values: unknown[] = [];

  for (const result of results) {
    if (!result.ok) return result;
    values.push(result.value);
  }

  return ok(values as { [K in keyof T]: T[K] extends Result<infer V, E> ? V : never });
}
