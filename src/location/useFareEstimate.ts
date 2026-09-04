import { useEffect, useRef, useState } from 'react';
import { forwardGeocode } from '../services/location';
import { quoteShipment } from '@features/shipments/api/shipments.api';
import { ApiError } from '@api/types';

export interface FareEstimate {
    loading: boolean;
    price: number | null;
    distanceKm: number | null;
    pickup: { lat: number; lng: number } | null;
    drop: { lat: number; lng: number } | null;
    error: string | null;
    helperCost: number | null;
}

const IDLE: FareEstimate = { loading: false, price: null, distanceKm: null, pickup: null, drop: null, error: null, helperCost: null };

export interface KnownCoords {
    lat: number;
    lng: number;
}

// Real, distance-based fare estimate (Rapido-style "see price before you
// book"). Geocodes the typed pickup/drop addresses (via Nominatim) unless
// the caller already knows real coordinates for them — addOrders.tsx's
// place picker (GET /settings/service-areas, admin-managed) supplies known
// center coordinates for its listed localities, which skips geocoding (and
// the failure mode it has: an address Nominatim can't resolve, or a flaky
// network call) entirely for those. Either way, the price itself always comes from the same
// POST /shipments/quote endpoint (kalanabhaBackend PricingService) the
// actual booking flow uses server-side — never a separate, client-computed
// price that could drift from what the backend charges.
//
// Previously read pricing from a Firestore `vehicleConfigs` collection that
// nothing populates any more (vehicle pricing lives in Postgres since the
// backend migration) — every quote silently fell back to hardcoded
// defaults regardless of the real per-vehicle rates. Fixed to call the
// backend directly.
export const useFareEstimate = (
    pickupAddress: string,
    dropAddress: string,
    vehicleType: string,
    serviceType: string,
    pickupCoords?: KnownCoords | null,
    dropCoords?: KnownCoords | null,
    category?: string,
    helpersCount?: number,
): FareEstimate => {
    const [estimate, setEstimate] = useState<FareEstimate>(IDLE);
    const requestId = useRef(0);

    useEffect(() => {
        if (!pickupAddress.trim() || !dropAddress.trim() || !vehicleType || !serviceType) {
            setEstimate(IDLE);
            return;
        }

        const currentRequest = ++requestId.current;
        setEstimate(prev => ({ ...prev, loading: true, error: null }));

        const run = async () => {
            try {
                const [pickup, drop] = await Promise.all([
                    pickupCoords ? Promise.resolve(pickupCoords) : forwardGeocode(pickupAddress),
                    dropCoords ? Promise.resolve(dropCoords) : forwardGeocode(dropAddress),
                ]);

                if (currentRequest !== requestId.current) return;

                if (!pickup || !drop) {
                    setEstimate({ ...IDLE, error: 'Could not locate one of the addresses' });
                    return;
                }

                const quote = await quoteShipment({ pickup, drop, vehicleType, serviceType, category, helpersCount });

                if (currentRequest !== requestId.current) return;

                setEstimate({
                    loading: false,
                    price: quote.price,
                    distanceKm: quote.distanceKm,
                    pickup,
                    drop,
                    error: null,
                    helperCost: quote.helperCost,
                });
            } catch (err) {
                if (currentRequest !== requestId.current) return;
                const message = err instanceof ApiError ? err.message : 'Failed to estimate fare';
                setEstimate({ ...IDLE, error: message });
            }
        };

        run();
    }, [pickupAddress, dropAddress, vehicleType, serviceType, pickupCoords?.lat, pickupCoords?.lng, dropCoords?.lat, dropCoords?.lng, category, helpersCount]);

    return estimate;
};
