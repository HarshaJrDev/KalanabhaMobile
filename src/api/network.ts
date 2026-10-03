import { useSyncExternalStore } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';









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


export const useIsOnline = (): boolean => {
    return useSyncExternalStore(
        (callback) => {
            listeners.add(callback);
            return () => listeners.delete(callback);
        },
        () => lastKnownOnline,
    );
};
