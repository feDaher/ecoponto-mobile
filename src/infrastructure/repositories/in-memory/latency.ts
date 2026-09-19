/**
 * Simulated latency for the in-memory repositories.
 *
 * Without it, every loading state renders in 0ms and skeleton, race condition
 * and refetch bugs only show up when the real API goes live.
 */
export const SIMULATED_LATENCY_MS = 180;

export function simulateLatency(ms: number = SIMULATED_LATENCY_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
