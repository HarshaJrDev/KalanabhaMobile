import { apiClient } from '@api/client';
import type { ApiSuccessResponse } from '@api/types';
import type { PromoEvaluation } from './types';

export const validatePromoCode = async (code: string, amount: number): Promise<PromoEvaluation> => {
    const { data } = await apiClient.post<ApiSuccessResponse<PromoEvaluation>>('/promotions/validate', { code, amount });
    return data.data;
};
