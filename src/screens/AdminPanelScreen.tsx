import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { WebView } from 'react-native-webview';
import { LogOut } from 'lucide-react-native';
import { ScreenHeader } from '@components/ScreenHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { ADMIN_PANEL_URL } from '@config/env';
import { useLogout } from '@hooks/useLogout';
import { getMe } from '@features/users/api/users.api';

// This screen makes no API calls of its own (it just shows a WebView), so
// the apiClient 401 interceptor that normally catches an expired session
// never fires here. Polling /users/me is what gives that interceptor a
// chance to run — on failure it already calls endSession() (see
// src/api/client.ts), which flips authStore.user to null and App.tsx
// swaps back to the login stack automatically.
const SESSION_CHECK_INTERVAL_MS = 60_000;

const AdminPanelScreen = () => {
    const { colors, fonts, spacing } = useAppTheme();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
    const styles = React.useMemo(
        () => makeStyles(colors, fonts, spacing, insets),
        [colors, fonts, spacing, insets],
    );
    const [loading, setLoading] = useState(true);
    const { mutate: logout } = useLogout();

    useEffect(() => {
        const interval = setInterval(() => {
            getMe().catch(() => {});
        }, SESSION_CHECK_INTERVAL_MS);
        return () => clearInterval(interval);
    }, []);

    return (
        <View style={styles.root}>
            <ScreenHeader
                title={t('login.kalanabhaAdminPanel')}
                showBack={false}
                rightSlot={
                    <Pressable onPress={() => logout()} hitSlop={12}>
                        <LogOut color={colors.TEXT_PRIMARY} size={20} />
                    </Pressable>
                }
            />

            <WebView
                source={{ uri: ADMIN_PANEL_URL }}
                style={styles.webview}
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
                cacheEnabled={false}
                incognito
            />
            {loading && (
                <View style={styles.loadingOverlay} pointerEvents="none">
                    <ActivityIndicator size="large" color={colors.PRIMARY} />
                </View>
            )}
        </View>
    );
};

export default AdminPanelScreen;

const makeStyles = (
    colors: ReturnType<typeof useAppTheme>['colors'],
    fonts: ReturnType<typeof useAppTheme>['fonts'],
    spacing: ReturnType<typeof useAppTheme>['spacing'],
    insets: { top: number },
) =>
    StyleSheet.create({
        root: { flex: 1, backgroundColor: colors.BACKGROUND },
        webview: { flex: 1 },
        loadingOverlay: {
            ...StyleSheet.absoluteFillObject,
            top: insets.top + 60,
            alignItems: 'center',
            justifyContent: 'center',
        },
    });
