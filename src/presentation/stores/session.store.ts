import { create } from 'zustand';

import type { User } from '@/domain/entities/user';
import { canPerform, type Permission } from '@/domain/value-objects/user-role';

export type SessionStatus = 'loading' | 'guest' | 'authenticated';

type SessionStore = {
  user: User | null;
  status: SessionStatus;
  setUser: (user: User | null) => void;
  clear: () => void;
};

/**
 * Session state — stores only the current user.
 *
 * The store is deliberately dumb: sign-in/sign-out is executed by the use
 * cases (via `use-session`). This way the authentication rule does not spread
 * across UI state, and RB02 remains decided by the domain.
 */
export const useSessionStore = create<SessionStore>((set) => ({
  user: null,
  status: 'loading',
  setUser: (user) => set({ user, status: user ? 'authenticated' : 'guest' }),
  clear: () => set({ user: null, status: 'guest' }),
}));

export const useUser = () => useSessionStore((state) => state.user);
export const useSessionStatus = () => useSessionStore((state) => state.status);
export const useIsAuthenticated = () => useSessionStore((state) => state.user !== null);

/** RB02 — permission query used to show/hide actions in the UI. */
export function usePermission(permission: Permission): boolean {
  return useSessionStore((state) => canPerform(state.user?.role ?? null, permission));
}
