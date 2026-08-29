// components/DriverHeader.tsx
import React from 'react';
import { View, Text, StyleSheet, Switch, ViewStyle } from 'react-native';
import { useAuthStore } from '../features/store/authStore';
import { apiClient } from '../src/api/client';

interface DriverHeaderProps {
    earnings: number;
    deliveredToday: number;
    isOnline: boolean;
    style?: ViewStyle;
}

export const DriverHeader: React.FC<DriverHeaderProps> = ({
    earnings,
    deliveredToday,
    isOnline,
    style,
}) => {
    const user = useAuthStore((s) => s.user);

    // PATCH /users/me/online-status — kalanabhaBackend UsersController
    // (driver-role guarded server-side).
    const toggleOnline = async (value: boolean) => {
        try {
            await apiClient.patch('/users/me/online-status', { isOnline: value });
        } catch (e) {
            console.error('[DriverHeader] toggleOnline error:', e);
        }
    };

    return (
        <View style={[styles.container, style]}>
            <View style={styles.topRow}>
                <View>
                    <Text style={styles.greeting}>Hello, {user?.displayName ?? 'Driver'} 👋</Text>
                    <Text style={styles.sub}>
                        {isOnline ? '🟢 You are online' : '🔴 You are offline'}
                    </Text>
                </View>
                <View style={styles.toggleWrap}>
                    <Text style={styles.toggleLabel}>{isOnline ? 'Online' : 'Offline'}</Text>
                    <Switch
                        value={isOnline}
                        onValueChange={toggleOnline}
                        trackColor={{ false: '#E5E7EB', true: '#BBF7D0' }}
                        thumbColor={isOnline ? '#10B981' : '#9CA3AF'}
                    />
                </View>
            </View>
            <View style={styles.statsRow}>
                <View style={styles.statBox}>
                    <Text style={styles.statNum}>₹{earnings.toLocaleString()}</Text>
                    <Text style={styles.statLabel}>Today's earnings</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.statBox}>
                    <Text style={styles.statNum}>{deliveredToday}</Text>
                    <Text style={styles.statLabel}>Delivered today</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFF',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    greeting: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
    sub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    toggleWrap: { alignItems: 'center', gap: 4 },
    toggleLabel: { fontSize: 11, color: '#6B7280' },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: '#F0FDF4',
        borderRadius: 12,
        padding: 12,
    },
    statBox: { flex: 1, alignItems: 'center' },
    statNum: { fontSize: 18, fontWeight: '800', color: '#059669' },
    statLabel: { fontSize: 11, color: '#6B7280', marginTop: 2 },
    divider: { width: 1, backgroundColor: '#D1FAE5', marginHorizontal: 8 },
});
