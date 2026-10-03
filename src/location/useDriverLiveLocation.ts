import { useEffect, useRef, useState } from 'react';
import Geolocation from 'react-native-geolocation-service';
import { pingLocation } from '@features/tracking/api/tracking.api';
import { ensureLocationPermission } from '@utils/locationPermission';

export interface DriverPosition {
    lat: number;
    lng: number;
}




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

        let cancelled = false;

        (async () => {
            const granted = await ensureLocationPermission();
            if (cancelled || !granted) {
                if (!granted && __DEV__) console.warn('[useDriverLiveLocation] location permission denied');
                return;
            }

            watchId.current = Geolocation.watchPosition(
                geoPosition => {
                    const { latitude, longitude } = geoPosition.coords;
                    setPosition({ lat: latitude, lng: longitude });
                    pingLocation(latitude, longitude).catch(() => {
                        
                        
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
        })();

        return () => {
            cancelled = true;
            if (watchId.current != null) {
                Geolocation.clearWatch(watchId.current);
                watchId.current = null;
            }
        };
    }, [isActive]);

    return position;
};
