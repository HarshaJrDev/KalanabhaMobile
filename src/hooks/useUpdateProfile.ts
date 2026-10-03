import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateProfile, type UpdateProfilePayload } from '@features/users/api/users.api';
import { useAuthStore } from '@features/store/authStore';
import { meQueryKey } from './useMe';






export const useUpdateProfile = () => {
    const setUser = useAuthStore((s) => s.setUser);
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: UpdateProfilePayload) => updateProfile(payload),
        onSuccess: (user) => {
            setUser(user);
            queryClient.setQueryData(meQueryKey, user);
        },
    });
};
