// utils/fcm.ts
import messaging from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export const registerFCMToken = async (role: 'customer' | 'driver') => {
    try {
        const authStatus = await messaging().requestPermission();
        const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        if (!enabled) return;

        const token = await messaging().getToken();
        const user = auth().currentUser;
        if (!user || !token) return;

        await firestore()
            .collection('users')
            .doc(user.uid)
            .set(
                {
                    fcmToken: token,
                    role,
                    isOnline: true,
                    updatedAt: firestore.FieldValue.serverTimestamp(),
                },
                { merge: true }
            );

        console.log('[FCM] Token registered:', token);
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