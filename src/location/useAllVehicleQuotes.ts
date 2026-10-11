import { useEffect, useRef, useState } from 'react';
import { quoteAllVehicles } from '@features/shipments/api/shipments.api';
import type { VehicleQuote } from '@features/shipments/types';
import { ApiError } from '@api/types';
import type { KnownCoords } from './useFareEstimate';

export interface AllVehicleQuotes {
    loading: boolean;
    quotes: VehicleQuote[];
    error: string | null;
}

const IDLE: AllVehicleQuotes = { loading: false, quotes: [], error: null };

// Porter-style "see every vehicle's real price at once" — one batched
// call (POST /shipments/quote-all-vehicles) instead of re-running
// useFareEstimate per vehicle type from the client. Mirrors
// useFareEstimate's debounce/cancellation shape (requestId guard against
// a stale response winning a race after pickup/drop change again).
export const useAllVehicleQuotes = (
    pickupCoords: KnownCoords | null,
    dropCoords: KnownCoords | null,
    serviceType: string,
    category?: string,
    helpersCount?: number,
    insuranceRequested?: boolean,
    loadingHelpRequested?: boolean,
    unloadingHelpRequested?: boolean,
    packagingRequested?: boolean,
): AllVehicleQuotes => {
    const [state, setState] = useState<AllVehicleQuotes>(IDLE);
    const requestId = useRef(0);

    useEffect(() => {
        if (!pickupCoords || !dropCoords) {
            setState(IDLE);
            return;
        }

        const currentRequest = ++requestId.current;
        setState(prev => ({ ...prev, loading: true, error: null }));

        const timer = setTimeout(() => {
            quoteAllVehicles({
                pickup: pickupCoords,
                drop: dropCoords,
                serviceType,
                category,
                helpersCount,
                insuranceRequested,
                loadingHelpRequested,
                unloadingHelpRequested,
                packagingRequested,
            })
                .then(quotes => {
                    if (currentRequest !== requestId.current) return;
                    setState({ loading: false, quotes, error: null });
                })
                .catch(err => {
                    if (currentRequest !== requestId.current) return;
                    const message = err instanceof ApiError ? err.message : 'Failed to load vehicle prices';
                    setState({ loading: false, quotes: [], error: message });
                });
        }, 300);

        return () => clearTimeout(timer);
    }, [
        pickupCoords?.lat,
        pickupCoords?.lng,
        dropCoords?.lat,
        dropCoords?.lng,
        serviceType,
        category,
        helpersCount,
        insuranceRequested,
        loadingHelpRequested,
        unloadingHelpRequested,
        packagingRequested,
    ]);

    return state;
};
