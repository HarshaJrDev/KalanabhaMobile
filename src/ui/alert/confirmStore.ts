import { create } from 'zustand';

interface ConfirmOptions {
    title: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    destructive?: boolean;
}

interface ConfirmStore extends ConfirmOptions {
    open: boolean;
    resolve: ((confirmed: boolean) => void) | null;
}







export const useConfirmStore = create<ConfirmStore>(() => ({
    open: false,
    title: '',
    message: undefined,
    confirmText: undefined,
    cancelText: undefined,
    destructive: false,
    resolve: null,
}));

export const confirmDialog = (options: ConfirmOptions): Promise<boolean> =>
    new Promise((resolve) => {
        useConfirmStore.setState({ ...options, open: true, resolve });
    });
