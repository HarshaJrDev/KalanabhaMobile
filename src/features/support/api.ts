import { apiClient } from '@api/client';
import type { ApiSuccessResponse, PaginatedResult } from '@api/types';
import type { CreateTicketPayload, SupportTicket, SupportTicketMessage } from './types';

// One-to-one with kalanabhaBackend/src/modules/support/controllers/support.controller.ts

export const createTicket = async (payload: CreateTicketPayload): Promise<SupportTicket> => {
    const { data } = await apiClient.post<ApiSuccessResponse<SupportTicket>>('/support/tickets', payload);
    return data.data;
};

export const getMyTickets = async (page: number, limit: number): Promise<PaginatedResult<SupportTicket>> => {
    const { data } = await apiClient.get<ApiSuccessResponse<PaginatedResult<SupportTicket>>>('/support/tickets/mine', {
        params: { page, limit },
    });
    return data.data;
};

export const getTicket = async (id: string): Promise<SupportTicket> => {
    const { data } = await apiClient.get<ApiSuccessResponse<SupportTicket>>(`/support/tickets/${id}`);
    return data.data;
};

export const addTicketMessage = async (id: string, text: string): Promise<SupportTicketMessage> => {
    const { data } = await apiClient.post<ApiSuccessResponse<SupportTicketMessage>>(`/support/tickets/${id}/messages`, { text });
    return data.data;
};
