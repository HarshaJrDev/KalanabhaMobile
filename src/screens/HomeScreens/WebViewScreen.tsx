// WebViewScreen.tsx — Customer & Driver
//
// Generic in-app browser for a real URL, passed via route params. Backs
// Settings' Privacy Policy / Terms of Service rows — those point at the
// real pages already live on the KalanabhaWebsite marketing site
// (kalanabhalogistics.com/privacy, /terms), not a fake/placeholder
// in-app page duplicating content that has to be kept in sync in two
// places.
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { useAppTheme } from '@theme/ThemeContext';

const WebViewScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { colors, fonts, spacing } = useAppTheme();
    const insets = useSafeAreaInsets();
    const styles = React.useMemo(() => makeStyles(colors, fonts, spacing, insets), [colors, fonts, spacing, insets]);
    const [loading, setLoading] = useState(true);

    const url: string = route.params?.url;
    const title: string = route.params?.title ?? '';

    return (
        <View style={styles.root}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
                    <ArrowLeft color={colors.TEXT_PRIMARY} size={22} />
                </Pressable>
                <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
                <View style={{ width: 40 }} />
            </View>

            <WebView
                source={{ uri: url }}
                style={styles.webview}
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
            />
            {loading && (
                <View style={styles.loadingOverlay} pointerEvents="none">
                    <ActivityIndicator size="large" color={colors.PRIMARY} />
                </View>
            )}
        </View>
    );
};

export default WebViewScreen;

const makeStyles = (
    colors: ReturnType<typeof useAppTheme>['colors'],
    fonts: ReturnType<typeof useAppTheme>['fonts'],
    spacing: ReturnType<typeof useAppTheme>['spacing'],
    insets: { top: number },
) => StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.BACKGROUND },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingTop: insets.top + 10,
        paddingBottom: spacing.md,
        backgroundColor: colors.SURFACE,
        borderBottomWidth: 1,
        borderBottomColor: colors.BORDER,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: colors.BACKGROUND,
        borderWidth: 1, borderColor: colors.BORDER,
    },
    headerTitle: { flex: 1, textAlign: 'center', fontFamily: fonts.BOLD_PRIMARY, fontSize: 16, color: colors.TEXT_PRIMARY },
    webview: { flex: 1 },
    loadingOverlay: { ...StyleSheet.absoluteFillObject, top: insets.top + 60, alignItems: 'center', justifyContent: 'center' },
});
