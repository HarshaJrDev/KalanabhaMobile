import { apiClient } from '@api/client';
import type { ApiSuccessResponse } from '@api/types';
import type { BackendNotification } from '../types';

// One-to-one with kalanabhaBackend/src/modules/notifications/controllers/notifications.controller.ts

export const getMyNotifications = async (): Promise<BackendNotification[]> => {
    const { data } = await apiClient.get<ApiSuccessResponse<BackendNotification[]>>('/notifications/mine');
    return data.data;
};

export const getUnreadCount = async (): Promise<number> => {
    const { data } = await apiClient.get<ApiSuccessResponse<{ count: number }>>('/notifications/unread-count');
    return data.data.count;
};

export const markNotificationRead = async (id: string): Promise<BackendNotification> => {
    const { data } = await apiClient.patch<ApiSuccessResponse<BackendNotification>>(`/notifications/${id}/read`);
    return data.data;
};

export const markAllNotificationsRead = async (): Promise<void> => {
    await apiClient.post<ApiSuccessResponse<null>>('/notifications/mark-all-read');
};
