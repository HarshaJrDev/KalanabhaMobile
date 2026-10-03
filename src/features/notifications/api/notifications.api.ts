import { apiClient } from '@api/client';
import type { ApiSuccessResponse } from '@api/types';
import type { BackendNotification } from '../types';



export const getMyNotifications = async (): Promise<BackendNotification[]> => {
    const { data } = await apiClient.get<ApiSuccessResponse<BackendNotification[]>>('/notifications/mine');
    return data.data;
};

export const getUnreadCount = async (): Promise<number> => {
    const { data } = await apiClient.get<ApiSuccessResponse<{ count: number }>>('/notifications/unread-count');
    return data.data.count;
};

export const markNotificationRead = async (id: string): Promise<void> => {
    await apiClient.patch<ApiSuccessResponse<{ id: string; read: boolean }>>(`/notifications/${id}/read`);
};

export const markAllNotificationsRead = async (): Promise<void> => {
    await apiClient.post<ApiSuccessResponse<null>>('/notifications/mark-all-read');
};

// Swipe-to-delete on the mobile Notifications screen — real deletion,
// scoped server-side to the caller's own notifications.
export const deleteNotification = async (id: string): Promise<void> => {
    await apiClient.delete<ApiSuccessResponse<null>>(`/notifications/${id}`);
};
