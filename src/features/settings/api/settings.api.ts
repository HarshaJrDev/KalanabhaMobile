import { apiClient } from '@api/client';
import type { ApiSuccessResponse } from '@api/types';
import type { VehicleConfig, VehicleConfigPayload } from '../types';

// One-to-one with kalanabhaBackend/src/modules/settings/controllers/settings.controller.ts

export const getVehicleConfigs = async (): Promise<VehicleConfig[]> => {
    const { data } = await apiClient.get<ApiSuccessResponse<VehicleConfig[]>>('/settings/vehicle-configs');
    return data.data;
};

// admin only
export const createVehicleConfig = async (payload: VehicleConfigPayload): Promise<VehicleConfig> => {
    const { data } = await apiClient.post<ApiSuccessResponse<VehicleConfig>>('/settings/vehicle-configs', payload);
    return data.data;
};

// admin only
export const updateVehicleConfig = async (id: string, payload: VehicleConfigPayload): Promise<VehicleConfig> => {
    const { data } = await apiClient.put<ApiSuccessResponse<VehicleConfig>>(`/settings/vehicle-configs/${id}`, payload);
    return data.data;
};

// admin only
export const toggleVehicleConfigActive = async (id: string, active: boolean): Promise<VehicleConfig> => {
    const { data } = await apiClient.patch<ApiSuccessResponse<VehicleConfig>>(
        `/settings/vehicle-configs/${id}/active`,
        { active },
    );
    return data.data;
};

// admin only
export const deleteVehicleConfig = async (id: string): Promise<void> => {
    await apiClient.delete<ApiSuccessResponse<null>>(`/settings/vehicle-configs/${id}`);
};
