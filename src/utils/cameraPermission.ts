import { PermissionsAndroid, Platform } from 'react-native';










export const ensureCameraPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;

    const already = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
    if (already) return true;

    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA, {
        title: 'Camera Permission',
        message: 'Kalanabha needs camera access to capture proof-of-delivery and verification photos.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
    });
    return result === PermissionsAndroid.RESULTS.GRANTED;
};
