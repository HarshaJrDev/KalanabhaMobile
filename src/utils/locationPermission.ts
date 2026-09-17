import { PermissionsAndroid, Platform } from 'react-native';

// AndroidManifest.xml declares android.permission.ACCESS_FINE_LOCATION, but
// react-native-geolocation-service (unlike the older, deprecated
// @react-native-community/geolocation) never requests it at runtime for
// you — getCurrentPosition/watchPosition just fail immediately with
// PERMISSION_DENIED (error code 1) and no OS prompt ever appears. Every
// location call site in this app must call this first, mirroring
// ensureCameraPermission.ts's pattern.
export const ensureLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;

    const already = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
    if (already) return true;

    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, {
        title: 'Location Permission',
        message: 'Kalanabha needs your location to find nearby drivers, show live tracking, and calculate accurate fares.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
    });
    return result === PermissionsAndroid.RESULTS.GRANTED;
};
