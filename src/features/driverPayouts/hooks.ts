import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as driverPayoutsApi from './api/driverPayouts.api';
import { useAuthState } from '@hooks/useAuthState';
import { shipmentKeys } from '@features/shipments/hooks';

export const driverPayoutsKeys = {
    unpaidSummary: ['driver-payouts', 'me', 'unpaid-summary'] as const,
};

export const useMyUnpaidPayoutSummary = () => {
    const { isAuthenticated } = useAuthState();
    return useQuery({
        queryKey: driverPayoutsKeys.unpaidSummary,
        queryFn: driverPayoutsApi.getMyUnpaidSummary,
        enabled: isAuthenticated,
    });
};

export const useRequestMyPayout = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: driverPayoutsApi.requestMyPayout,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: driverPayoutsKeys.unpaidSummary });
            // The just-paid-out shipments move off the "unpaid" set this
            // same earnings screen's recentTrips/totals are derived from.
            queryClient.invalidateQueries({ queryKey: [...shipmentKeys.all, 'driver-earnings-summary'] });
        },
    });
};
