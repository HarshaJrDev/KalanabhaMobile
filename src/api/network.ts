import { useSyncExternalStore } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';

// Single source of truth for connectivity across the app. Wires
// TanStack Query's onlineManager to the device's real network state, so:
//  - queries auto-pause while offline instead of failing/retrying uselessly
//  - queries auto-refetch the moment connectivity returns (see queryClient's
//    `refetchOnReconnect`), with no per-screen listener needed
//  - apiClient can synchronously check `isOnline()` to fail fast instead of
//    waiting out a timeout when there's clearly no connection
// Call `initNetworkMonitoring()` once, at app startup (App.tsx).
let lastKnownOnline = true;
const listeners = new Set<() => void>();

export const initNetworkMonitoring = (): (() => void) => {
    return NetInfo.addEventListener((state) => {
        lastKnownOnline = !!state.isConnected && state.isInternetReachable !== false;
        onlineManager.setOnline(lastKnownOnline);
        listeners.forEach((l) => l());
    });
};

export const isOnline = (): boolean => lastKnownOnline;

// Screen/hook-facing subscription — re-renders on connectivity change.
export const useIsOnline = (): boolean => {
    return useSyncExternalStore(
        (callback) => {
            listeners.add(callback);
            return () => listeners.delete(callback);
        },
        () => lastKnownOnline,
    );
};
