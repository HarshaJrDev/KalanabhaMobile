import { useQuery } from '@tanstack/react-query';
import * as dashboardApi from './api/dashboard.api';
import { useAuthState } from '../../hooks/useAuthState';

export const useDashboardOverview = () => {
    const { isAuthenticated } = useAuthState();
    return useQuery({
        queryKey: ['dashboard', 'overview'] as const,
        queryFn: dashboardApi.getOverview,
        enabled: isAuthenticated,
        refetchInterval: 20000,
    });
};
