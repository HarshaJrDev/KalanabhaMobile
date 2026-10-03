import { apiClient } from '@api/client';
import type { ApiSuccessResponse } from '@api/types';
import type { StoredUser } from '@services/storage';


export const getMe = async (): Promise<StoredUser> => {
    const { data } = await apiClient.get<ApiSuccessResponse<StoredUser>>('/users/me');
    return data.data;
};




export interface UpdateProfilePayload {
    displayName?: string;
    phone?: string;
    address?: string;
}

export const updateProfile = async (payload: UpdateProfilePayload): Promise<StoredUser> => {
    const { data } = await apiClient.patch<ApiSuccessResponse<StoredUser>>('/users/me', payload);
    return data.data;
};




export const setOnlineStatus = async (isOnline: boolean): Promise<StoredUser> => {
    const { data } = await apiClient.patch<ApiSuccessResponse<StoredUser>>('/users/me/online-status', { isOnline });
    return data.data;
};



export const getMyReferralCode = async (): Promise<{ referralCode: string }> => {
    const { data } = await apiClient.get<ApiSuccessResponse<{ referralCode: string }>>('/users/me/referral');
    return data.data;
};

export interface NotificationPreferencesPayload {
    notifyOrderUpdates?: boolean;
    notifyPromotions?: boolean;
    notifyReminders?: boolean;
}


export const updateNotificationPreferences = async (payload: NotificationPreferencesPayload): Promise<StoredUser> => {
    const { data } = await apiClient.patch<ApiSuccessResponse<StoredUser>>('/users/me/notification-preferences', payload);
    return data.data;
};
