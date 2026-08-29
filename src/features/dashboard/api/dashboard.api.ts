import { apiClient } from '@api/client';
import type { ApiSuccessResponse } from '@api/types';
import type { OverviewStats } from '../types';

// admin/dispatcher only — kalanabhaBackend DashboardController.overview
export const getOverview = async (): Promise<OverviewStats> => {
    const { data } = await apiClient.get<ApiSuccessResponse<OverviewStats>>('/dashboard/overview');
    return data.data;
};
