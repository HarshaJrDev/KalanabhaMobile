import { useMutation } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { logout as logoutRequest } from '@features/auth/api/auth.api';
import { endSession } from '@api/client';
import { showToast } from '@ui/alert/toastStore';





export const useLogout = () => {
    const navigation = useNavigation();

    return useMutation({
        mutationFn: async () => {
            try {
                await logoutRequest();
            } catch (error) {
                
                
                
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
