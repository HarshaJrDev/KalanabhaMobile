import { useQuery } from '@tanstack/react-query';
import { getMyReferralCode } from '@features/users/api/users.api';
import { useAuthState } from '@hooks/useAuthState';

export const useReferralCode = () => {
    const { isAuthenticated } = useAuthState();
    return useQuery({
        queryKey: ['users', 'me', 'referral'] as const,
        queryFn: getMyReferralCode,
        enabled: isAuthenticated,
        staleTime: Infinity, // a user's own referral code never changes once generated
    });
};
