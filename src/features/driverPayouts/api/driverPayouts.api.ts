import { apiClient } from '@api/client';
import type { ApiSuccessResponse } from '@api/types';

export interface UnpaidPayoutSummary {
    amount: number;
    tripCount: number;
}

export interface PayoutResult {
    id: string;
    amount: number;
    tripCount: number;
    transferStatus: 'PENDING_TRANSFER' | 'PROCESSING' | 'TRANSFERRED' | 'FAILED';
}

export const getMyUnpaidSummary = async (): Promise<UnpaidPayoutSummary> => {
    const { data } = await apiClient.get<ApiSuccessResponse<UnpaidPayoutSummary>>('/driver-payouts/me/unpaid-summary');
    return data.data;
};

export const requestMyPayout = async (): Promise<PayoutResult> => {
    const { data } = await apiClient.post<ApiSuccessResponse<PayoutResult>>('/driver-payouts/me/request');
    return data.data;
};
