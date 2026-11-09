import { useEffect, useState } from 'react';

/**
 * `value`, but only after it stops changing for `delayMs`.
 *
 * Used for typed search: the field updates on every keystroke, the query only
 * when the user pauses — one request per word instead of one per letter.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
