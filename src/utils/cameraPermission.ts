import { PermissionsAndroid, Platform } from 'react-native';

// AndroidManifest.xml declares android.permission.CAMERA (needed
// elsewhere in the app) — but once that's declared, Android requires the
// app to explicitly request it at runtime before any camera call, and
// react-native-image-picker will NOT do this for you in that case (it
// only auto-handles the permission when the manifest doesn't declare it
// at all). Without this, launchCamera fails with a real, confirmed error:
// "This library does not require Manifest.permission.CAMERA, if you add
// this permission in manifest then you have to obtain the same." — every
// launchCamera call in this app needs this checked first.
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
