import { create } from 'zustand';

interface DeliveryCompletionStore {
    open: boolean;
    shipmentId: string | null;
    resolve: ((completed: boolean) => void) | null;
}

// Same singleton pattern as deliveryOtpStore — the Delivery Completion
// Sheet is triggered from plain callbacks (LogisticsCardList's
// useDriverActions, HomeScreen's Active Delivery card) rather than always
// being local component state, and only one can be open at a time.
export const useDeliveryCompletionStore = create<DeliveryCompletionStore>(() => ({
    open: false,
    shipmentId: null,
    resolve: null,
}));

// Returns true once the shipment was actually completed server-side,
// false if the driver dismissed the sheet without finishing.
export const requestCompleteDelivery = (shipmentId: string): Promise<boolean> =>
    new Promise((resolve) => {
        useDeliveryCompletionStore.setState({ open: true, shipmentId, resolve });
    });
