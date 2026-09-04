import React, { useMemo } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import {
    useMarkAllNotificationsRead,
    useMarkNotificationRead,
    useMyNotifications,
} from '@features/notifications/hooks';
import type { BackendNotification } from '@features/notifications/types';
import { AsyncState } from '@components/AsyncState';
import { useAppTheme } from '@theme/ThemeContext';

// Screen -> hook -> notifications.api -> GET /notifications/mine -> cache -> UI
const NotificationScreen = () => {
    const { colors } = useAppTheme();
    const styles = useMemo(() => makeStyles(colors), [colors]);
    const { data: notifications, isLoading, isRefetching, refetch, error } = useMyNotifications();
    const { mutate: markRead } = useMarkNotificationRead();
    const { mutate: markAllRead, isPending: markingAll } = useMarkAllNotificationsRead();

    const renderItem = ({ item }: { item: BackendNotification }) => (
        <Pressable
            style={[styles.card, !item.read && styles.cardUnread]}
            onPress={() => !item.read && markRead(item.id)}
        >
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
            <Text style={styles.time}>{new Date(item.createdAt).toLocaleString()}</Text>
        </Pressable>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Notifications</Text>
                {!!notifications?.length && (
                    <Pressable onPress={() => markAllRead()} disabled={markingAll}>
                        <Text style={styles.markAllText}>Mark all read</Text>
                    </Pressable>
                )}
            </View>

            <AsyncState
                isLoading={isLoading}
                error={error}
                onRetry={refetch}
                isEmpty={!notifications?.length}
                emptyTitle="No notifications yet"
            >
                <FlatList
                    data={notifications ?? []}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
                />
            </AsyncState>
        </View>
    );
};

export default NotificationScreen;

// Computed from useAppTheme() so this screen repaints correctly in dark
// mode instead of staying pinned to the light palette baked at import.
const makeStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.BACKGROUND },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: colors.TEXT_PRIMARY },
    markAllText: { color: colors.PRIMARY, fontSize: 13, fontWeight: '600' },
    card: {
        backgroundColor: colors.SURFACE,
        marginHorizontal: 16,
        marginBottom: 10,
        padding: 14,
        borderRadius: 12,
    },
    cardUnread: { borderLeftWidth: 3, borderLeftColor: colors.PRIMARY },
    title: { fontSize: 14, fontWeight: '700', color: colors.TEXT_PRIMARY },
    body: { fontSize: 13, color: colors.TEXT_SECONDARY, marginTop: 4 },
    time: { fontSize: 11, color: colors.GRAY, marginTop: 6 },
});
