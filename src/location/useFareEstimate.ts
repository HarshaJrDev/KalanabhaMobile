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
}

const IDLE: FareEstimate = { loading: false, price: null, distanceKm: null, pickup: null, drop: null, error: null };

// Real, distance-based fare estimate (Rapido-style "see price before you
// book"). Geocodes the typed pickup/drop addresses (the form only captures
// free text, no coordinates) via Nominatim, then prices them through the
// same POST /shipments/quote endpoint (kalanabhaBackend PricingService)
// that the actual booking flow uses server-side — not a separate,
// client-computed price that could drift from what the backend charges.
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
                    forwardGeocode(pickupAddress),
                    forwardGeocode(dropAddress),
                ]);

                if (currentRequest !== requestId.current) return;

                if (!pickup || !drop) {
                    setEstimate({ ...IDLE, error: 'Could not locate one of the addresses' });
                    return;
                }

                const quote = await quoteShipment({ pickup, drop, vehicleType, serviceType });

                if (currentRequest !== requestId.current) return;

                setEstimate({
                    loading: false,
                    price: quote.price,
                    distanceKm: quote.distanceKm,
                    pickup,
                    drop,
                    error: null,
                });
            } catch (err) {
                if (currentRequest !== requestId.current) return;
                const message = err instanceof ApiError ? err.message : 'Failed to estimate fare';
                setEstimate({ ...IDLE, error: message });
            }
        };

        run();
    }, [pickupAddress, dropAddress, vehicleType, serviceType]);

    return estimate;
};
