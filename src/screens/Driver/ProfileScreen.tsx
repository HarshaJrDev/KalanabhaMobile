// ProfileScreen.tsx — Driver
//
// Backed by GET /users/me (useMe) for the driver's real name/rating/
// delivery count, and the same real POST /auth/logout flow (useLogout)
// the customer Profile screen uses.
//
// `walletBalance` had no backing field on the backend (User model has no
// wallet concept) — stays removed rather than kept as fabricated data.
// The header avatar used to be a random stranger's photo from
// pravatar.cc — replaced with a real initials avatar (same pattern the
// incoming-request card on the Home screen already uses for a sender's
// initials), since there is no real driver photo anywhere on the backend.
//
// Trips/Documents/Payments/Support/Settings menu items: "Your Trips"
// opens a real screen (TripsScreen.tsx, GET /shipments/driver/mine).
// "My Documents" is new here — the upload screen already existed
// (DriverDocumentsScreen.tsx, real backend-backed KYC flow) but wasn't
// reachable from Profile, only from a Home-screen card; its real
// verified/pending state (useAuthStore) now shows as this row's
// subtitle. "Payments" stays an honest "Coming soon" toast — there's no
// Payment/payout model on the backend at all, nothing real to show.
// Support opens the device's mail client (no backend needed). Settings
// is a real screen (notification permission, app version, logout) — see
// SettingsScreen.tsx.
import React, { useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { FlashList } from '@shopify/flash-list';
import {
    Receipt,
    FileText,
    CreditCard,
    Headphones,
    Settings,
    ChevronRight,
    LogOut,
    Star,
} from 'lucide-react-native';
import { useMe } from '@hooks/useMe';
import { useLogout } from '@hooks/useLogout';
import { useAuthStore } from '@features/store/authStore';
import { showToast } from '@ui/alert/toastStore';
import { useAppTheme } from '@theme/ThemeContext';

type ProfileOption = {
    id: string;
    title: string;
    subtitle?: string;
    icon: React.ComponentType<{ color?: string; size?: number }>;
    iconBg: string;
    iconColor: string;
    onPress: () => void;
};

const useProfileActions = () => {
    const navigation = useNavigation();
    const logoutMutation = useLogout();

    const comingSoon = useCallback((feature: string) => {
        showToast(`${feature} is coming soon`, 'info');
    }, []);

    // Real ticket system now (kalanabhaBackend SupportController, already
    // used by the admin panel) instead of only a mailto: link — a raised
    // ticket gets a real reply thread here.
    const goSupport = useCallback(() => {
        navigation.navigate('SupportTickets' as never);
    }, [navigation]);

    const logout = useCallback(() => {
        Alert.alert('Logout', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: () => logoutMutation.mutate() },
        ]);
    }, [logoutMutation]);

    return {
        goTrips: () => navigation.navigate('DriverTrips' as never),
        goDocuments: () => navigation.navigate('DriverDocuments' as never),
        goPayments: () => comingSoon('Payments'),
        goSupport,
        goSettings: () => navigation.navigate('DriverSettings' as never),
        logout,
    };
};

const initialsFor = (label: string) =>
    label.trim().split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase() || 'D';

const ProfileScreen = () => {
    const { colors, fonts, fontSize, spacing, radius } = useAppTheme();
    const styles = useMemo(() => makeStyles(colors, fonts, fontSize, spacing, radius), [colors, fonts, fontSize, spacing, radius]);
    const { data: driver, isLoading, error, refetch } = useMe();
    const documentsVerified = useAuthStore((s) => s.user?.documentsVerified ?? false);
    const actions = useProfileActions();

    const displayName = driver?.displayName || driver?.email || 'Driver';

    const options: ProfileOption[] = [
        { id: '1', title: 'Your Trips', icon: Receipt, iconBg: colors.PRIMARY_LIGHT, iconColor: colors.PRIMARY, onPress: actions.goTrips },
        {
            id: '2',
            title: 'My Documents',
            subtitle: documentsVerified ? 'Verified' : 'Upload for admin review',
            icon: FileText,
            iconBg: documentsVerified ? '#DCFCE7' : '#FEF3C7',
            iconColor: documentsVerified ? '#16A34A' : '#D97706',
            onPress: actions.goDocuments,
        },
        { id: '3', title: 'Payments', icon: CreditCard, iconBg: colors.PRIMARY_LIGHT, iconColor: colors.PRIMARY, onPress: actions.goPayments },
        { id: '4', title: 'Support', icon: Headphones, iconBg: colors.PRIMARY_LIGHT, iconColor: colors.PRIMARY, onPress: actions.goSupport },
        { id: '5', title: 'Settings', icon: Settings, iconBg: colors.PRIMARY_LIGHT, iconColor: colors.PRIMARY, onPress: actions.goSettings },
    ];

    const renderItem = useCallback(
        ({ item, index }: { item: ProfileOption; index: number }) => {
            const Icon = item.icon;
            return (
                <Pressable
                    style={[styles.option, index === options.length - 1 && styles.optionLast]}
                    onPress={item.onPress}
                >
                    <View style={[styles.optionIconWrap, { backgroundColor: item.iconBg }]}>
                        <Icon color={item.iconColor} size={18} />
                    </View>
                    <View style={styles.optionText}>
                        <Text style={styles.optionTitle}>{item.title}</Text>
                        {item.subtitle && <Text style={styles.optionSubtitle}>{item.subtitle}</Text>}
                    </View>
                    <ChevronRight color={colors.TEXT_SECONDARY} size={18} />
                </Pressable>
            );
        },
        [options.length, styles, colors.TEXT_SECONDARY],
    );

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.PRIMARY} />
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
            <FlashList
                ListHeaderComponent={
                    <>
                        <LinearGradient
                            colors={[colors.PRIMARY, colors.PRIMARY_DARK]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.header}
                        >
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{initialsFor(displayName)}</Text>
                            </View>
                            <Text style={styles.name}>{displayName}</Text>
                            {driver?.email && driver?.displayName ? (
                                <Text style={styles.email}>{driver.email}</Text>
                            ) : null}
                            <View style={styles.ratingPill}>
                                <Star color="#FCD34D" fill="#FCD34D" size={13} />
                                <Text style={styles.rating}>
                                    {driver?.rating != null ? driver.rating.toFixed(1) : 'No ratings yet'}
                                </Text>
                            </View>
                        </LinearGradient>

                        <View style={styles.statsRow}>
                            <View style={styles.statCard}>
                                <Text style={styles.statValue}>{driver?.totalDeliveries ?? 0}</Text>
                                <Text style={styles.statLabel}>Total Deliveries</Text>
                            </View>
                            <View style={styles.statCard}>
                                <Text style={styles.statValue}>
                                    {driver?.rating != null ? driver.rating.toFixed(1) : '—'}
                                </Text>
                                <Text style={styles.statLabel}>Rating</Text>
                            </View>
                        </View>

                        <Text style={styles.sectionLabel}>ACCOUNT</Text>
                    </>
                }
                data={options}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListFooterComponent={
                    <Pressable style={styles.logout} onPress={actions.logout}>
                        <LogOut color="#FFF" size={16} />
                        <Text style={styles.logoutText}>Logout</Text>
                    </Pressable>
                }
            />
        </View>
    );
};

