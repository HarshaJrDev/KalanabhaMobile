import { apiClient } from '../../../src/api/client';
import type { ApiSuccessResponse } from '../../../src/api/types';
import type { BackendChatMessage } from '../types';

// One-to-one with kalanabhaBackend/src/modules/chat/controllers/chat.controller.ts

export const getMessages = async (shipmentId: string): Promise<BackendChatMessage[]> => {
    const { data } = await apiClient.get<ApiSuccessResponse<BackendChatMessage[]>>(
        `/shipments/${shipmentId}/messages`,
    );
    return data.data;
};

export const sendMessage = async (shipmentId: string, text: string): Promise<BackendChatMessage> => {
    const { data } = await apiClient.post<ApiSuccessResponse<BackendChatMessage>>(
        `/shipments/${shipmentId}/messages`,
        { text },
    );
    return data.data;
};
