// components/DriverHeader.tsx
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Switch, ViewStyle } from 'react-native';
import { Circle } from 'lucide-react-native';
import { useAuthStore } from '@features/store/authStore';
import { useSetOnlineStatus } from '@hooks/useSetOnlineStatus';
import { useAppTheme } from '@theme/ThemeContext';

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
    const { colors, fonts } = useAppTheme();
    const styles = useMemo(() => makeStyles(colors, fonts), [colors, fonts]);
    // Was a raw, untracked apiClient.patch call with no loading/error
    // handling and no store sync — if it failed, the switch still looked
    // toggled even though the server rejected it. useSetOnlineStatus
    // mirrors useUpdateProfile's real success/error handling.
    const { mutate: setOnlineStatus, isPending } = useSetOnlineStatus();

    return (
        <View style={[styles.container, style]}>
            <View style={styles.topRow}>
                <View>
                    <Text style={styles.greeting}>Hello, {user?.displayName ?? 'Driver'}</Text>
                    <View style={styles.statusRow}>
                        <Circle
                            size={8}
                            color={isOnline ? colors.SUCCESS : colors.ERROR}
                            fill={isOnline ? colors.SUCCESS : colors.ERROR}
                        />
                        <Text style={styles.sub}>{isOnline ? 'You are online' : 'You are offline'}</Text>
                    </View>
                </View>
                <View style={styles.toggleWrap}>
                    <Text style={styles.toggleLabel}>{isOnline ? 'Online' : 'Offline'}</Text>
                    <Switch
                        value={isOnline}
                        onValueChange={(value) => setOnlineStatus(value)}
                        disabled={isPending}
                        trackColor={{ false: colors.BORDER, true: colors.PRIMARY_LIGHT }}
                        thumbColor={isOnline ? colors.PRIMARY : colors.GRAY}
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

const makeStyles = (colors: ReturnType<typeof useAppTheme>['colors'], fonts: ReturnType<typeof useAppTheme>['fonts']) => StyleSheet.create({
    container: {
        backgroundColor: colors.SURFACE,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.BORDER,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    greeting: { fontSize: 16, fontFamily: fonts.BOLD_PRIMARY, color: colors.TEXT_PRIMARY },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
    sub: { fontSize: 12, color: colors.TEXT_SECONDARY },
    toggleWrap: { alignItems: 'center', gap: 4 },
    toggleLabel: { fontSize: 11, color: colors.TEXT_SECONDARY },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: colors.PRIMARY_LIGHT,
        borderRadius: 12,
        padding: 12,
    },
    statBox: { flex: 1, alignItems: 'center' },
    statNum: { fontSize: 18, fontFamily: fonts.BOLD_PRIMARY, color: colors.PRIMARY_DARK },
    statLabel: { fontSize: 11, color: colors.TEXT_SECONDARY, marginTop: 2 },
    divider: { width: 1, backgroundColor: colors.BORDER, marginHorizontal: 8 },
});
