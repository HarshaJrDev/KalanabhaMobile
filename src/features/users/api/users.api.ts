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

// GET /users/me/referral — this user's own real referral code (lazily
// generated server-side for accounts that predate this feature).
export const getMyReferralCode = async (): Promise<{ referralCode: string }> => {
    const { data } = await apiClient.get<ApiSuccessResponse<{ referralCode: string }>>('/users/me/referral');
    return data.data;
};

export interface NotificationPreferencesPayload {
    notifyOrderUpdates?: boolean;
    notifyPromotions?: boolean;
    notifyReminders?: boolean;
}

// PATCH /users/me/notification-preferences — per-category push mute.
export const updateNotificationPreferences = async (payload: NotificationPreferencesPayload): Promise<StoredUser> => {
    const { data } = await apiClient.patch<ApiSuccessResponse<StoredUser>>('/users/me/notification-preferences', payload);
    return data.data;
};
