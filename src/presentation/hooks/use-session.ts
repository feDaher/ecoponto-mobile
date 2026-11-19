import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import type { SignInCredentials, SignUpData } from '@/application/ports/auth.gateway';
import { logger } from '@/core/logger';

import { useUseCases } from '../providers/container-provider';
import { useSessionStore } from '../stores/session.store';
import { unwrap } from './result';

/**
 * Restores the persisted session once, at app boot.
 *
 * Until it resolves, `status` is `'loading'` — protected screens must wait
 * for that state before redirecting to sign-in, otherwise whoever was already
 * authenticated sees the sign-in screen flash on every launch.
 */
export function useRestoreSession(): void {
  const { restoreSession } = useUseCases();
  const setUser = useSessionStore((state) => state.setUser);

  useEffect(() => {
    let active = true;

    (async () => {
      const result = await restoreSession.execute();
      if (!active) return;

      if (result.ok) {
        setUser(result.value);
      } else {
        logger.warn('Falha ao restaurar sessão', { code: result.error.code });
        setUser(null);
      }
    })();

    return () => {
      active = false;
    };
  }, [restoreSession, setUser]);
}

export function useSignIn() {
  const { authenticateUser } = useUseCases();
  const setUser = useSessionStore((state) => state.setUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: SignInCredentials) =>
      unwrap(await authenticateUser.execute(credentials)),
    onSuccess: (user) => {
      setUser(user);
      // Session-dependent data (history, ranking) needs to reload.
      queryClient.invalidateQueries();
    },
  });
}

export function useSignUp() {
  const { registerUser } = useUseCases();
  const setUser = useSessionStore((state) => state.setUser);

  return useMutation({
    mutationFn: async (data: SignUpData) => unwrap(await registerUser.execute(data)),
    onSuccess: setUser,
  });
}

export function useSignOut() {
  const { endSession, unregisterPushToken } = useUseCases();
  const clear = useSessionStore((state) => state.clear);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Before ending the session (the request is authenticated): a signed-out
      // phone must stop receiving this user's notifications. A failure here
      // must not block sign-out.
      const removed = await unregisterPushToken.execute();
      if (!removed.ok) {
        logger.warn('Falha ao remover push token', { code: removed.error.code });
      }
      return unwrap(await endSession.execute());
    },
    onSuccess: () => {
      clear();
      // LGPD: no data from the previous user left in the cache.
      queryClient.clear();
    },
  });
}
