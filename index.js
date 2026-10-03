


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



setBackgroundMessageHandler(getMessaging(getApp()), async remoteMessage => {
  console.log('Message handled in the background!', remoteMessage);
});






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
