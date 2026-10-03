import { apiClient } from '@api/client';
import type { ApiSuccessResponse } from '@api/types';
import type { FuelStation } from '../types';



export const getNearbyFuelStations = async (lat: number, lng: number, radiusKm = 5): Promise<FuelStation[]> => {
    const { data } = await apiClient.get<ApiSuccessResponse<FuelStation[]>>('/maps/fuel-stations', {
        params: { lat, lng, radiusKm },
    });
    return data.data;
};
