import { apiClient } from '@api/client';
import type { ApiSuccessResponse } from '@api/types';
import type { FuelStation } from '../types';

// One-to-one with kalanabhaBackend/src/modules/maps/controllers/maps.controller.ts
// — free OpenStreetMap/Overpass data, no API key involved on either side.
export const getNearbyFuelStations = async (lat: number, lng: number, radiusKm = 5): Promise<FuelStation[]> => {
    const { data } = await apiClient.get<ApiSuccessResponse<FuelStation[]>>('/maps/fuel-stations', {
        params: { lat, lng, radiusKm },
    });
    return data.data;
};
