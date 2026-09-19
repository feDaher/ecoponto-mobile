import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

/**
 * Remote data cache.
 *
 * Decisions that matter for this app:
 *  - `retry: 1` — the citizen is out on the street, with an unstable network;
 *    one extra attempt helps, four only increase the wait;
 *  - 2 min `staleTime` — collection points change slowly; avoids refetching on
 *    every screen focus and helps the response < 2s NFR (RN07);
 *  - errors are **not** thrown: the use cases already return `Result`, and the
 *    `queryFn` only rejects when there is a real failure to display.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 2 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
            refetchOnWindowFocus: false,
          },
          mutations: { retry: 0 },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
