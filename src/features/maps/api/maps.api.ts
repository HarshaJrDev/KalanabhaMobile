import { apiClient } from '@api/client';
import type { ApiSuccessResponse } from '@api/types';
import type { FuelStation, TollGate } from '../types';



export const getNearbyFuelStations = async (lat: number, lng: number, radiusKm = 5): Promise<FuelStation[]> => {
    const { data } = await apiClient.get<ApiSuccessResponse<FuelStation[]>>('/maps/fuel-stations', {
        params: { lat, lng, radiusKm },
    });
    return data.data;
};

export const getNearbyTollGates = async (lat: number, lng: number, radiusKm = 15): Promise<TollGate[]> => {
    const { data } = await apiClient.get<ApiSuccessResponse<TollGate[]>>('/maps/toll-gates', {
        params: { lat, lng, radiusKm },
    });
    return data.data;
};
