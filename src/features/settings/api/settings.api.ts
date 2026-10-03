import { apiClient } from '@api/client';
import type { ApiSuccessResponse } from '@api/types';
import type { VehicleConfig, VehicleConfigPayload, ServiceArea, BusinessSetting, PackageCategory } from '../types';


export const getVehicleConfigs = async (): Promise<VehicleConfig[]> => {
    const { data } = await apiClient.get<ApiSuccessResponse<VehicleConfig[]>>('/settings/vehicle-configs');
    return data.data;
};

export const createVehicleConfig = async (payload: VehicleConfigPayload): Promise<VehicleConfig> => {
    const { data } = await apiClient.post<ApiSuccessResponse<VehicleConfig>>('/settings/vehicle-configs', payload);
    return data.data;
};

export const updateVehicleConfig = async (id: string, payload: VehicleConfigPayload): Promise<VehicleConfig> => {
    const { data } = await apiClient.put<ApiSuccessResponse<VehicleConfig>>(`/settings/vehicle-configs/${id}`, payload);
    return data.data;
};

export const toggleVehicleConfigActive = async (id: string, active: boolean): Promise<VehicleConfig> => {
    const { data } = await apiClient.patch<ApiSuccessResponse<VehicleConfig>>(`/settings/vehicle-configs/${id}/active`, { active });
    return data.data;
};

export const deleteVehicleConfig = async (id: string): Promise<void> => {
    await apiClient.delete(`/settings/vehicle-configs/${id}`);
};




export const getServiceAreas = async (): Promise<ServiceArea[]> => {
    const { data } = await apiClient.get<ApiSuccessResponse<ServiceArea[]>>('/settings/service-areas');
    return data.data;
};




export const getPackageCategories = async (): Promise<PackageCategory[]> => {
    const { data } = await apiClient.get<ApiSuccessResponse<PackageCategory[]>>('/settings/package-categories');
    return data.data;
};



export const getBusinessSettings = async (): Promise<BusinessSetting[]> => {
    const { data } = await apiClient.get<ApiSuccessResponse<BusinessSetting[]>>('/settings/business');
    return data.data;
};
