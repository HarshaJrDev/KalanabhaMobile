import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './types';




export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            
            
            
            
            retry: (failureCount, error) => {
                const status = error instanceof ApiError ? error.status : undefined;
                if (status && status >= 400 && status < 500) return false;
                return failureCount < 2;
            },
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
            staleTime: 30 * 1000,
            
            
            
            refetchOnReconnect: true,
            refetchOnWindowFocus: false,
        },
        mutations: {
            retry: false,
        },
    },
});
