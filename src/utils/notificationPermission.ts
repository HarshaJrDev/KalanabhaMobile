import { PermissionsAndroid, Platform } from 'react-native';









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
