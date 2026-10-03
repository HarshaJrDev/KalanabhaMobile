import { useMutation, useQueryClient } from '@tanstack/react-query';
import { login } from '@features/auth/api/auth.api';
import type { LoginPayload } from '@features/auth/types';
import { getMe } from '@features/users/api/users.api';
import { useAuthStore } from '@features/store/authStore';
import { setRefreshToken, setToken, type StoredUser } from '@services/storage';
import { ApiError } from '@api/types';
import { meQueryKey } from './useMe';



const loginAndFetchProfile = async (payload: LoginPayload): Promise<StoredUser> => {
    const tokens = await login(payload);

    
    
    setToken(tokens.accessToken);
    setRefreshToken(tokens.refreshToken);

    return getMe();
};

export const useLogin = () => {
    const setUser = useAuthStore((s) => s.setUser);
    const queryClient = useQueryClient();

    return useMutation<StoredUser, ApiError, LoginPayload>({
        mutationFn: loginAndFetchProfile,
        retry: false,
        networkMode: 'online',

        onSuccess: (user) => {
            setUser(user);
            queryClient.setQueryData(meQueryKey, user);
        },

        onError: (error) => {
            if (__DEV__) {
                console.error('[useLogin]', error.message);
            }
        },
    });
};
