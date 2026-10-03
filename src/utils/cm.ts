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
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { apiClient } from '../api/client';
import { getToken as getAccessToken } from '../services/storage';
import { handleNotificationTap } from '../features/notifications/deepLink';
import { ensureNotificationPermission } from './notificationPermission';

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
    // Android's own runtime prompt — requestPermission() below only
    // actually shows a system dialog on iOS; on Android 13+ it just
    // reports whatever POST_NOTIFICATIONS is already set to, so
    // without requesting it first here, it's permanently DENIED and
    // this whole function silently no-ops every time.
    const androidGranted = await ensureNotificationPermission();
    if (!androidGranted) return;

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

const ANDROID_CHANNEL_ID = 'default';

const tapFromData = (data: Record<string, unknown> | undefined) => {
  handleNotificationTap(
    (data?.type as string) ?? null,
    (data?.shipmentId as string) ?? null,
    (data?.ticketId as string) ?? null,
  );
};

// Real OS notification + deep link only — no custom in-app Alert popup.
// FCM auto-displays a system notification when the app is backgrounded/
// killed, but deliberately does NOT when it's foregrounded (onMessage
// fires instead, silently, by design — that's standard FCM behavior on
// both platforms). Previously this gap was filled with a one-off
// Alert.alert "View/Dismiss" dialog; now it's filled with a real local
// notification via notifee instead, so a foregrounded app behaves the
// same as a backgrounded one — same notification tray entry, same tap-to-
// open-the-right-screen behavior — with no separate in-screen popup.
export const setupFCMListeners = () => {
  const messaging = messagingInstance();

  notifee.createChannel({
    id: ANDROID_CHANNEL_ID,
    name: 'Kalanabha',
    importance: AndroidImportance.HIGH,
  });

  notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS) {
      tapFromData(
        detail.notification?.data as Record<string, unknown> | undefined,
      );
    }
  });

  const unsub = onMessage(messaging, async remote => {
    await notifee.displayNotification({
      title: remote.notification?.title ?? 'New notification',
      body: remote.notification?.body ?? '',
      data: remote.data,
      android: {
        channelId: ANDROID_CHANNEL_ID,
        pressAction: { id: 'default' },
      },
    });
  });

  // Background tap — was console.log-only before, so tapping a
  // notification while the app sat backgrounded did nothing at all.
  onNotificationOpenedApp(messaging, remote => {
    tapFromData(remote.data);
  });

  // Killed-app tap — same real navigation, via the pending-target queue
  // in deepLink.ts since the NavigationContainer isn't necessarily
  // mounted yet at this point in a cold start.
  getInitialNotification(messaging).then(remote => {
    if (!remote) return;
    tapFromData(remote.data);
  });

  return unsub;
};
