import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import * as Sentry from '@sentry/react-native';
import { API_BASE_URL } from '../config/env';
import {
  clearAuth,
  getRefreshToken,
  getToken,
  setRefreshToken,
  setToken,
} from '../services/storage';
import {
  ApiError,
  type ApiSuccessResponse,
  type NestErrorResponse,
} from './types';
import { isOnline } from './network';
import { showToast } from '@ui/alert/toastStore';
import { useAuthStore } from '@features/store/authStore';
import { queryClient } from './queryClient';

declare module 'axios' {
  
  
  
  
  
  export interface InternalAxiosRequestConfig {
    _retry?: boolean;
    skipGlobalErrorToast?: boolean;
  }
  
  
  
  export interface AxiosRequestConfig {
    skipGlobalErrorToast?: boolean;
  }
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  
  
  
  
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




const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh'];

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new ApiError('Session expired', 401);
  }

  
  
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






export const endSession = () => {
  clearAuth();
  useAuthStore.getState().logout();
  queryClient.clear();
};

apiClient.interceptors.response.use(
  response => {
    
    
    
    
    
    
    const body = response.data;
    if (!body || typeof body !== 'object' || body.success !== true) {
      const malformed = new ApiError(
        'Received an unexpected response from the server',
        response.status,
      );
      showToast(malformed.message, 'error');
      return Promise.reject(malformed);
    }
    return response;
  },
  async (error: AxiosError<NestErrorResponse> | ApiError) => {
    
    
    if (error instanceof ApiError) {
      // status undefined here is always the request interceptor's own
      // offline pre-flight check above — a pure connectivity error.
      // Every screen with a query already shows its own single,
      // dedicated "You're offline" card (AsyncState, via useIsOnline()),
      // so toasting the same thing here on top of that was duplicating
      // the error on screen: one toast + one full-screen card for the
      // exact same failure. Mutations that aren't behind AsyncState
      // already catch and toast this themselves at the call site.
      if (error.status !== 401 && error.status !== undefined) {
        showToast(error.message, 'error');
      }
      return Promise.reject(error);
    }

    const config = error.config as InternalAxiosRequestConfig | undefined;
    const isAuthPath = AUTH_PATHS.some(p => config?.url?.includes(p));

    if (
      error.response?.status === 401 &&
      config &&
      !config._retry &&
      !isAuthPath
    ) {
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
    
    
    
    
    
    const isServerError = (error.response?.status ?? 0) >= 500;
    // Network errors are deliberately not toasted here, same reasoning
    // as the ApiError branch above — every query screen already shows
    // its own single offline/error card for this exact failure
    // (AsyncState), and toasting it too meant the user saw two separate
    // error surfaces for one failure. Server errors (5xx) still toast:
    // those aren't a connectivity issue AsyncState's offline branch
    // covers, and plenty of call sites (mutations/button actions) have
    // no card of their own to fall back on.
    if (!config?.skipGlobalErrorToast && isServerError) {
      showToast(apiError.message, 'error');
    }
    
    
    
    if (isServerError) {
      Sentry.captureException(error, {
        extra: { url: config?.url, method: config?.method },
      });
    }

    
    
    
    
    if (isServerError && !isAuthPath && getToken()) {
      endSession();
    }

    return Promise.reject(apiError);
  },
);
