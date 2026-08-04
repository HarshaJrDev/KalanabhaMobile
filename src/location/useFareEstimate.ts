import { useEffect, useRef, useState } from 'react';
import firestore from '@react-native-firebase/firestore';
import { forwardGeocode } from '../services/location';
import { haversineDistanceKm } from '../../utils/geo';

export interface FareEstimate {
    loading: boolean;
    price: number | null;
    distanceKm: number | null;
    pickup: { lat: number; lng: number } | null;
    drop: { lat: number; lng: number } | null;
    error: string | null;
}

const IDLE: FareEstimate = { loading: false, price: null, distanceKm: null, pickup: null, drop: null, error: null };

const DEFAULT_BASE_RATE = 49;
const DEFAULT_RATE_PER_KM = 8;

// Real, distance-based fare estimate (Rapido-style "see price before you
// book"), replacing the flat per-service-type price that used to be shown
// on the order review step. Geocodes the typed pickup/drop addresses (the
// form only captures free text, no coordinates) and prices them against the
// same `vehicleConfigs` collection the admin dashboard manages.
export const useFareEstimate = (
    pickupAddress: string,
    dropAddress: string,
    vehicleType: string
): FareEstimate => {
    const [estimate, setEstimate] = useState<FareEstimate>(IDLE);
    const requestId = useRef(0);

    useEffect(() => {
        if (!pickupAddress.trim() || !dropAddress.trim() || !vehicleType) {
            setEstimate(IDLE);
            return;
        }

        const currentRequest = ++requestId.current;
        setEstimate(prev => ({ ...prev, loading: true, error: null }));

        const run = async () => {
            try {
                const [pickup, drop, configSnap] = await Promise.all([
                    forwardGeocode(pickupAddress),
                    forwardGeocode(dropAddress),
                    firestore().collection('vehicleConfigs').get(),
                ]);

                if (currentRequest !== requestId.current) return;

                if (!pickup || !drop) {
                    setEstimate({ ...IDLE, error: 'Could not locate one of the addresses' });
                    return;
                }

                const config = configSnap.docs
                    .map(d => d.data() as { name?: string; baseRate?: number; ratePerKm?: number; active?: boolean })
                    .find(c => (c.name ?? '').toLowerCase() === vehicleType.toLowerCase());

                const baseRate = config?.baseRate ?? DEFAULT_BASE_RATE;
                const ratePerKm = config?.ratePerKm ?? DEFAULT_RATE_PER_KM;

                const distanceKm = haversineDistanceKm(pickup, drop);
                const price = Math.round(baseRate + distanceKm * ratePerKm);

                if (currentRequest !== requestId.current) return;

                setEstimate({
                    loading: false,
                    price,
                    distanceKm: Math.round(distanceKm * 100) / 100,
                    pickup,
                    drop,
                    error: null,
                });
            } catch {
                if (currentRequest !== requestId.current) return;
                setEstimate({ ...IDLE, error: 'Failed to estimate fare' });
            }
        };

        run();
    }, [pickupAddress, dropAddress, vehicleType]);

    return estimate;
};
