import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Socket } from 'socket.io-client';
import * as chatApi from './api/chat.api';
import type { BackendChatMessage } from './types';
import { createSocket } from '@api/socket';
import { useAuthState } from '@hooks/useAuthState';

export const chatKeys = {
    messages: (shipmentId: string) => ['chat', shipmentId, 'messages'] as const,
};




export const useChatMessages = (shipmentId: string | undefined) => {
    const { isAuthenticated } = useAuthState();
    return useQuery({
        queryKey: chatKeys.messages(shipmentId ?? ''),
        queryFn: () => chatApi.getMessages(shipmentId!),
        enabled: isAuthenticated && !!shipmentId,
    });
};

export const useSendMessage = (shipmentId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (text: string) => chatApi.sendMessage(shipmentId, text),
        onSuccess: (message) => {
            // The socket broadcast will also deliver this message back to us;
            // de-dupe by id so it doesn't render twice.
            queryClient.setQueryData<BackendChatMessage[]>(chatKeys.messages(shipmentId), (prev) =>
                prev?.some((m) => m.id === message.id) ? prev : [...(prev ?? []), message],
            );
        },
    });
};




export const useChatSocket = (shipmentId: string | undefined) => {
    const queryClient = useQueryClient();
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (!shipmentId) return;

        const socket = createSocket('chat');
        socketRef.current = socket;

        socket.emit('join', shipmentId);

        socket.on('message', (message: BackendChatMessage) => {
            queryClient.setQueryData<BackendChatMessage[]>(chatKeys.messages(shipmentId), (prev) =>
                prev?.some((m) => m.id === message.id) ? prev : [...(prev ?? []), message],
            );
        });

        return () => {
            socket.emit('leave', shipmentId);
            socket.disconnect();
            socketRef.current = null;
        };
    }, [shipmentId, queryClient]);
};
