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
import { isOnline } from './network';
import { showToast } from '@ui/alert/toastStore';
import { useAuthStore } from '@features/store/authStore';
import { queryClient } from './queryClient';

declare module 'axios' {
    // Marks a request as already retried once after a token refresh, so the
    // response interceptor never loops refresh -> retry -> refresh forever.
    // `skipGlobalErrorToast` opts a call out of the automatic
    // network/server-error toast below, for callers that already render
    // their own inline error UI for this specific request.
    export interface InternalAxiosRequestConfig {
        _retry?: boolean;
        skipGlobalErrorToast?: boolean;
    }
}

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    // Fail fast instead of waiting out the 15s timeout when there is
    // definitely no connection — surfaces as the same ApiError shape
    // (network errors: no `error.response`) that every caller already
    // handles, and skips straight past axios's own dial attempt.
    if (!isOnline()) {
        return Promise.reject(new ApiError('No internet connection', undefined));
    }

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

// Full local session teardown — used both here (refresh failed) and by
// useLogout, so "your session just expired" and "you tapped logout" always
// leave the app in exactly the same state: no token, no cached user, no
// stale query cache. Reactive screens pick this up for free because
// useAuthState listens for the MMKV token key to be cleared.
export const endSession = () => {
    clearAuth();
    useAuthStore.getState().logout();
    queryClient.clear();
};

apiClient.interceptors.response.use(
    (response) => {
        // Centralized malformed-response guard: every 2xx from this backend
        // is `{ success: true, data, message? }` (ApiResponseBuilder). A
        // response that doesn't match that (e.g. an upstream proxy/error
        // page returning HTML, or `success` missing) is treated as a
        // failure here, once, instead of every api.ts function needing its
        // own `data?.data` null-check.
        const body = response.data;
        if (!body || typeof body !== 'object' || body.success !== true) {
            const malformed = new ApiError('Received an unexpected response from the server', response.status);
            showToast(malformed.message, 'error');
            return Promise.reject(malformed);
        }
        return response;
    },
    async (error: AxiosError<NestErrorResponse> | ApiError) => {
        // Already-normalized rejections (offline short-circuit above,
        // or a retried request's own ApiError) pass straight through.
        if (error instanceof ApiError) {
            if (error.status !== 401) {
                showToast(error.message, 'error');
            }
            return Promise.reject(error);
        }

        const config = error.config as InternalAxiosRequestConfig | undefined;
        const isAuthPath = AUTH_PATHS.some(p => config?.url?.includes(p));

        if (error.response?.status === 401 && config && !config._retry && !isAuthPath) {
            config._retry = true;
            try {
                const accessToken = await refreshAccessToken();
                config.headers.set('Authorization', `Bearer ${accessToken}`);
                return apiClient(config);
            } catch {
                endSession();
                showToast('Your session has expired. Please sign in again.', 'info');
                return Promise.reject(new ApiError('Session expired', 401));
            }
        }

        const apiError = toApiError(error);
        // Auth failures (401/403) and validation errors (400) are almost
        // always rendered inline by the screen that made the call (a form
        // field error, a "wrong password" message) — only surface a global
        // toast for things no screen-local UI is already showing: network
        // failures and unexpected server errors, unless the caller opted out.
        const isNetworkError = !error.response;
        const isServerError = (error.response?.status ?? 0) >= 500;
        if (!config?.skipGlobalErrorToast && (isNetworkError || isServerError)) {
            showToast(apiError.message, 'error');
        }

        return Promise.reject(apiError);
    },
);
