import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuthState } from '@hooks/useAuthState';
import * as promotionsApi from './api';

export const useValidatePromoCode = () =>
    useMutation({
        mutationFn: ({ code, amount }: { code: string; amount: number }) => promotionsApi.validatePromoCode(code, amount),
    });

export const useActivePromoCodes = () => {
    const { isAuthenticated } = useAuthState();
    return useQuery({
        queryKey: ['promotions', 'active'] as const,
        queryFn: promotionsApi.getActivePromoCodes,
        enabled: isAuthenticated,
    });
};
