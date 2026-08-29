import { apiClient } from '@api/client';
import type { ApiSuccessResponse } from '@api/types';
import type { AuthTokens, LoginPayload, RefreshPayload, RegisterPayload } from '../types';

// One-to-one with kalanabhaBackend/src/modules/auth/controllers/auth.controller.ts

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

// Backend reads the caller's id off the access token (JwtAuthGuard), so no
// body is sent — it revokes every refresh token belonging to req.user.sub.
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
