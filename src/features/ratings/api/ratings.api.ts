import { apiClient } from '@api/client';
import type { ApiSuccessResponse } from '@api/types';
import type { CreateRatingInput, Rating, TipOrder } from '../types';



export const getRating = async (shipmentId: string): Promise<Rating | null> => {
    const { data } = await apiClient.get<ApiSuccessResponse<Rating | null>>(`/shipments/${shipmentId}/rating`);
    return data.data;
};

export const submitRating = async (shipmentId: string, input: CreateRatingInput): Promise<Rating> => {
    const { data } = await apiClient.post<ApiSuccessResponse<Rating>>(`/shipments/${shipmentId}/rating`, input);
    return data.data;
};

export const createTipOrder = async (shipmentId: string, amount: number): Promise<TipOrder> => {
    const { data } = await apiClient.post<ApiSuccessResponse<TipOrder>>(`/shipments/${shipmentId}/rating/tip/order`, { amount });
    return data.data;
};

export interface VerifyTipPayload {
    amount: number;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

export const verifyTip = async (shipmentId: string, payload: VerifyTipPayload): Promise<Rating> => {
    const { data } = await apiClient.post<ApiSuccessResponse<Rating>>(`/shipments/${shipmentId}/rating/tip/verify`, payload);
    return data.data;
};
