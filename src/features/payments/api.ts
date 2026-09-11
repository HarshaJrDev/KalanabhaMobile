import { apiClient } from '@api/client';
import type { ApiSuccessResponse } from '@api/types';
import type { PaymentOrder, RazorpayCheckoutSuccess } from './types';

export const createPaymentOrder = async (shipmentId: string): Promise<PaymentOrder> => {
    const { data } = await apiClient.post<ApiSuccessResponse<PaymentOrder>>('/payments/orders', { shipmentId });
    return data.data;
};

export const verifyPayment = async (payload: RazorpayCheckoutSuccess): Promise<{ verified: boolean }> => {
    const { data } = await apiClient.post<ApiSuccessResponse<{ verified: boolean }>>('/payments/verify', payload);
    return data.data;
};
