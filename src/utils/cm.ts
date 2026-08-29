// utils/fcm.ts
import { getApp } from '@react-native-firebase/app';
import {
    getMessaging,
    requestPermission,
    getToken,
    onMessage,
    onNotificationOpenedApp,
    getInitialNotification,
    AuthorizationStatus,
} from '@react-native-firebase/messaging';
import { apiClient } from '../api/client';
import { getToken as getAccessToken } from '../services/storage';

// Modular API — the namespaced `messaging()` call style is deprecated as of
// RNFirebase v22 and logs a console warning on every use (was showing up
// as "This method is deprecated..." on every screen that registered FCM).
// See https://rnfirebase.io/migrating-to-v22.
const messagingInstance = () => getMessaging(getApp());

// Mirrors PATCH /users/me/fcm-token — kalanabhaBackend UsersController.
// `role` is unused server-side now (the backend already knows the caller's
// role from their JWT); kept in the signature so call sites don't need to
// change.
export const registerFCMToken = async (_role: 'customer' | 'driver') => {
    try {
        const messaging = messagingInstance();
        const authStatus = await requestPermission(messaging);
        const enabled =
            authStatus === AuthorizationStatus.AUTHORIZED ||
            authStatus === AuthorizationStatus.PROVISIONAL;
        if (!enabled) return;

        const fcmToken = await getToken(messaging);
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
    const messaging = messagingInstance();

    // Foreground
    const unsub = onMessage(messaging, async remote => {
        const title = remote.notification?.title ?? 'New notification';
        const body = remote.notification?.body ?? '';
        onForegroundMessage(title, body, remote.data ?? {});
    });

    // Background tap
    onNotificationOpenedApp(messaging, remote => {
        console.log('[FCM] Tapped from background:', remote.data);
    });

    // Quit state tap
    getInitialNotification(messaging).then(remote => {
        if (remote) console.log('[FCM] Tapped from quit:', remote.data);
    });

    return unsub;
};
