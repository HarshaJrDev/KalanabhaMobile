// utils/fcm.ts
import messaging from '@react-native-firebase/messaging';
import { apiClient } from '../src/api/client';
import { getToken as getAccessToken } from '../src/services/storage';

// Mirrors PATCH /users/me/fcm-token — kalanabhaBackend UsersController.
// `role` is unused server-side now (the backend already knows the caller's
// role from their JWT); kept in the signature so call sites don't need to
// change.
export const registerFCMToken = async (_role: 'customer' | 'driver') => {
    try {
        const authStatus = await messaging().requestPermission();
        const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        if (!enabled) return;

        const fcmToken = await messaging().getToken();
        if (!fcmToken || !getAccessToken()) return;

        await apiClient.patch('/users/me/fcm-token', { fcmToken });

        console.log('[FCM] Token registered:', fcmToken);
    } catch (e) {
        console.error('[FCM] registerFCMToken error:', e);
    }
};

export const setupFCMListeners = (
    onForegroundMessage: (title: string, body: string, data: any) => void
) => {
    // Foreground
    const unsub = messaging().onMessage(async remote => {
        const title = remote.notification?.title ?? 'New notification';
        const body = remote.notification?.body ?? '';
        onForegroundMessage(title, body, remote.data ?? {});
    });

    // Background tap
    messaging().onNotificationOpenedApp(remote => {
        console.log('[FCM] Tapped from background:', remote.data);
    });

    // Quit state tap
    messaging().getInitialNotification().then(remote => {
        if (remote) console.log('[FCM] Tapped from quit:', remote.data);
    });

    return unsub;
};