export default ProfileScreen;

const makeStyles = (
    colors: ReturnType<typeof useAppTheme>['colors'],
    fonts: ReturnType<typeof useAppTheme>['fonts'],
    fontSize: ReturnType<typeof useAppTheme>['fontSize'],
    spacing: ReturnType<typeof useAppTheme>['spacing'],
    radius: ReturnType<typeof useAppTheme>['radius'],
) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.BACKGROUND },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12, backgroundColor: colors.BACKGROUND },
    errorText: { color: colors.DANGER, fontSize: fontSize.md, textAlign: 'center', fontFamily: fonts.MEDIUM_PRIMARY },
    retryButton: { backgroundColor: colors.PRIMARY, paddingHorizontal: 20, paddingVertical: 10, borderRadius: radius.md },
    retryText: { color: '#fff', fontFamily: fonts.BOLD_PRIMARY },

    header: {
        alignItems: 'center',
        paddingTop: spacing.xl + 12,
        paddingBottom: spacing.xl + 8,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
    },
    avatar: {
        width: 76, height: 76, borderRadius: 38,
        backgroundColor: 'rgba(255,255,255,0.22)',
        borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: spacing.sm,
    },
    avatarText: { color: '#fff', fontSize: 26, fontFamily: fonts.BOLD_PRIMARY },
    name: { fontSize: 19, fontFamily: fonts.BOLD_PRIMARY, color: '#fff' },
    email: { fontSize: 12, fontFamily: fonts.MEDIUM_PRIMARY, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
    ratingPill: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999,
        paddingHorizontal: 12, paddingVertical: 5, marginTop: spacing.sm,
    },
    rating: { fontSize: 12, fontFamily: fonts.SEMI_BOLD_PRIMARY, color: '#fff' },

    statsRow: {
        flexDirection: 'row', gap: spacing.md,
        marginHorizontal: spacing.xl, marginTop: -spacing.xl,
    },
    statCard: {
        flex: 1, backgroundColor: colors.SURFACE, borderRadius: radius.lg,
        borderWidth: 1, borderColor: colors.BORDER,
        paddingVertical: spacing.md, alignItems: 'center',
        shadowColor: colors.PRIMARY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
    },
    statValue: { fontSize: 20, fontFamily: fonts.BOLD_PRIMARY, color: colors.TEXT_PRIMARY },
    statLabel: { fontSize: 11, fontFamily: fonts.MEDIUM_PRIMARY, color: colors.TEXT_SECONDARY, marginTop: 2 },

    sectionLabel: {
        fontSize: 11, fontFamily: fonts.BOLD_PRIMARY, color: colors.TEXT_SECONDARY,
        letterSpacing: 0.6, marginHorizontal: spacing.xl, marginTop: spacing.xl, marginBottom: spacing.sm,
    },

    listContent: { paddingBottom: spacing.xl },

    option: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: colors.SURFACE,
        marginHorizontal: spacing.xl,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        borderWidth: 1,
        borderColor: colors.BORDER,
        borderBottomWidth: 0,
    },
    optionLast: {
        borderBottomWidth: 1,
        borderBottomLeftRadius: radius.lg,
        borderBottomRightRadius: radius.lg,
    },
    optionIconWrap: {
        width: 38, height: 38, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
    },
    optionText: { flex: 1 },
    optionTitle: { fontSize: fontSize.md, fontFamily: fonts.SEMI_BOLD_PRIMARY, color: colors.TEXT_PRIMARY },
    optionSubtitle: { fontSize: 11, fontFamily: fonts.MEDIUM_PRIMARY, color: colors.TEXT_SECONDARY, marginTop: 1 },

    logout: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginHorizontal: spacing.xl,
        marginTop: spacing.xl,
        backgroundColor: colors.DANGER,
        paddingVertical: 14,
        borderRadius: radius.md,
    },
    logoutText: { color: '#FFF', fontFamily: fonts.BOLD_PRIMARY, fontSize: fontSize.md },
});
