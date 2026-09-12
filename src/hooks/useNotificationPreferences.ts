import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateNotificationPreferences, type NotificationPreferencesPayload } from '@features/users/api/users.api';
import { useAuthStore } from '@features/store/authStore';
import { meQueryKey } from './useMe';

// Same hydration pattern as useUpdateProfile — the authStore user object
// carries notifyOrderUpdates/notifyPromotions/notifyReminders, so every
// screen reading it (Settings) sees a toggle change immediately.
export const useUpdateNotificationPreferences = () => {
    const setUser = useAuthStore((s) => s.setUser);
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: NotificationPreferencesPayload) => updateNotificationPreferences(payload),
        onSuccess: (user) => {
            setUser(user);
            queryClient.setQueryData(meQueryKey, user);
        },
    });
};
