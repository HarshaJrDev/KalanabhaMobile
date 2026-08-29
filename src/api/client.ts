import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../config/env';
import {
    clearAuth,
    getRefreshToken,
    getToken,
    setRefreshToken,
    setToken,
} from '../services/storage';
import { ApiError, type ApiSuccessResponse, type NestErrorResponse } from './types';

declare module 'axios' {
    // Marks a request as already retried once after a token refresh, so the
    // response interceptor never loops refresh -> retry -> refresh forever.
    export interface InternalAxiosRequestConfig {
        _retry?: boolean;
    }
}

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token) {
        config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
});

const toApiError = (error: AxiosError<NestErrorResponse>): ApiError => {
    const body = error.response?.data;
    const rawMessage = body?.message;
    const message = Array.isArray(rawMessage)
        ? rawMessage.join(', ')
        : rawMessage ?? error.message ?? 'Something went wrong. Please try again.';
    const errors = Array.isArray(rawMessage) ? rawMessage : undefined;

    return new ApiError(message, error.response?.status, errors);
};

// Auth endpoints (login/register/refresh) are intentionally excluded from
// the refresh-and-retry flow below — a 401 there means "bad credentials" or
// "bad refresh token", not "access token expired mid-session".
const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh'];

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
        throw new ApiError('Session expired', 401);
    }

    // Single-flight: concurrent 401s share one in-flight refresh call
    // instead of each firing their own /auth/refresh request.
    if (!refreshPromise) {
        refreshPromise = axios
            .post<ApiSuccessResponse<{ accessToken: string; refreshToken: string }>>(
                `${API_BASE_URL}/auth/refresh`,
                { refreshToken },
            )
            .then(({ data }) => {
                setToken(data.data.accessToken);
                setRefreshToken(data.data.refreshToken);
                return data.data.accessToken;
            })
            .finally(() => {
                refreshPromise = null;
            });
    }

    return refreshPromise;
}

apiClient.interceptors.response.use(
    response => response,
    async (error: AxiosError<NestErrorResponse>) => {
        const config = error.config as InternalAxiosRequestConfig | undefined;
        const isAuthPath = AUTH_PATHS.some(p => config?.url?.includes(p));

        if (error.response?.status === 401 && config && !config._retry && !isAuthPath) {
            config._retry = true;
            try {
                const accessToken = await refreshAccessToken();
                config.headers.set('Authorization', `Bearer ${accessToken}`);
                return apiClient(config);
            } catch {
                clearAuth();
                return Promise.reject(new ApiError('Session expired', 401));
            }
        }

        return Promise.reject(toApiError(error));
    },
);
