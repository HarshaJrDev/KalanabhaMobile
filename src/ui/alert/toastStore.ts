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





export const useToastStore = create<ToastStore>(set => ({
  toast: null,
  show: (message, type = 'error') =>
    set({ toast: { id: ++nextId, message, type } }),
  clear: () => set({ toast: null }),
}));

export const showToast = (message: string, type: AlertType = 'error') => {
  
  
  
  if (type === 'success') hapticSuccess();
  if (type === 'error') hapticError();
  useToastStore.getState().show(message, type);
};
