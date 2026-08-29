import { useMutation } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { logout as logoutRequest } from '@features/auth/api/auth.api';
import { endSession } from '@api/client';
import { showToast } from '@ui/alert/toastStore';

// Screen -> useLogout -> auth.api -> POST /auth/logout (revokes refresh
// tokens server-side) -> endSession() clears MMKV + store + cache -> UI.
// Shares `endSession` with apiClient's forced-logout-on-expired-session path
// so both leave the app in exactly the same state.
export const useLogout = () => {
    const navigation = useNavigation();

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

            endSession();
        },

        onSuccess: () => {
            navigation.navigate('SelectAccount' as never);
        },

        onError: (error) => {
            if (__DEV__) {
                console.error('[useLogout]', error);
            }
            showToast('Logout failed. Please try again.', 'error');
        },
    });
};
