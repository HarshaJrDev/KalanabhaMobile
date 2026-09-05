import { create } from 'zustand';

interface DeliveryOtpStore {
    // Non-null while the prompt is open. `resolve` is called with the
    // entered 4-digit code, or null if the driver cancels.
    open: boolean;
    resolve: ((otp: string | null) => void) | null;
}

// App-wide "ask the driver for the delivery OTP" prompt — mirrors
// toastStore's singleton pattern (reachable from a plain callback, not just
// a component), because completeDelivery is triggered from
// useDriverActions, not a component with local state. GlobalDeliveryOtpModal
// (mounted once in App.tsx) renders it; requestDeliveryOtp() below is what
// callers actually use.
export const useDeliveryOtpStore = create<DeliveryOtpStore>(() => ({
    open: false,
    resolve: null,
}));

// Returns the entered code, or null if the driver dismissed the prompt.
export const requestDeliveryOtp = (): Promise<string | null> =>
    new Promise((resolve) => {
        useDeliveryOtpStore.setState({ open: true, resolve });
    });
