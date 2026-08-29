import { useMutation, useQueryClient } from '@tanstack/react-query';
import { register } from '../features/auth/api/auth.api';
import type { RegisterPayload } from '../features/auth/types';
import { getMe } from '../features/users/api/users.api';
import { useAuthStore } from '../features/store/authStore';
import { setRefreshToken, setToken, type StoredUser } from '../src/services/storage';
import { ApiError } from '../src/api/types';
import { meQueryKey } from './useMe';

// Screen -> useRegister -> auth.api/users.api -> POST /auth/register + GET /users/me
// -> typed StoredUser -> authStore + MMKV + query cache -> UI
const registerAndFetchProfile = async (payload: RegisterPayload): Promise<StoredUser> => {
    const tokens = await register(payload);

    setToken(tokens.accessToken);
    setRefreshToken(tokens.refreshToken);

    return getMe();
};

export const useRegister = () => {
    const setUser = useAuthStore((s) => s.setUser);
    const queryClient = useQueryClient();

    return useMutation<StoredUser, ApiError, RegisterPayload>({
        mutationFn: registerAndFetchProfile,
        retry: false,
        networkMode: 'online',

        onSuccess: (user) => {
            setUser(user);
            queryClient.setQueryData(meQueryKey, user);
        },

        onError: (error) => {
            if (__DEV__) {
                console.error('[useRegister]', error.message);
            }
        },
    });
};
