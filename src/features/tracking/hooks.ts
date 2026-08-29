import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Socket } from 'socket.io-client';
import * as trackingApi from './api/tracking.api';
import type { DriverLocation } from './types';
import { createSocket } from '@api/socket';
import { useAuthState } from '@hooks/useAuthState';

export const trackingKeys = {
    location: (shipmentId: string) => ['tracking', shipmentId, 'location'] as const,
};

// Screen -> hook -> tracking.api -> GET /shipments/:id/location -> cache -> UI.
// Seeds the map with the last-known position; useTrackingSocket below keeps
// it live from then on (matches the old Firestore onSnapshot on the
// driver's user doc that ShipmentDetailsScreen used).
export const useShipmentLocation = (shipmentId: string | undefined) => {
    const { isAuthenticated } = useAuthState();
    return useQuery({
        queryKey: trackingKeys.location(shipmentId ?? ''),
        queryFn: () => trackingApi.getShipmentLocation(shipmentId!),
        enabled: isAuthenticated && !!shipmentId,
    });
};

// Joins the shipment's tracking room (TrackingGateway) and pushes each
// incoming ping straight into the query cache.
export const useTrackingSocket = (shipmentId: string | undefined) => {
    const queryClient = useQueryClient();
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (!shipmentId) return;

        const socket = createSocket('tracking');
        socketRef.current = socket;

        socket.emit('join', shipmentId);

        socket.on('location', (location: DriverLocation) => {
            queryClient.setQueryData(trackingKeys.location(shipmentId), location);
        });

        return () => {
            socket.emit('leave', shipmentId);
            socket.disconnect();
            socketRef.current = null;
        };
    }, [shipmentId, queryClient]);
};

// Driver app: called on an interval while a delivery is ACCEPTED/IN_TRANSIT.
export const usePingLocation = () => {
    return useMutation({
        mutationFn: ({ lat, lng }: { lat: number; lng: number }) => trackingApi.pingLocation(lat, lng),
    });
};
