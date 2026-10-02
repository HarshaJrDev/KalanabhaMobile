// SettingsScreen.tsx — Driver
//
// Minimal real settings screen (replacing the Profile menu's "Settings"
// no-op): notification permission status (backed by the same
// @react-native-firebase/messaging used by utils/fcm.ts's registerFCMToken),
// app version (from package.json — no native DeviceInfo dependency in this
// project), and logout. No new backend endpoints — everything here is
// either on-device or reuses the existing POST /auth/logout flow.
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Switch } from 'react-native';
import { getApp } from '@react-native-firebase/app';
import { getMessaging, hasPermission, AuthorizationStatus } from '@react-native-firebase/messaging';
import { ChevronLeft, ChevronRight, Globe, LogOut } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useLogout } from '@hooks/useLogout';
import { useMe } from '@hooks/useMe';
import { useUpdateNotificationPreferences } from '@hooks/useNotificationPreferences';
import { registerFCMToken } from '@utils/cm';
import { useAppTheme } from '@theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { confirmDialog } from '@ui/alert/confirmStore';
import { LanguagePickerModal } from '@components/LanguagePickerModal';
import { LANGUAGE_LABELS, type SupportedLanguage } from '../../i18n';
import FONTS from '@utils/fonts';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version: appVersion } = require('../../../package.json');

const SettingsScreen = () => {
    const navigation = useNavigation();
    const { t, i18n } = useTranslation();
    const { colors } = useAppTheme();
    const logoutMutation = useLogout();
    const { data: me } = useMe();
    const { mutate: updatePrefs } = useUpdateNotificationPreferences();
    const [notificationsEnabled, setNotificationsEnabled] = useState<boolean | null>(null);
    const [langVisible, setLangVisible] = useState(false);

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
                await confirmDialog({
                    title: t('settings.turnOffTitle'),
                    message: t('settings.turnOffMessage'),
                    confirmText: t('common.close'),
                });
            }
        },
        [refreshPermission, t],
    );

    const logout = useCallback(async () => {
        const confirmed = await confirmDialog({
            title: t('common.logout'),
            message: t('settings.logoutConfirm'),
            confirmText: t('common.logout'),
            destructive: true,
        });
        if (confirmed) logoutMutation.mutate();
    }, [logoutMutation, t]);

    const requestDeleteAccount = useCallback(async () => {
        const confirmed = await confirmDialog({
            title: t('settings.deleteAccountTitle'),
            message: t('settings.deleteAccountMessage'),
            confirmText: t('settings.deleteAccountConfirm'),
            destructive: true,
        });
        if (confirmed) {
            (navigation as any).navigate('NewTicket', {
                prefillCategory: 'Other',
                prefillSubject: t('settings.deleteAccountTicketSubject'),
                prefillDescription: t('settings.deleteAccountTicketDescription'),
            });
        }
    }, [navigation, t]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
                    <ChevronLeft color="#111" size={24} />
                </Pressable>
                <Text style={styles.headerTitle}>{t('settings.title')}</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.row}>
                <Text style={styles.rowLabel}>{t('settings.pushNotifications')}</Text>
                <Switch
                    value={!!notificationsEnabled}
                    onValueChange={onToggleNotifications}
                    disabled={notificationsEnabled === null}
                />
            </View>

            <View style={styles.row}>
                <Text style={styles.rowLabel}>{t('settings.notifyOrderUpdates')}</Text>
                <Switch
                    value={me?.notifyOrderUpdates ?? true}
                    onValueChange={(v) => updatePrefs({ notifyOrderUpdates: v })}
                />
            </View>
            <View style={styles.row}>
                <Text style={styles.rowLabel}>{t('settings.notifyPromotions')}</Text>
                <Switch
                    value={me?.notifyPromotions ?? true}
                    onValueChange={(v) => updatePrefs({ notifyPromotions: v })}
                />
            </View>
            <View style={styles.row}>
                <Text style={styles.rowLabel}>{t('settings.notifyReminders')}</Text>
                <Switch
                    value={me?.notifyReminders ?? true}
                    onValueChange={(v) => updatePrefs({ notifyReminders: v })}
                />
            </View>

            <Pressable style={styles.row} onPress={() => setLangVisible(true)}>
                <Text style={styles.rowLabel}>{t('profile.language')}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.rowValue}>{LANGUAGE_LABELS[i18n.language as SupportedLanguage] ?? LANGUAGE_LABELS.en}</Text>
                    <ChevronRight size={16} color={colors.GRAY} />
                </View>
            </Pressable>

            <Pressable
                style={styles.row}
                onPress={() => (navigation as any).navigate('WebView', { url: 'https://kalanabhalogistics.com/privacy', title: t('settings.privacyPolicy') })}
            >
                <Text style={styles.rowLabel}>{t('settings.privacyPolicy')}</Text>
                <ChevronRight size={16} color={colors.GRAY} />
            </Pressable>
            <Pressable
                style={styles.row}
                onPress={() => (navigation as any).navigate('WebView', { url: 'https://kalanabhalogistics.com/terms', title: t('settings.termsOfService') })}
            >
                <Text style={styles.rowLabel}>{t('settings.termsOfService')}</Text>
                <ChevronRight size={16} color={colors.GRAY} />
            </Pressable>
            <Pressable style={styles.row} onPress={requestDeleteAccount}>
                <Text style={[styles.rowLabel, { color: colors.ERROR }]}>{t('settings.deleteAccount')}</Text>
                <ChevronRight size={16} color={colors.GRAY} />
            </Pressable>

            <View style={styles.row}>
                <Text style={styles.rowLabel}>{t('settings.appVersion')}</Text>
                <Text style={styles.rowValue}>{appVersion}</Text>
            </View>

            <Pressable style={styles.logout} onPress={logout}>
                <LogOut color="#FFF" size={16} />
                <Text style={styles.logoutText}>{t('common.logout')}</Text>
            </Pressable>

            <LanguagePickerModal visible={langVisible} onClose={() => setLangVisible(false)} />
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
    headerTitle: { fontSize: 16, fontFamily: FONTS.BOLD_PRIMARY },
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
    rowLabel: { fontSize: 15, fontFamily: FONTS.MEDIUM_PRIMARY, color: '#1F2937' },
    rowValue: { fontSize: 15, fontFamily: FONTS.PRIMARY, color: '#666' },
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
    logoutText: { color: '#FFF', fontFamily: FONTS.BOLD_PRIMARY },
});
