import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { WifiOff, AlertCircle, Inbox, RefreshCw } from 'lucide-react-native';
import { useIsOnline } from '@api/network';
import { useTranslation } from 'react-i18next';
import FONTS from '@utils/fonts';

interface AsyncStateProps {
    isLoading: boolean;
    error?: Error | null;
    isEmpty?: boolean;
    onRetry?: () => void;
    emptyTitle?: string;
    emptyMessage?: string;
    children: React.ReactNode;
}

/**
 * Single reusable loading / offline / error / empty pattern, so screens
 * don't each hand-roll their own ActivityIndicator/error box. Renders
 * `children` once none of those states apply.
 *
 * Usage: `<AsyncState isLoading={...} error={...} isEmpty={!data?.length} onRetry={refetch}>...</AsyncState>`
 */
export const AsyncState: React.FC<AsyncStateProps> = ({
    isLoading,
    error,
    isEmpty,
    onRetry,
    emptyTitle,
    emptyMessage,
    children,
}) => {
    const online = useIsOnline();
    const { t } = useTranslation();
    const resolvedEmptyTitle = emptyTitle ?? t('asyncState.nothingHereYet');

    if (!online && !isLoading) {
        return (
            <View style={styles.center}>
                <WifiOff size={40} color="#9CA3AF" />
                <Text style={styles.title}>{t('asyncState.offline')}</Text>
                <Text style={styles.message}>{t('asyncState.offlineHint')}</Text>
                {onRetry && (
                    <Pressable style={styles.retryButton} onPress={onRetry}>
                        <RefreshCw size={14} color="#fff" />
                        <Text style={styles.retryText}>{t('common.retry')}</Text>
                    </Pressable>
                )}
            </View>
        );
    }

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.center}>
                <AlertCircle size={40} color="#EF4444" />
                <Text style={styles.title}>{t('asyncState.somethingWentWrong')}</Text>
                <Text style={styles.message}>{error.message}</Text>
                {onRetry && (
                    <Pressable style={styles.retryButton} onPress={onRetry}>
                        <RefreshCw size={14} color="#fff" />
                        <Text style={styles.retryText}>{t('common.retry')}</Text>
                    </Pressable>
                )}
            </View>
        );
    }

    if (isEmpty) {
        return (
            <View style={styles.center}>
                <Inbox size={40} color="#9CA3AF" />
                <Text style={styles.title}>{resolvedEmptyTitle}</Text>
                {!!emptyMessage && <Text style={styles.message}>{emptyMessage}</Text>}
            </View>
        );
    }

    return <>{children}</>;
};

const styles = StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 6 },
    title: { fontSize: 15, fontFamily: FONTS.BOLD_PRIMARY, color: '#111827', marginTop: 8 },
    message: { fontSize: 13, color: '#6B7280', textAlign: 'center' },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#2563EB',
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 10,
        marginTop: 12,
    },
    retryText: { color: '#fff', fontFamily: FONTS.SEMI_BOLD_PRIMARY, fontSize: 13 },
});
