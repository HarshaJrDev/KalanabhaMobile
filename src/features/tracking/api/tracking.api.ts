import { apiClient } from '@api/client';
import type { ApiSuccessResponse } from '@api/types';
import type { DriverLocation } from '../types';




export const pingLocation = async (lat: number, lng: number): Promise<void> => {
    await apiClient.post<ApiSuccessResponse<unknown>>('/tracking/ping', { lat, lng });
};


export const getShipmentLocation = async (shipmentId: string): Promise<DriverLocation | null> => {
    const { data } = await apiClient.get<ApiSuccessResponse<DriverLocation | null>>(
        `/shipments/${shipmentId}/location`,
    );
    return data.data;
};
