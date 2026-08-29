import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as settingsApi from './api/settings.api';
import type { VehicleConfigPayload } from './types';
import { useAuthState } from '@hooks/useAuthState';

export const vehicleConfigKeys = {
    all: ['vehicle-configs'] as const,
};

// Screen -> hook -> settings.api -> GET /settings/vehicle-configs -> cache -> UI
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
