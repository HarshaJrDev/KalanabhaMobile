import { useMyShipments } from '@features/shipments/hooks';

export const useShipments = (): {
    data: import('./types').Shipment[];
    loading: boolean;
    error: string | null;
} => {
    const { data, isLoading, error } = useMyShipments();

    return {
        data: data ?? [],
        loading: isLoading,
        error: error ? error.message : null,
    };
};
