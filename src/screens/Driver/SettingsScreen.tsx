// SettingsScreen.tsx — Driver
//
// Minimal real settings screen (replacing the Profile menu's "Settings"
// no-op): notification permission status (backed by the same
// @react-native-firebase/messaging used by utils/fcm.ts's registerFCMToken),
// app version (from package.json — no native DeviceInfo dependency in this
// project), and logout. No new backend endpoints — everything here is
// either on-device or reuses the existing POST /auth/logout flow.
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Switch } from 'react-native';
import { getApp } from '@react-native-firebase/app';
import { getMessaging, hasPermission, AuthorizationStatus } from '@react-native-firebase/messaging';
import { ChevronLeft, LogOut } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useLogout } from '@hooks/useLogout';
import { registerFCMToken } from '@utils/cm';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version: appVersion } = require('../../../package.json');

const SettingsScreen = () => {
    const navigation = useNavigation();
    const logoutMutation = useLogout();
    const [notificationsEnabled, setNotificationsEnabled] = useState<boolean | null>(null);

    // Modular API — the namespaced `messaging()` call style is deprecated
    // as of RNFirebase v22 and logs a console warning on every use.
    // See https://rnfirebase.io/migrating-to-v22.
    const refreshPermission = useCallback(async () => {
        const authStatus = await hasPermission(getMessaging(getApp()));
        const enabled =
            authStatus === AuthorizationStatus.AUTHORIZED ||
            authStatus === AuthorizationStatus.PROVISIONAL;
        setNotificationsEnabled(enabled);
    }, []);

    useEffect(() => {
        refreshPermission();
    }, [refreshPermission]);

    const onToggleNotifications = useCallback(
        async (value: boolean) => {
            if (value) {
                // Registers with the OS + backend, same path as login.
                await registerFCMToken('driver');
                await refreshPermission();
            } else {
                // iOS/Android don't let apps revoke their own notification
                // permission — the OS settings screen is the only way.
                // Reflect that honestly instead of pretending to toggle it off.
                Alert.alert(
                    'Turn off notifications',
                    'Notification permissions can only be changed from your device Settings app.',
                );
            }
        },
        [refreshPermission],
    );

    const logout = useCallback(() => {
        Alert.alert('Logout', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: () => logoutMutation.mutate() },
        ]);
    }, [logoutMutation]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
                    <ChevronLeft color="#111" size={24} />
                </Pressable>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.row}>
                <Text style={styles.rowLabel}>Push Notifications</Text>
                <Switch
                    value={!!notificationsEnabled}
                    onValueChange={onToggleNotifications}
                    disabled={notificationsEnabled === null}
                />
            </View>

            <View style={styles.row}>
                <Text style={styles.rowLabel}>App Version</Text>
                <Text style={styles.rowValue}>{appVersion}</Text>
            </View>

            <Pressable style={styles.logout} onPress={logout}>
                <LogOut color="#FFF" size={16} />
                <Text style={styles.logoutText}>Logout</Text>
            </Pressable>
        </View>
    );
};

export default SettingsScreen;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7F7F7' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#EEE',
    },
    headerTitle: { fontSize: 16, fontWeight: '700' },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFF',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#EEE',
    },
    rowLabel: { fontSize: 15, color: '#1F2937' },
    rowValue: { fontSize: 15, color: '#666' },
    logout: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        margin: 16,
        backgroundColor: '#FF3B30',
        padding: 14,
        borderRadius: 12,
    },
    logoutText: { color: '#FFF', fontWeight: '700' },
});
