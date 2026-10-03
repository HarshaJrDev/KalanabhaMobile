import { apiClient } from '@api/client';
import type { ApiSuccessResponse } from '@api/types';
import type { AuthTokens, LoginPayload, RefreshPayload, RegisterPayload } from '../types';



export const login = async (payload: LoginPayload): Promise<AuthTokens> => {
    const { data } = await apiClient.post<ApiSuccessResponse<AuthTokens>>('/auth/login', payload);
    return data.data;
};

export const register = async (payload: RegisterPayload): Promise<AuthTokens> => {
    const { data } = await apiClient.post<ApiSuccessResponse<AuthTokens>>('/auth/register', payload);
    return data.data;
};

export const refresh = async (payload: RefreshPayload): Promise<AuthTokens> => {
    const { data } = await apiClient.post<ApiSuccessResponse<AuthTokens>>('/auth/refresh', payload);
    return data.data;
};



export const logout = async (): Promise<void> => {
    await apiClient.post<ApiSuccessResponse<null>>('/auth/logout');
};

export const forgotPassword = async (email: string): Promise<void> => {
    await apiClient.post<ApiSuccessResponse<null>>('/auth/forgot-password', { email });
};

export const resetPassword = async (payload: {
    email: string;
    code: string;
    newPassword: string;
}): Promise<void> => {
    await apiClient.post<ApiSuccessResponse<null>>('/auth/reset-password', payload);
};



export const requestLoginOtp = async (email: string): Promise<void> => {
    await apiClient.post<ApiSuccessResponse<null>>('/auth/login-otp/request', { email });
};

export const verifyLoginOtp = async (email: string, code: string): Promise<AuthTokens> => {
    const { data } = await apiClient.post<ApiSuccessResponse<AuthTokens>>('/auth/login-otp/verify', { email, code });
    return data.data;
};
