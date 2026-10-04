
















import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Switch } from 'react-native';
import { ScreenHeader } from '@components/ScreenHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getApp } from '@react-native-firebase/app';
import { getMessaging, hasPermission, AuthorizationStatus } from '@react-native-firebase/messaging';
import { ChevronRight, Bell, Globe, Map, Gift, Info, FileText, ShieldCheck, UserX, LogOut } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useLogout } from '@hooks/useLogout';
import { useMe } from '@hooks/useMe';
import { useUpdateNotificationPreferences } from '@hooks/useNotificationPreferences';
import { registerFCMToken } from '@utils/cm';
import { useAppTheme } from '@theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { confirmDialog } from '@ui/alert/confirmStore';
import { getOfflineMapsEnabled, setOfflineMapsEnabled } from '@services/storage';
import { LanguagePickerModal } from '@components/LanguagePickerModal';
import { LANGUAGE_LABELS, type SupportedLanguage } from '../../i18n';

const { version: appVersion } = require('../../../package.json');

const SettingsScreen = () => {
    const navigation = useNavigation();
    const { t, i18n } = useTranslation();
    const { colors, fonts } = useAppTheme();
    const logoutMutation = useLogout();
    const { data: me } = useMe();
    const { mutate: updatePrefs } = useUpdateNotificationPreferences();
    const [notificationsEnabled, setNotificationsEnabled] = useState<boolean | null>(null);
    const [offlineMaps, setOfflineMaps] = useState(() => getOfflineMapsEnabled());
    const [langVisible, setLangVisible] = useState(false);
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => makeStyles(colors, fonts, insets), [colors, fonts, insets]);

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
                await registerFCMToken('customer');
                await refreshPermission();
            } else {
                await confirmDialog({
                    title: t('settings.turnOffTitle'),
                    message: t('settings.turnOffMessage'),
                    confirmText: t('common.close'),
                    cancelText: undefined,
                });
            }
        },
        [refreshPermission, t],
    );

    const onToggleOfflineMaps = useCallback((value: boolean) => {
        setOfflineMaps(value);
        setOfflineMapsEnabled(value);
    }, []);

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
            <ScreenHeader title={t('settings.title')} />

            <Text style={styles.sectionLabel}>{t('settings.notificationsSection')}</Text>
            <View style={styles.row}>
                <View style={styles.rowLeft}>
                    <Bell size={17} color={colors.TEXT_SECONDARY} />
                    <Text style={styles.rowLabel}>{t('settings.pushNotifications')}</Text>
                </View>
                <Switch
                    value={!!notificationsEnabled}
                    onValueChange={onToggleNotifications}
                    disabled={notificationsEnabled === null}
                />
            </View>

            {}
            <View style={styles.row}>
                <Text style={styles.rowLabelIndented}>{t('settings.notifyOrderUpdates')}</Text>
                <Switch
                    value={me?.notifyOrderUpdates ?? true}
                    onValueChange={(v) => updatePrefs({ notifyOrderUpdates: v })}
                />
            </View>
            <View style={styles.row}>
                <Text style={styles.rowLabelIndented}>{t('settings.notifyPromotions')}</Text>
                <Switch
                    value={me?.notifyPromotions ?? true}
                    onValueChange={(v) => updatePrefs({ notifyPromotions: v })}
                />
            </View>
            <View style={styles.row}>
                <Text style={styles.rowLabelIndented}>{t('settings.notifyReminders')}</Text>
                <Switch
                    value={me?.notifyReminders ?? true}
                    onValueChange={(v) => updatePrefs({ notifyReminders: v })}
                />
            </View>

            <Text style={styles.sectionLabel}>{t('settings.preferencesSection')}</Text>
            <Pressable style={styles.row} onPress={() => setLangVisible(true)}>
                <View style={styles.rowLeft}>
                    <Globe size={17} color={colors.TEXT_SECONDARY} />
                    <Text style={styles.rowLabel}>{t('profile.language')}</Text>
                </View>
                <View style={styles.rowRight}>
                    <Text style={styles.rowValue}>{LANGUAGE_LABELS[i18n.language as SupportedLanguage] ?? LANGUAGE_LABELS.en}</Text>
                    <ChevronRight size={16} color={colors.GRAY} />
                </View>
            </Pressable>
            <View style={styles.row}>
                <View style={styles.rowLeft}>
                    <Map size={17} color={colors.TEXT_SECONDARY} />
                    <View>
                        <Text style={styles.rowLabel}>{t('settings.offlineMaps')}</Text>
                        <Text style={styles.rowHint}>{t('settings.offlineMapsHint')}</Text>
                    </View>
                </View>
                <Switch value={offlineMaps} onValueChange={onToggleOfflineMaps} />
            </View>

            <Text style={styles.sectionLabel}>{t('settings.legalSection')}</Text>
            <Pressable
                style={styles.row}
                onPress={() => (navigation as any).navigate('WebView', { url: 'https://kalanabhalogistics.com/privacy', title: t('settings.privacyPolicy') })}
            >
                <View style={styles.rowLeft}>
                    <ShieldCheck size={17} color={colors.TEXT_SECONDARY} />
                    <Text style={styles.rowLabel}>{t('settings.privacyPolicy')}</Text>
                </View>
                <ChevronRight size={16} color={colors.GRAY} />
            </Pressable>
            <Pressable
                style={styles.row}
                onPress={() => (navigation as any).navigate('WebView', { url: 'https://kalanabhalogistics.com/terms', title: t('settings.termsOfService') })}
            >
                <View style={styles.rowLeft}>
                    <FileText size={17} color={colors.TEXT_SECONDARY} />
                    <Text style={styles.rowLabel}>{t('settings.termsOfService')}</Text>
                </View>
                <ChevronRight size={16} color={colors.GRAY} />
            </Pressable>
            <Pressable style={styles.row} onPress={requestDeleteAccount}>
                <View style={styles.rowLeft}>
                    <UserX size={17} color={colors.ERROR} />
                    <Text style={[styles.rowLabel, { color: colors.ERROR }]}>{t('settings.deleteAccount')}</Text>
                </View>
                <ChevronRight size={16} color={colors.GRAY} />
            </Pressable>

            <Text style={styles.sectionLabel}>{t('settings.aboutSection')}</Text>
            <Pressable style={styles.row} onPress={() => (navigation as any).navigate('Referral')}>
                <View style={styles.rowLeft}>
                    <Gift size={17} color={colors.TEXT_SECONDARY} />
                    <Text style={styles.rowLabel}>{t('settings.inviteAFriend')}</Text>
                </View>
                <ChevronRight size={16} color={colors.GRAY} />
            </Pressable>
            <View style={styles.row}>
                <View style={styles.rowLeft}>
                    <Info size={17} color={colors.TEXT_SECONDARY} />
                    <Text style={styles.rowLabel}>{t('settings.appVersion')}</Text>
                </View>
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

