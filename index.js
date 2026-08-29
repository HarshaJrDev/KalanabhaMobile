// import 'react-native-reanimated';

/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { getApp } from '@react-native-firebase/app';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';

// Modular API (namespaced `messaging()` is deprecated as of RNFirebase v22
// and logs a warning on every call — see https://rnfirebase.io/migrating-to-v22).
setBackgroundMessageHandler(getMessaging(getApp()), async remoteMessage => {
  console.log('Message handled in the background!', remoteMessage);
});

AppRegistry.registerComponent(appName, () => App);
