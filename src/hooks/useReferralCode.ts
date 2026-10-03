import { useQuery } from '@tanstack/react-query';
import { getMyReferralCode } from '@features/users/api/users.api';
import { useAuthState } from '@hooks/useAuthState';

export const useReferralCode = () => {
    const { isAuthenticated } = useAuthState();
    return useQuery({
        queryKey: ['users', 'me', 'referral'] as const,
        queryFn: getMyReferralCode,
        enabled: isAuthenticated,
        staleTime: Infinity, 
    });
};
