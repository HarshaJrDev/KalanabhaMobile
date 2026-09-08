import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthState } from '@hooks/useAuthState';
import * as savedAddressesApi from './api';
import type { CreateSavedAddressPayload, UpdateSavedAddressPayload } from './types';

const savedAddressKeys = {
    mine: ['saved-addresses', 'mine'] as const,
};

export const useSavedAddresses = () => {
    const { isAuthenticated } = useAuthState();
    return useQuery({
        queryKey: savedAddressKeys.mine,
        queryFn: savedAddressesApi.getMySavedAddresses,
        enabled: isAuthenticated,
    });
};

export const useCreateSavedAddress = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateSavedAddressPayload) => savedAddressesApi.createSavedAddress(payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: savedAddressKeys.mine }),
    });
};

export const useUpdateSavedAddress = (id: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: UpdateSavedAddressPayload) => savedAddressesApi.updateSavedAddress(id, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: savedAddressKeys.mine }),
    });
};

export const useDeleteSavedAddress = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => savedAddressesApi.deleteSavedAddress(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: savedAddressKeys.mine }),
    });
};
