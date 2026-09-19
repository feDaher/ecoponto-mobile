/**
 * Client-side identifier generation.
 *
 * Used only for records created offline/optimistically. The definitive
 * identifier is always the one returned by the backend (the ERD uses `int` autoincrement).
 */
export function createId(prefix = 'loc'): string {
  const cryptoRef = globalThis.crypto as { randomUUID?: () => string } | undefined;

  if (typeof cryptoRef?.randomUUID === 'function') {
    return `${prefix}_${cryptoRef.randomUUID()}`;
  }

  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}${random}`;
}
