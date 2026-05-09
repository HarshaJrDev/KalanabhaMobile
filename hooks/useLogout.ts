// hooks/useLogout.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import auth from '@react-native-firebase/auth';
import { useAuthStore } from '../features/store/authStore';
import { clearAuth } from '../src/services/storage';
import { useNavigation } from '@react-navigation/native';
import { StackActions } from '@react-navigation/native';
import { Alert } from 'react-native';

export const useLogout = () => {
    const clearUser = useAuthStore((s) => s.logout);
    const navigation = useNavigation();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            try {
                // 1. Firebase sign out
                await auth().signOut();

                // 2. Clear local storage
                clearAuth(); // Tokens, user, onboarding

                // 3. Clear Zustand store
                clearUser();

                // 4. Clear React Query cache
                await queryClient.clear(); // Removes ALL queries (user data, etc.)

                console.log('✅ Logout complete');
            } catch (error) {
                console.error('❌ Logout error:', error);
                throw error;
            }
        },

        onSuccess: () => {
            // 5. Reset navigation to Login (clears entire stack)
            navigation.navigate('SelectAccount')
        },

        onError: (error) => {
            console.error('Logout failed:', error);
            Alert.alert('Logout Error', 'Please try again');
        },
    });
};