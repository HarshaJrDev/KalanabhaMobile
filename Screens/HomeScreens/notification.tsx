import React from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import {
    useMarkAllNotificationsRead,
    useMarkNotificationRead,
    useMyNotifications,
} from '../../features/notifications/hooks';
import type { BackendNotification } from '../../features/notifications/types';

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
                <Text style={styles.errorText}>{error.message}</Text>
                <Pressable style={styles.retryButton} onPress={() => refetch()}>
                    <Text style={styles.retryText}>Retry</Text>
                </Pressable>
            </View>
        );
    }

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

            <FlatList
                data={notifications ?? []}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
                contentContainerStyle={notifications?.length ? undefined : styles.emptyContainer}
                ListEmptyComponent={
                    <View style={styles.center}>
                        <Text style={styles.emptyText}>No notifications yet</Text>
                    </View>
                }
            />
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
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    emptyContainer: { flexGrow: 1 },
    emptyText: { color: '#6B7280', fontSize: 14 },
    errorText: { color: '#DC2626', fontSize: 14, marginBottom: 12 },
    retryButton: { backgroundColor: '#2563EB', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
    retryText: { color: '#fff', fontWeight: '600' },
});
