import { apiClient } from '@api/client';
import type { ApiSuccessResponse } from '@api/types';
import type { VehicleConfig, VehicleConfigPayload, ServiceArea, BusinessSetting, PackageCategory } from '../types';

// GET /settings/vehicle-configs — Prisma VehicleConfig model.
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

// GET /settings/service-areas — Prisma ServiceArea model, admin-managed.
// addOrders.tsx's PlacePicker lists these for pickup/drop selection instead
// of free-text address entry.
export const getServiceAreas = async (): Promise<ServiceArea[]> => {
    const { data } = await apiClient.get<ApiSuccessResponse<ServiceArea[]>>('/settings/service-areas');
    return data.data;
};

// GET /settings/package-categories — Prisma PackageCategory model.
// addOrders.tsx's "Category" chips on the Package Details step read this
// instead of a hardcoded array.
export const getPackageCategories = async (): Promise<PackageCategory[]> => {
    const { data } = await apiClient.get<ApiSuccessResponse<PackageCategory[]>>('/settings/package-categories');
    return data.data;
};

// GET /settings/business — key/value platform rules, includes
// 'helper_rate_per_person' (House Shifting's real per-helper charge).
export const getBusinessSettings = async (): Promise<BusinessSetting[]> => {
    const { data } = await apiClient.get<ApiSuccessResponse<BusinessSetting[]>>('/settings/business');
    return data.data;
};
