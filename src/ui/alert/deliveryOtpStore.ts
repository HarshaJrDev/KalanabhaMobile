import { create } from 'zustand';

export type OtpPromptKind = 'pickup' | 'delivery';

interface DeliveryOtpStore {
    
    
    open: boolean;
    kind: OtpPromptKind;
    resolve: ((otp: string | null) => void) | null;
}









export const useDeliveryOtpStore = create<DeliveryOtpStore>(() => ({
    open: false,
    kind: 'delivery',
    resolve: null,
}));


export const requestOtp = (kind: OtpPromptKind): Promise<string | null> =>
    new Promise((resolve) => {
        useDeliveryOtpStore.setState({ open: true, kind, resolve });
    });


export const requestDeliveryOtp = () => requestOtp('delivery');
