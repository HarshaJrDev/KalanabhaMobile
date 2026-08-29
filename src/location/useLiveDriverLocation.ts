import { useMemo } from 'react';
import { useShipmentLocation, useTrackingSocket } from '@features/tracking/hooks';

export interface LiveDriverLocation {
    lat: number;
    lng: number;
    updatedAt: Date | null;
}

// Customer-side counterpart to useDriverLiveLocation: GET /shipments/:id/location
// seeds the last-known position, then the tracking socket (TrackingGateway)
// keeps it live — replaces the old Firestore onSnapshot on the driver's own
// `users/{driverId}` doc, keyed by shipmentId instead of driverId (matches
// how the backend's tracking room is scoped).
export const useLiveDriverLocation = (shipmentId: string | null | undefined): LiveDriverLocation | null => {
    const id = shipmentId ?? undefined;
    const { data } = useShipmentLocation(id);
    useTrackingSocket(id);

    return useMemo(() => {
        if (!data) return null;
        return { lat: data.lat, lng: data.lng, updatedAt: new Date(data.updatedAt) };
    }, [data]);
};
