import { create } from 'zustand';

import { createId } from '@/core/id';

export type ToastType = 'success' | 'warning' | 'danger' | 'info';

export type ToastInput = {
  type?: ToastType;
  /** Bold first line. Optional: without it the card shows only the message. */
  title?: string;
  message: string;
  /** Auto-dismiss delay; `0` keeps the toast until the user closes it. */
  durationMs?: number;
  /** Tapping the card runs this and closes the toast (e.g. open the related screen). */
  onPress?: () => void;
};

export type Toast = Required<Pick<ToastInput, 'type' | 'message' | 'durationMs'>> &
  Pick<ToastInput, 'title' | 'onPress'> & { readonly id: string };

/** More than this and the oldest leaves — a wall of toasts covers the screen. */
export const MAX_VISIBLE_TOASTS = 3;
export const DEFAULT_TOAST_DURATION_MS = 4000;

type ToastStore = {
  toasts: Toast[];
  show: (input: ToastInput) => string;
  dismiss: (id: string) => void;
  clear: () => void;
};

/**
 * In-app toast queue.
 *
 * Lives outside React so non-component code (notification listeners, mutation
 * callbacks) can raise a toast with `useToastStore.getState().show(...)`.
 * The timer lives in the card, not here, so a toast being animated out is never
 * removed twice.
 */
export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  show: (input) => {
    const toast: Toast = {
      id: createId('toast'),
      type: input.type ?? 'info',
      title: input.title,
      message: input.message,
      durationMs: input.durationMs ?? DEFAULT_TOAST_DURATION_MS,
      onPress: input.onPress,
    };
    set((state) => ({ toasts: [...state.toasts, toast].slice(-MAX_VISIBLE_TOASTS) }));
    return toast.id;
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

/** `const toast = useToast(); toast.show({ type: 'success', message: '...' })`. */
export function useToast() {
  const show = useToastStore((state) => state.show);
  const dismiss = useToastStore((state) => state.dismiss);
  return { show, dismiss };
}
