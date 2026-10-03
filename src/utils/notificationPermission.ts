import { PermissionsAndroid, Platform } from 'react-native';

// Android 13+ (API 33) made notifications a runtime-requested permission,
// same category as location/camera (see ensureLocationPermission.ts /
// ensureCameraPermission.ts) — @react-native-firebase/messaging's
// requestPermission() alone handles the iOS prompt but does not trigger
// Android's POST_NOTIFICATIONS system dialog, so without this, toggling
// notifications on in Settings silently failed and the switch snapped
// back off (permission was still DENIED by the time the status was
// re-checked).
export const ensureNotificationPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;

  const already = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  );
  if (already) return true;

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    {
      title: 'Notification Permission',
      message:
        'Kalanabha needs permission to send you order updates, promotions, and pickup reminders.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    },
  );
  return result === PermissionsAndroid.RESULTS.GRANTED;
};
