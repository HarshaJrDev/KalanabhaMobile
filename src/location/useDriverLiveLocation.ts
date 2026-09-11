import { useEffect, useRef, useState } from 'react';
import Geolocation from 'react-native-geolocation-service';
import { pingLocation } from '@features/tracking/api/tracking.api';

export interface DriverPosition {
    lat: number;
    lng: number;
}

// Returns the driver's own current position (used by TurnByTurnNav as the
// nav origin) in addition to its original job — pinging the server so the
// customer's LiveTrackingMap marker moves. One GPS watch, two consumers.
export const useDriverLiveLocation = (isActive: boolean): DriverPosition | null => {
    const watchId = useRef<number | null>(null);
    const [position, setPosition] = useState<DriverPosition | null>(null);

    useEffect(() => {
        if (!isActive) {
            if (watchId.current != null) {
                Geolocation.clearWatch(watchId.current);
                watchId.current = null;
            }
            setPosition(null);
            return;
        }

        watchId.current = Geolocation.watchPosition(
            geoPosition => {
                const { latitude, longitude } = geoPosition.coords;
                setPosition({ lat: latitude, lng: longitude });
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

    return position;
};
