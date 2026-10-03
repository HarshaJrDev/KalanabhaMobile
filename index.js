// import 'react-native-reanimated';

/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { getApp } from '@react-native-firebase/app';
import {
  getMessaging,
  setBackgroundMessageHandler,
} from '@react-native-firebase/messaging';
import notifee, { EventType } from '@notifee/react-native';
import { handleNotificationTap } from './src/features/notifications/deepLink';

// Modular API (namespaced `messaging()` is deprecated as of RNFirebase v22
// and logs a warning on every call — see https://rnfirebase.io/migrating-to-v22).
setBackgroundMessageHandler(getMessaging(getApp()), async remoteMessage => {
  console.log('Message handled in the background!', remoteMessage);
});

// Tap on a notifee notification (posted by utils/cm.ts's foreground
// onMessage handler) while the app is backgrounded, not killed — must be
// registered here, outside the React tree, per notifee's own docs; the
// foreground-only listener in cm.ts covers the "still in the app" case,
// this covers "backgrounded right after the notification appeared".
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS) {
    const data = detail.notification?.data;
    handleNotificationTap(
      data?.type ?? null,
      data?.shipmentId ?? null,
      data?.ticketId ?? null,
    );
  }
});

AppRegistry.registerComponent(appName, () => App);
