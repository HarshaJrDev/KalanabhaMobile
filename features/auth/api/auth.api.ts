import { apiClient } from '../../../src/api/client';
import type { ApiSuccessResponse } from '../../../src/api/types';
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
