import { PermissionsAndroid, Platform } from 'react-native';








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
