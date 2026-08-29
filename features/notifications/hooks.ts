import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as notificationsApi from './api/notifications.api';
import { useAuthState } from '../../hooks/useAuthState';

export const notificationKeys = {
    all: ['notifications'] as const,
    mine: () => [...notificationKeys.all, 'mine'] as const,
    unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
};

const NOTIFICATIONS_POLL_MS = 15000;

// Screen -> hook -> notifications.api -> GET /notifications/mine -> cache -> UI
export const useMyNotifications = () => {
    const { isAuthenticated } = useAuthState();
    return useQuery({
        queryKey: notificationKeys.mine(),
        queryFn: notificationsApi.getMyNotifications,
        enabled: isAuthenticated,
        refetchInterval: NOTIFICATIONS_POLL_MS,
    });
};

export const useUnreadNotificationCount = () => {
    const { isAuthenticated } = useAuthState();
    return useQuery({
        queryKey: notificationKeys.unreadCount(),
        queryFn: notificationsApi.getUnreadCount,
        enabled: isAuthenticated,
        refetchInterval: NOTIFICATIONS_POLL_MS,
    });
};

export const useMarkNotificationRead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => notificationsApi.markNotificationRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.mine() });
            queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
        },
    });
};

export const useMarkAllNotificationsRead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: notificationsApi.markAllNotificationsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.mine() });
            queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
        },
    });
};
