import { apiClient } from '@api/client';
import type { ApiSuccessResponse } from '@api/types';
import type { SavedAddress, CreateSavedAddressPayload, UpdateSavedAddressPayload } from './types';

// One-to-one with kalanabhaBackend/src/modules/saved-addresses/controllers/saved-addresses.controller.ts

export const getMySavedAddresses = async (): Promise<SavedAddress[]> => {
    const { data } = await apiClient.get<ApiSuccessResponse<SavedAddress[]>>('/users/me/saved-addresses');
    return data.data;
};

export const createSavedAddress = async (payload: CreateSavedAddressPayload): Promise<SavedAddress> => {
    const { data } = await apiClient.post<ApiSuccessResponse<SavedAddress>>('/users/me/saved-addresses', payload);
    return data.data;
};

export const updateSavedAddress = async (id: string, payload: UpdateSavedAddressPayload): Promise<SavedAddress> => {
    const { data } = await apiClient.patch<ApiSuccessResponse<SavedAddress>>(`/users/me/saved-addresses/${id}`, payload);
    return data.data;
};

export const deleteSavedAddress = async (id: string): Promise<void> => {
    await apiClient.delete(`/users/me/saved-addresses/${id}`);
};
