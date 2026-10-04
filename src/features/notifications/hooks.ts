import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as notificationsApi from './api/notifications.api';
import type { BackendNotification } from './types';
import { useAuthState } from '@hooks/useAuthState';
import { createSocket } from '@api/socket';
import { ApiError } from '@api/types';

export const notificationKeys = {
    all: ['notifications'] as const,
    mine: () => [...notificationKeys.all, 'mine'] as const,
    unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
};

const NOTIFICATIONS_POLL_MS = 15000;


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







export const useDeleteNotification = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => notificationsApi.deleteNotification(id),
        onMutate: async (id: string) => {
            await queryClient.cancelQueries({ queryKey: notificationKeys.mine() });
            const previous = queryClient.getQueryData<BackendNotification[]>(notificationKeys.mine());
            queryClient.setQueryData<BackendNotification[]>(notificationKeys.mine(), (prev) =>
                prev?.filter((n) => n.id !== id),
            );
            return { previous };
        },
        onError: (err, _id, context) => {
            
            
            
            
            
            
            if (err instanceof ApiError && err.status === 404) return;
            if (context?.previous) {
                queryClient.setQueryData(notificationKeys.mine(), context.previous);
            }
        },
        onSettled: () => {
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
