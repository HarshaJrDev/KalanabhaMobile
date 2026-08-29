import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './types';

// The one QueryClient for the whole app — every feature hook
// (features/*/hooks.ts) shares this instance instead of creating its own,
// so cache, retry policy, and offline behavior are consistent everywhere.
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Don't retry on 4xx (bad request, unauthorized after refresh
            // already failed, forbidden, not found, validation) — those are
            // never fixed by retrying. Do retry transient network/5xx
            // failures, capped at 2 attempts.
            retry: (failureCount, error) => {
                const status = error instanceof ApiError ? error.status : undefined;
                if (status && status >= 400 && status < 500) return false;
                return failureCount < 2;
            },
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
            staleTime: 30 * 1000,
            // Paused automatically while offline (see src/api/network.ts's
            // onlineManager wiring) and re-fired the moment connectivity
            // returns — no per-screen "pull to refresh on reconnect" needed.
            refetchOnReconnect: true,
            refetchOnWindowFocus: false,
        },
        mutations: {
            retry: false,
        },
    },
});
