import { useMemo } from 'react';
import { useShipmentLocation, useTrackingSocket } from '@features/tracking/hooks';

export interface LiveDriverLocation {
    lat: number;
    lng: number;
    updatedAt: Date | null;
}






export const useLiveDriverLocation = (shipmentId: string | null | undefined): LiveDriverLocation | null => {
    const id = shipmentId ?? undefined;
    const { data } = useShipmentLocation(id);
    useTrackingSocket(id);

    return useMemo(() => {
        if (!data) return null;
        return { lat: data.lat, lng: data.lng, updatedAt: new Date(data.updatedAt) };
    }, [data]);
};
