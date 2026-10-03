import { useMutation } from '@tanstack/react-query';
import { forgotPassword, resetPassword } from '@features/auth/api/auth.api';
import { ApiError } from '@api/types';




export const useForgotPassword = () => {
    return useMutation<void, ApiError, string>({
        mutationFn: (email: string) => forgotPassword(email),
    });
};



export const useResetPassword = () => {
    return useMutation<void, ApiError, { email: string; code: string; newPassword: string }>({
        mutationFn: (payload) => resetPassword(payload),
    });
};
