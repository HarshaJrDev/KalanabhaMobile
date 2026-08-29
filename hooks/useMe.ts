import { useQuery } from '@tanstack/react-query';
import { getMe } from '../features/users/api/users.api';
import { useAuthState } from './useAuthState';

export const meQueryKey = ['users', 'me'] as const;

// Screen -> useMe -> users.api -> GET /users/me -> typed StoredUser -> cache -> UI
// Only fires once an access token exists — an unauthenticated call would
// just 401 and get swallowed by the retry logic below.
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
