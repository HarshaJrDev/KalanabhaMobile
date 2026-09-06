import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthState } from '@hooks/useAuthState';
import * as supportApi from './api';
import type { CreateTicketPayload } from './types';

const ticketKeys = {
    mine: ['support', 'tickets', 'mine'] as const,
    detail: (id: string) => ['support', 'tickets', id] as const,
};

export const useMyTickets = () => {
    const { isAuthenticated } = useAuthState();
    return useQuery({
        queryKey: ticketKeys.mine,
        queryFn: async () => (await supportApi.getMyTickets(1, 50)).items,
        enabled: isAuthenticated,
    });
};

export const useTicket = (id: string | undefined) => {
    return useQuery({
        queryKey: ticketKeys.detail(id ?? ''),
        queryFn: () => supportApi.getTicket(id!),
        enabled: !!id,
        // A ticket's own thread can get a reply from support at any time —
        // same lightweight poll ShipmentChatScreen uses while open.
        refetchInterval: 8000,
    });
};

export const useCreateTicket = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateTicketPayload) => supportApi.createTicket(payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ticketKeys.mine }),
    });
};

export const useAddTicketMessage = (id: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (text: string) => supportApi.addTicketMessage(id, text),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ticketKeys.detail(id) }),
    });
};
