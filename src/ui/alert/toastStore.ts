import { create } from 'zustand';
import type { AlertType } from './useAlert';
import { hapticSuccess, hapticError } from '@utils/haptics';

export interface ToastState {
  id: number;
  message: string;
  type: AlertType;
}

interface ToastStore {
  toast: ToastState | null;
  show: (message: string, type?: AlertType) => void;
  clear: () => void;
}

let nextId = 0;

// App-wide toast — unlike the local `useAlert`/`AlertBanner` pair (meant for
// an inline, persistent banner inside one screen's form), this is reachable
// from anywhere, including outside React (e.g. the axios interceptor
// reporting a network/server error), via `showToast(...)` below.
export const useToastStore = create<ToastStore>(set => ({
  toast: null,
  show: (message, type = 'error') =>
    set({ toast: { id: ++nextId, message, type } }),
  clear: () => set({ toast: null }),
}));

export const showToast = (message: string, type: AlertType = 'error') => {
  // Real haptic feedback, not just visual — 'info' intentionally gets
  // none (e.g. the notification-poll-driven toasts shouldn't buzz the
  // device for something passive the user didn't just do).
  if (type === 'success') hapticSuccess();
  if (type === 'error') hapticError();
  useToastStore.getState().show(message, type);
};
