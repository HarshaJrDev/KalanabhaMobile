import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as settingsApi from './api/settings.api';
import type { VehicleConfigPayload } from './types';
import { useAuthState } from '@hooks/useAuthState';

export const vehicleConfigKeys = {
    all: ['vehicle-configs'] as const,
};


export const useVehicleConfigs = () => {
    const { isAuthenticated } = useAuthState();
    return useQuery({
        queryKey: vehicleConfigKeys.all,
        queryFn: settingsApi.getVehicleConfigs,
        enabled: isAuthenticated,
        staleTime: 60 * 1000,
    });
};

const useInvalidateVehicleConfigs = () => {
    const queryClient = useQueryClient();
    return () => queryClient.invalidateQueries({ queryKey: vehicleConfigKeys.all });
};

export const useCreateVehicleConfig = () => {
    const invalidate = useInvalidateVehicleConfigs();
    return useMutation({
        mutationFn: (payload: VehicleConfigPayload) => settingsApi.createVehicleConfig(payload),
        onSuccess: invalidate,
    });
};

export const useUpdateVehicleConfig = () => {
    const invalidate = useInvalidateVehicleConfigs();
    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: VehicleConfigPayload }) =>
            settingsApi.updateVehicleConfig(id, payload),
        onSuccess: invalidate,
    });
};

export const useToggleVehicleConfigActive = () => {
    const invalidate = useInvalidateVehicleConfigs();
    return useMutation({
        mutationFn: ({ id, active }: { id: string; active: boolean }) =>
            settingsApi.toggleVehicleConfigActive(id, active),
        onSuccess: invalidate,
    });
};

export const useDeleteVehicleConfig = () => {
    const invalidate = useInvalidateVehicleConfigs();
    return useMutation({
        mutationFn: (id: string) => settingsApi.deleteVehicleConfig(id),
        onSuccess: invalidate,
    });
};

export const serviceAreaKeys = {
    all: ['service-areas'] as const,
};





export const useServiceAreas = () => {
    const { isAuthenticated } = useAuthState();
    return useQuery({
        queryKey: serviceAreaKeys.all,
        queryFn: settingsApi.getServiceAreas,
        enabled: isAuthenticated,
        staleTime: 60 * 1000,
    });
};

export const packageCategoryKeys = {
    all: ['package-categories'] as const,
};





export const usePackageCategories = () => {
    const { isAuthenticated } = useAuthState();
    return useQuery({
        queryKey: packageCategoryKeys.all,
        queryFn: settingsApi.getPackageCategories,
        enabled: isAuthenticated,
        staleTime: 60 * 1000,
    });
};

export const businessSettingKeys = {
    all: ['business-settings'] as const,
};






export const useBusinessSettings = () => {
    const { isAuthenticated } = useAuthState();
    return useQuery({
        queryKey: businessSettingKeys.all,
        queryFn: settingsApi.getBusinessSettings,
        enabled: isAuthenticated,
        staleTime: 60 * 1000,
    });
};
