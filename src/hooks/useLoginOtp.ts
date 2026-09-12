import { useMutation, useQueryClient } from '@tanstack/react-query';
import { requestLoginOtp, verifyLoginOtp } from '@features/auth/api/auth.api';
import { getMe } from '@features/users/api/users.api';
import { useAuthStore } from '@features/store/authStore';
import { setRefreshToken, setToken, type StoredUser } from '@services/storage';
import { ApiError } from '@api/types';
import { meQueryKey } from './useMe';

// Screen -> useRequestLoginOtp -> auth.api -> POST /auth/login-otp/request
// -> a real email is sent (no SMS provider exists in this app).
export const useRequestLoginOtp = () =>
    useMutation<void, ApiError, string>({
        mutationFn: (email: string) => requestLoginOtp(email),
        retry: false,
        networkMode: 'online',
    });

const verifyAndFetchProfile = async (email: string, code: string): Promise<StoredUser> => {
    const tokens = await verifyLoginOtp(email, code);
    setToken(tokens.accessToken);
    setRefreshToken(tokens.refreshToken);
    return getMe();
};

// Same hydration pattern as useLogin — a real password-free sign-in path,
// not a password-reset flow repurposed.
export const useVerifyLoginOtp = () => {
    const setUser = useAuthStore((s) => s.setUser);
    const queryClient = useQueryClient();

    return useMutation<StoredUser, ApiError, { email: string; code: string }>({
        mutationFn: ({ email, code }) => verifyAndFetchProfile(email, code),
        retry: false,
        networkMode: 'online',
        onSuccess: (user) => {
            setUser(user);
            queryClient.setQueryData(meQueryKey, user);
        },
    });
};
