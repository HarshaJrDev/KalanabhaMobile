import { apiClient } from '@api/client';
import type { ApiSuccessResponse } from '@api/types';
import type { StoredUser } from '@services/storage';

// GET /users/me — kalanabhaBackend UsersController.me
export const getMe = async (): Promise<StoredUser> => {
    const { data } = await apiClient.get<ApiSuccessResponse<StoredUser>>('/users/me');
    return data.data;
};

// PATCH /users/me — kalanabhaBackend UsersController.updateProfile /
// UpdateProfileDto. Only these three fields are accepted server-side —
// role/email/driver-only fields are not user-editable.
export interface UpdateProfilePayload {
    displayName?: string;
    phone?: string;
    address?: string;
}

export const updateProfile = async (payload: UpdateProfilePayload): Promise<StoredUser> => {
    const { data } = await apiClient.patch<ApiSuccessResponse<StoredUser>>('/users/me', payload);
    return data.data;
};

// PATCH /users/me/online-status — driver-only (UsersController.setOnlineStatus).
// Real endpoint that had no mobile-side wrapper yet — the driver home
// screen's online/offline toggle didn't persist anywhere before this.
export const setOnlineStatus = async (isOnline: boolean): Promise<StoredUser> => {
    const { data } = await apiClient.patch<ApiSuccessResponse<StoredUser>>('/users/me/online-status', { isOnline });
    return data.data;
};
