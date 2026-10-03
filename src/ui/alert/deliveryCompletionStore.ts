import { create } from 'zustand';

interface DeliveryCompletionStore {
    open: boolean;
    shipmentId: string | null;
    resolve: ((completed: boolean) => void) | null;
}





export const useDeliveryCompletionStore = create<DeliveryCompletionStore>(() => ({
    open: false,
    shipmentId: null,
    resolve: null,
}));



export const requestCompleteDelivery = (shipmentId: string): Promise<boolean> =>
    new Promise((resolve) => {
        useDeliveryCompletionStore.setState({ open: true, shipmentId, resolve });
    });
