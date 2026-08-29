import React from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import {
    useMarkAllNotificationsRead,
    useMarkNotificationRead,
    useMyNotifications,
} from '@features/notifications/hooks';
import type { BackendNotification } from '@features/notifications/types';
import { AsyncState } from '@components/AsyncState';

// Screen -> hook -> notifications.api -> GET /notifications/mine -> cache -> UI
const NotificationScreen = () => {
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

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    markAllText: { color: '#2563EB', fontSize: 13, fontWeight: '600' },
    card: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginBottom: 10,
        padding: 14,
        borderRadius: 12,
    },
    cardUnread: { borderLeftWidth: 3, borderLeftColor: '#2563EB' },
    title: { fontSize: 14, fontWeight: '700', color: '#111827' },
    body: { fontSize: 13, color: '#4B5563', marginTop: 4 },
    time: { fontSize: 11, color: '#9CA3AF', marginTop: 6 },
});
