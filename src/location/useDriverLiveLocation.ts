import { useEffect, useRef } from 'react';
import Geolocation from 'react-native-geolocation-service';
import { pingLocation } from '@features/tracking/api/tracking.api';

export const useDriverLiveLocation = (isActive: boolean): void => {
    const watchId = useRef<number | null>(null);

    useEffect(() => {
        if (!isActive) {
            if (watchId.current != null) {
                Geolocation.clearWatch(watchId.current);
                watchId.current = null;
            }
            return;
        }

        watchId.current = Geolocation.watchPosition(
            position => {
                const { latitude, longitude } = position.coords;
                pingLocation(latitude, longitude).catch(() => {
                    // Non-critical — a missed ping just means a stale
                    // marker on the customer's side until the next one.
                });
            },
            error => {
                if (__DEV__) console.warn('[useDriverLiveLocation] error', error);
            },
            {
                enableHighAccuracy: true,
                distanceFilter: 20,
                interval: 8000,
                fastestInterval: 5000,
                forceRequestLocation: true,
            }
        );

        return () => {
            if (watchId.current != null) {
                Geolocation.clearWatch(watchId.current);
                watchId.current = null;
            }
        };
    }, [isActive]);
};
