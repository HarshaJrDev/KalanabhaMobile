import { useQuery } from '@tanstack/react-query';
import { getMe } from '@features/users/api/users.api';
import { useAuthState } from './useAuthState';

export const meQueryKey = ['users', 'me'] as const;




export const useMe = () => {
    const { isAuthenticated } = useAuthState();

    return useQuery({
        queryKey: meQueryKey,
        queryFn: getMe,
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });
};
