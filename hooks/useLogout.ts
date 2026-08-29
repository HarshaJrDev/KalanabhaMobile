import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { Alert } from 'react-native';
import { logout as logoutRequest } from '../features/auth/api/auth.api';
import { useAuthStore } from '../features/store/authStore';
import { clearAuth } from '../src/services/storage';

// Screen -> useLogout -> auth.api -> POST /auth/logout (revokes refresh
// tokens server-side) -> clear MMKV + store + cache -> UI
export const useLogout = () => {
    const clearUser = useAuthStore((s) => s.logout);
    const navigation = useNavigation();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            try {
                await logoutRequest();
            } catch (error) {
                // Best-effort: even if the server call fails (e.g. token
                // already expired), still clear local session below so the
                // user isn't stuck logged in on-device.
                if (__DEV__) {
                    console.warn('[useLogout] server logout failed', error);
                }
            }

            clearAuth();
            clearUser();
            await queryClient.clear();
        },

        onSuccess: () => {
            navigation.navigate('SelectAccount' as never);
        },

        onError: (error) => {
            if (__DEV__) {
                console.error('[useLogout]', error);
            }
            Alert.alert('Logout Error', 'Please try again');
        },
    });
};
