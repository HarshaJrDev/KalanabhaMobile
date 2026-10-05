
import { getApp } from '@react-native-firebase/app';
import {
  getMessaging,
  requestPermission,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
  getInitialNotification,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { apiClient } from '../api/client';
import { getToken as getAccessToken } from '../services/storage';
import { handleNotificationTap } from '../features/notifications/deepLink';
import { ensureNotificationPermission } from './notificationPermission';





const messagingInstance = () => getMessaging(getApp());





export const registerFCMToken = async (_role: 'customer' | 'driver') => {
  try {
    
    
    
    
    
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

  
  
  onNotificationOpenedApp(messaging, remote => {
    tapFromData(remote.data);
  });




  getInitialNotification(messaging).then(remote => {
    if (!remote) return;
    tapFromData(remote.data);
  });

  // Without this, a token rotated by Firebase (periodic rotation, or a
  // fresh token issued after reinstall/clear-data) never reaches the
  // backend again — registerFCMToken only ever runs once, at mount/login.
  // The driver's stored fcmToken silently goes stale and every push after
  // that point is sent to a dead token, with no visible symptom beyond
  // "notifications just stopped working" for that one user.
  const unsubTokenRefresh = onTokenRefresh(messaging, async newToken => {
    try {
      if (!getAccessToken()) return;
      await apiClient.patch('/users/me/fcm-token', { fcmToken: newToken });
      console.log('[FCM] Token refreshed and re-registered');
    } catch (e) {
      console.error('[FCM] token refresh re-registration error:', e);
    }
  });

  return () => {
    unsub();
    unsubTokenRefresh();
  };
};
