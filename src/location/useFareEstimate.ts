import { useEffect, useRef, useState } from 'react';
import { forwardGeocode } from '../services/location';
import { quoteShipment } from '@features/shipments/api/shipments.api';
import { getDrivingRoute } from '@features/navigation/osrm';
import { ApiError } from '@api/types';

export interface FareEstimate {
    loading: boolean;
    price: number | null;
    distanceKm: number | null;
    pickup: { lat: number; lng: number } | null;
    drop: { lat: number; lng: number } | null;
    error: string | null;
    helperCost: number | null;
    insurancePremium: number | null;
    
    
    
    
    etaMinutes: number | null;
}

const IDLE: FareEstimate = { loading: false, price: null, distanceKm: null, pickup: null, drop: null, error: null, helperCost: null, insurancePremium: null, etaMinutes: null };

export interface KnownCoords {
    lat: number;
    lng: number;
}

















export const useFareEstimate = (
    pickupAddress: string,
    dropAddress: string,
    vehicleType: string,
    serviceType: string,
    pickupCoords?: KnownCoords | null,
    dropCoords?: KnownCoords | null,
    category?: string,
    helpersCount?: number,
    insuranceRequested?: boolean,
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

                const [quote, route] = await Promise.all([
                    quoteShipment({ pickup, drop, vehicleType, serviceType, category, helpersCount, insuranceRequested }),
                    getDrivingRoute(pickup, drop).catch(() => null),
                ]);

                if (currentRequest !== requestId.current) return;

                setEstimate({
                    loading: false,
                    price: quote.price,
                    distanceKm: quote.distanceKm,
                    pickup,
                    drop,
                    error: null,
                    helperCost: quote.helperCost,
                    insurancePremium: quote.insurancePremium,
                    etaMinutes: route ? Math.max(1, Math.round(route.durationSeconds / 60)) : null,
                });
            } catch (err) {
                if (currentRequest !== requestId.current) return;
                const message = err instanceof ApiError ? err.message : 'Failed to estimate fare';
                setEstimate({ ...IDLE, error: message });
            }
        };

        run();
        
        
        
        
        
        
    }, [pickupAddress, dropAddress, vehicleType, serviceType, pickupCoords?.lat, pickupCoords?.lng, dropCoords?.lat, dropCoords?.lng, category, helpersCount, insuranceRequested]);

    return estimate;
};
