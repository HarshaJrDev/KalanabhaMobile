import { useMyShipments } from '../features/shipments/hooks';

/**
 * @deprecated Prefer `useMyShipments` from features/shipments/hooks directly
 * (it exposes the full TanStack Query result: refetch, isFetching, etc).
 * Kept for existing call sites expecting `{ data, loading, error }`.
 *
 * Was a Firestore onSnapshot listener on `shipments` where status in
 * [searching, accepted, in_transit] — now GET /shipments/mine, polled
 * (see features/shipments/hooks.ts for why: no shipment-list push channel).
 */
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
