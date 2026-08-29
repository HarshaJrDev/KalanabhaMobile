import { useMutation } from '@tanstack/react-query';
import { forgotPassword, resetPassword } from '@features/auth/api/auth.api';
import { ApiError } from '@api/types';

// Screen -> hook -> auth.api -> POST /auth/forgot-password -> always
// succeeds (no email enumeration) -> ForgotPasswordScreen shows a fixed
// "check your email" message regardless of the response.
export const useForgotPassword = () => {
    return useMutation<void, ApiError, string>({
        mutationFn: (email: string) => forgotPassword(email),
    });
};

// Screen -> hook -> auth.api -> POST /auth/reset-password -> real
// validation errors (wrong/expired/used code) surface via ApiError.message.
export const useResetPassword = () => {
    return useMutation<void, ApiError, { email: string; code: string; newPassword: string }>({
        mutationFn: (payload) => resetPassword(payload),
    });
};
