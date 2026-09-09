import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as notificationsApi from './api/notifications.api';
import type { BackendNotification } from './types';
import { useAuthState } from '@hooks/useAuthState';
import { createSocket } from '@api/socket';

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

// Instant delivery on top of the 15s poll above (NotificationsGateway) —
// for the case that actually needs it, e.g. a driver accepting a shipment
// should move the bell right away while the customer is watching the app,
// not after up to 15s. The REST poll stays as the reliable path for
// reconnects/backgrounding; this only shortens the common-case wait while
// the socket is actually connected. No 'join' message needed — the server
// puts the connection straight into its own user room from the verified JWT.
export const useNotificationsSocket = () => {
    const { isAuthenticated } = useAuthState();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!isAuthenticated) return;

        const socket = createSocket('notifications');

        socket.on('notification', (notification: BackendNotification) => {
            queryClient.setQueryData<BackendNotification[]>(notificationKeys.mine(), (prev) =>
                prev ? [notification, ...prev] : [notification],
            );
            queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
        });

        return () => {
            socket.disconnect();
        };
    }, [isAuthenticated, queryClient]);
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
