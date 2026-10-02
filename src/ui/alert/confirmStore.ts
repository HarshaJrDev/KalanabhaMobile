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

// Same singleton pattern as deliveryOtpStore/deliveryCompletionStore —
// every destructive/confirm dialog in the app (logout, delete address,
// cancel shipment, etc.) was previously a one-off `Alert.alert` per
// screen, with the OS's own default styling instead of this app's own
// (and inconsistent copy/button ordering screen to screen). This gives
// every screen one real, themed confirm dialog instead.
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
