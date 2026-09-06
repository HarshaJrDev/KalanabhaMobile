import { create } from 'zustand';

export type OtpPromptKind = 'pickup' | 'delivery';

interface DeliveryOtpStore {
    // Non-null while the prompt is open. `resolve` is called with the
    // entered 4-digit code, or null if the driver cancels.
    open: boolean;
    kind: OtpPromptKind;
    resolve: ((otp: string | null) => void) | null;
}

// App-wide "ask the driver for the pickup/delivery OTP" prompt — mirrors
// toastStore's singleton pattern (reachable from a plain callback, not just
// a component), because both onStartDelivery and onCompleteDelivery are
// triggered from useDriverActions, not a component with local state.
// GlobalDeliveryOtpModal (mounted once in App.tsx) renders it;
// requestOtp() below is what callers actually use. One shared prompt for
// both real OTPs (kalanabhaBackend Shipment.pickupOtp/deliveryOtp) rather
// than two near-identical modals.
export const useDeliveryOtpStore = create<DeliveryOtpStore>(() => ({
    open: false,
    kind: 'delivery',
    resolve: null,
}));

// Returns the entered code, or null if the driver dismissed the prompt.
export const requestOtp = (kind: OtpPromptKind): Promise<string | null> =>
    new Promise((resolve) => {
        useDeliveryOtpStore.setState({ open: true, kind, resolve });
    });

// Back-compat alias — existing callers of the delivery flow.
export const requestDeliveryOtp = () => requestOtp('delivery');
