import { apiClient } from '@api/client';
import type { ApiSuccessResponse } from '@api/types';
import type { CreateRatingInput, Rating } from '../types';



export const getRating = async (shipmentId: string): Promise<Rating | null> => {
    const { data } = await apiClient.get<ApiSuccessResponse<Rating | null>>(`/shipments/${shipmentId}/rating`);
    return data.data;
};

export const submitRating = async (shipmentId: string, input: CreateRatingInput): Promise<Rating> => {
    const { data } = await apiClient.post<ApiSuccessResponse<Rating>>(`/shipments/${shipmentId}/rating`, input);
    return data.data;
};
