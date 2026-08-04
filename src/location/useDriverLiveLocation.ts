import { useEffect, useRef } from 'react';
import Geolocation from 'react-native-geolocation-service';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

// Rapido-style live tracking: while the driver has an active delivery,
// periodically push their position onto their own `users/{uid}` doc so a
// customer watching ShipmentDetailsScreen sees it update in near-real-time
// (see useLiveDriverLocation on the customer side, which listens to this).
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

        const user = auth().currentUser;
        if (!user) return;

        watchId.current = Geolocation.watchPosition(
            position => {
                const { latitude, longitude } = position.coords;
                firestore()
                    .collection('users')
                    .doc(user.uid)
                    .set(
                        {
                            lastLat: latitude,
                            lastLng: longitude,
                            lastLocationAt: firestore.FieldValue.serverTimestamp(),
                        },
                        { merge: true }
                    )
                    .catch(() => {
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
