import { apiClient } from '@api/client';
import type { ApiSuccessResponse } from '@api/types';
import type { ActivePromoCode, PromoEvaluation } from './types';

export const validatePromoCode = async (code: string, amount: number): Promise<PromoEvaluation> => {
    const { data } = await apiClient.post<ApiSuccessResponse<PromoEvaluation>>('/promotions/validate', { code, amount });
    return data.data;
};

export const getActivePromoCodes = async (): Promise<ActivePromoCode[]> => {
    const { data } = await apiClient.get<ApiSuccessResponse<ActivePromoCode[]>>('/promotions/active');
    return data.data;
};
