import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { CollectionPoint } from '@/domain/entities/collection-point';
import type { Coordinate } from '@/domain/value-objects/coordinate';
import type { WasteCategoryId } from '@/domain/value-objects/waste-category';

import { useUseCases } from '../providers/container-provider';
import { useSessionStore } from '../stores/session.store';
import { queryKeys } from './query-keys';
import { unwrap } from './result';

/** RB11 — opens the route in Google Maps. */
export function usePlotRoute(origin: Coordinate | null) {
  const { plotRoute } = useUseCases();

  return useMutation({
    mutationFn: async (point: CollectionPoint) =>
      unwrap(await plotRoute.execute({ point, origin })),
  });
}

/** RB08 — opens the chat with the person responsible on WhatsApp. */
export function useContactWhatsApp() {
  const { contactWhatsApp } = useUseCases();

  return useMutation({
    mutationFn: async (point: CollectionPoint) => unwrap(await contactWhatsApp.execute({ point })),
  });
}

/** RB09 — registers the disposal and updates the user's points balance. */
export function useRegisterDisposal() {
  const { registerDisposal } = useUseCases();
  const queryClient = useQueryClient();
  const user = useSessionStore((state) => state.user);
  const setUser = useSessionStore((state) => state.setUser);

  return useMutation({
    mutationFn: async (input: {
      collectionPointId: string;
      category: WasteCategoryId;
      weightKg: number;
    }) => unwrap(await registerDisposal.execute({ user, ...input })),

    onSuccess: (output) => {
      // The displayed balance comes from the server; here we only mirror the computed total.
      if (user) {
        const updated = user.withPoints(output.totalPoints);
        if (updated.ok) setUser(updated.value);
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.points.all });
      if (user) {
        queryClient.invalidateQueries({ queryKey: queryKeys.disposals.mine(user.id) });
      }
      queryClient.invalidateQueries({ queryKey: ['ranking'] });
    },
  });
}

/** RB12 — publishes a review and reloads the point's page. */
export function useReviewPoint(collectionPointId: string) {
  const { reviewPoint } = useUseCases();
  const queryClient = useQueryClient();
  const user = useSessionStore((state) => state.user);

  return useMutation({
    mutationFn: async (input: { rating: number; comment?: string }) =>
      unwrap(await reviewPoint.execute({ user, collectionPointId, ...input })),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.points.details(collectionPointId) });
    },
  });
}
