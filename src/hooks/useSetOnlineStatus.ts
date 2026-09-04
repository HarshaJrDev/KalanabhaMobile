import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setOnlineStatus } from '@features/users/api/users.api';
import { useAuthStore } from '@features/store/authStore';
import { meQueryKey } from './useMe';

// Screen -> useSetOnlineStatus -> users.api -> PATCH /users/me/online-status
// -> typed StoredUser -> authStore + query cache -> UI. Mirrors
// useUpdateProfile's exact hydration pattern — the driver home screen's
// online/offline toggle previously had nothing to call.
export const useSetOnlineStatus = () => {
    const setUser = useAuthStore((s) => s.setUser);
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (isOnline: boolean) => setOnlineStatus(isOnline),
        onSuccess: (user) => {
            setUser(user);
            queryClient.setQueryData(meQueryKey, user);
        },
    });
};
