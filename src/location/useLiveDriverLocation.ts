import { useEffect, useState } from 'react';
import firestore from '@react-native-firebase/firestore';

export interface LiveDriverLocation {
    lat: number;
    lng: number;
    updatedAt: Date | null;
}

// Customer-side counterpart to useDriverLiveLocation: listens to the
// assigned driver's own `users/{driverId}` doc for the lastLat/lastLng the
// driver app has been writing, so ShipmentDetailsScreen can show a live
// "driver is nearby" indicator (Rapido-style) without a full map.
export const useLiveDriverLocation = (driverId: string | null | undefined): LiveDriverLocation | null => {
    const [location, setLocation] = useState<LiveDriverLocation | null>(null);

    useEffect(() => {
        if (!driverId) {
            setLocation(null);
            return;
        }

        const unsub = firestore()
            .collection('users')
            .doc(driverId)
            .onSnapshot(
                doc => {
                    const data = doc.data();
                    if (!data || typeof data.lastLat !== 'number' || typeof data.lastLng !== 'number') {
                        setLocation(null);
                        return;
                    }

                    setLocation({
                        lat: data.lastLat,
                        lng: data.lastLng,
                        updatedAt: data.lastLocationAt?.toDate?.() ?? null,
                    });
                },
                () => setLocation(null)
            );

        return () => unsub();
    }, [driverId]);

    return location;
};
