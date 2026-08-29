import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateProfile, type UpdateProfilePayload } from '@features/users/api/users.api';
import { useAuthStore } from '@features/store/authStore';
import { meQueryKey } from './useMe';

// Screen -> useUpdateProfile -> users.api -> PATCH /users/me -> typed
// StoredUser -> authStore (persisted via its own Zustand `persist` storage)
// + query cache -> UI. Mirrors useLogin's exact hydration pattern so every
// screen reading the authStore user (Profile, DriverHeader,
// LogisticsCardList, etc.) sees the edit immediately.
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
