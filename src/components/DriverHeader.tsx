// components/DriverHeader.tsx
//
// Was a plain white card with a tiny Switch — revamped to match the
// brand mockup: gradient header, a real initials avatar (no photo field
// exists on the backend for drivers, same pattern used everywhere else
// this app needs a "photo" it doesn't have) with a real online/offline
// dot overlapping its corner, a proper pill-shaped Go Online/Go Offline
// button instead of a tiny switch, and a real notification bell (reusing
// the same GET /notifications/mine unread count the customer header
// already uses — that endpoint is role-agnostic, just req.user-scoped).
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { Power, Bell, ShieldAlert } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@features/store/authStore';
import { useSetOnlineStatus } from '@hooks/useSetOnlineStatus';
import { useUnreadNotificationCount } from '@features/notifications/hooks';
import { useAppTheme } from '@theme/ThemeContext';
import { showToast } from '@ui/alert/toastStore';
import { normalizeError } from '@utils/error';

interface DriverHeaderProps {
    earnings: number;
    deliveredToday: number;
    isOnline: boolean;
    style?: ViewStyle;
    // No emergency-dispatch system exists on the backend — this just opens
    // a real support email (see HomeScreen.tsx's handleSos), same as
    // before this was a separate overlay button; now a header action so it
    // doesn't collide with the bell/toggle now living in the same corner.
    onSos: () => void;
}

const initialsFor = (label: string) =>
    label.trim().split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase() || 'D';

export const DriverHeader: React.FC<DriverHeaderProps> = ({
    earnings,
    deliveredToday,
    isOnline,
    style,
    onSos,
}) => {
    const navigation = useNavigation();
    const user = useAuthStore((s) => s.user);
    const { colors, fonts } = useAppTheme();
    // Real device safe-area inset — was a bare paddingTop: 14, so the
    // avatar/name/toggle sat under the status bar/camera cutout on real
    // devices (same overlap bug already fixed on ShipmentChatScreen,
    // onboarding, SelectAccount, both tab bars).
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => makeStyles(colors, fonts, insets), [colors, fonts, insets]);
    const { mutate: setOnlineStatus, isPending } = useSetOnlineStatus();
    const { data: unreadCount } = useUnreadNotificationCount();
    const hasUnread = (unreadCount ?? 0) > 0;

    const displayName = user?.displayName ?? 'Driver';

    return (
        <LinearGradient colors={[colors.PRIMARY, colors.PRIMARY_DARK]} style={[styles.container, style]}>
            <View style={styles.topRow}>
                <View style={styles.identity}>
                    <View style={styles.avatarWrap}>
                        <Text style={styles.avatarText}>{initialsFor(displayName)}</Text>
                        <View style={[styles.onlineDot, { backgroundColor: isOnline ? colors.SUCCESS : colors.GRAY }]} />
                    </View>
                    <View>
                        <Text style={styles.greeting}>{displayName}</Text>
                        <View style={styles.statusRow}>
                            <View style={[styles.statusDot, { backgroundColor: isOnline ? colors.SUCCESS : 'rgba(255,255,255,0.6)' }]} />
                            <Text style={styles.sub}>{isOnline ? 'You are online' : 'You are offline'}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.actionsRow}>
                    <Pressable
                        style={styles.togglePill}
                        disabled={isPending}
                        onPress={() =>
                            setOnlineStatus(!isOnline, {
                                // Real gate now (kalanabhaBackend
                                // UsersService.setOnlineStatus) — a driver
                                // whose documents aren't admin-approved
                                // gets a real 403 here instead of the
                                // toggle just silently doing nothing.
                                onError: (err) => showToast(normalizeError(err) || 'Could not update status', 'error'),
                            })
                        }
                    >
                        <Power size={14} color={colors.PRIMARY} />
                        <Text style={styles.togglePillText}>{isOnline ? 'Go Offline' : 'Go Online'}</Text>
                    </Pressable>
                    <Pressable style={styles.bellBtn} onPress={() => (navigation as any).navigate('Notification')} hitSlop={8}>
                        <Bell size={18} color="#fff" />
                        {hasUnread && <View style={styles.bellBadge} />}
                    </Pressable>
                    <Pressable style={styles.sosBtn} onPress={onSos} hitSlop={8}>
                        <ShieldAlert size={16} color="#fff" />
                    </Pressable>
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
        </LinearGradient>
    );
};

const makeStyles = (
    colors: ReturnType<typeof useAppTheme>['colors'],
    fonts: ReturnType<typeof useAppTheme>['fonts'],
    insets: { top: number },
) => StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingTop: insets.top + 10,
        paddingBottom: 16,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    identity: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    avatarWrap: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.22)',
        borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
        alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { color: '#fff', fontSize: 15, fontFamily: fonts.BOLD_PRIMARY },
    onlineDot: {
        position: 'absolute', bottom: -1, right: -1,
        width: 12, height: 12, borderRadius: 6,
        borderWidth: 2, borderColor: colors.PRIMARY,
    },
    greeting: { fontSize: 16, fontFamily: fonts.BOLD_PRIMARY, color: '#fff' },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    sub: { fontSize: 12, fontFamily: fonts.MEDIUM_PRIMARY, color: 'rgba(255,255,255,0.85)' },

    actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    togglePill: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#fff', borderRadius: 999,
        paddingHorizontal: 12, paddingVertical: 8,
    },
    togglePillText: { fontSize: 12, fontFamily: fonts.BOLD_PRIMARY, color: colors.PRIMARY },
    bellBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center', justifyContent: 'center',
    },
    bellBadge: {
        position: 'absolute', top: 7, right: 8,
        width: 8, height: 8, borderRadius: 4,
        backgroundColor: colors.ERROR, borderWidth: 1.5, borderColor: colors.PRIMARY,
    },
    sosBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: colors.ERROR,
        alignItems: 'center', justifyContent: 'center',
    },

    statsRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.16)',
        borderRadius: 14,
        padding: 12,
    },
    statBox: { flex: 1, alignItems: 'center' },
    statNum: { fontSize: 18, fontFamily: fonts.BOLD_PRIMARY, color: '#fff' },
    statLabel: { fontSize: 11, fontFamily: fonts.MEDIUM_PRIMARY, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
    divider: { width: 1, backgroundColor: 'rgba(255,255,255,0.25)', marginHorizontal: 8 },
});
