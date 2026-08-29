import { apiClient } from '../../../src/api/client';
import type { ApiSuccessResponse } from '../../../src/api/types';
import type { DriverLocation } from '../types';

// One-to-one with kalanabhaBackend/src/modules/tracking/controllers/tracking.controller.ts

// driver only — periodic ping while a delivery is active.
export const pingLocation = async (lat: number, lng: number): Promise<void> => {
    await apiClient.post<ApiSuccessResponse<unknown>>('/tracking/ping', { lat, lng });
};

// Poll/fallback for clients not using the tracking socket.
export const getShipmentLocation = async (shipmentId: string): Promise<DriverLocation | null> => {
    const { data } = await apiClient.get<ApiSuccessResponse<DriverLocation | null>>(
        `/shipments/${shipmentId}/location`,
    );
    return data.data;
};