const makeStyles = (
    colors: ReturnType<typeof useAppTheme>['colors'],
    fonts: ReturnType<typeof useAppTheme>['fonts'],
    insets: { top: number },
) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.BACKGROUND },
    sectionLabel: {
        fontSize: 11.5, fontFamily: fonts.BOLD_PRIMARY, color: colors.TEXT_SECONDARY,
        textTransform: 'uppercase', letterSpacing: 0.4,
        paddingHorizontal: 16, marginTop: 20, marginBottom: 6,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.SURFACE,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.BORDER,
    },
    rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
    rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    rowLabel: { fontSize: 14.5, fontFamily: fonts.MEDIUM_PRIMARY, color: colors.TEXT_PRIMARY },
    rowLabelIndented: { fontSize: 13.5, fontFamily: fonts.PRIMARY, color: colors.TEXT_SECONDARY, marginLeft: 29 },
    rowHint: { fontSize: 11, fontFamily: fonts.PRIMARY, color: colors.TEXT_SECONDARY, marginTop: 1, maxWidth: 220 },
    rowValue: { fontSize: 13.5, fontFamily: fonts.PRIMARY, color: colors.TEXT_SECONDARY },
    logout: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        margin: 16,
        marginTop: 28,
        backgroundColor: colors.ERROR,
        padding: 14,
        borderRadius: 12,
    },
    logoutText: { color: '#FFF', fontFamily: fonts.BOLD_PRIMARY, fontSize: 14 },
});
