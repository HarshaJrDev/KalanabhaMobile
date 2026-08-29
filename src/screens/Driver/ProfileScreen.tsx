// ProfileScreen.tsx — Driver
//
// Was entirely mock data (hardcoded name/avatar/rating/wallet balance) with
// a `console.log` logout. Now backed by GET /users/me (useMe) for the
// driver's real name/rating/delivery count, and the same real
// POST /auth/logout flow (useLogout) the customer Profile screen uses.
//
// `walletBalance` had no backing field on the backend (User model has no
// wallet concept) — removed rather than kept as fabricated data.
//
// Trips/Payments/Support/Settings menu items: "Your Trips" now opens a
// real screen (TripsScreen.tsx) backed by GET /shipments/driver/mine, added
// specifically because there was no way for a driver to see their own
// assigned shipments before — which was also why a customer's chat message
// never reached the driver (no screen ever opened the chat). "Payments"
// stays an honest "Coming soon" toast — there's no Payment/payout model on
// the backend at all, nothing real to show. Support opens the device's
// mail client (no backend needed). Settings is a real screen (notification
// permission, app version, logout) — see SettingsScreen.tsx.
import React, { useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Image,
    Alert,
    ActivityIndicator,
    Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import {
    Receipt,
    CreditCard,
    Headphones,
    Settings,
    ChevronRight,
    LogOut,
    Star,
} from 'lucide-react-native';
import { useMe } from '@hooks/useMe';
import { useLogout } from '@hooks/useLogout';
import { showToast } from '@ui/alert/toastStore';

const SUPPORT_EMAIL = 'support@kalanabha.com';

type ProfileOption = {
    id: string;
    title: string;
    icon: React.ComponentType<{ color?: string; size?: number }>;
    onPress: () => void;
};

const useProfileActions = () => {
    const navigation = useNavigation();
    const logoutMutation = useLogout();

    const comingSoon = useCallback((feature: string) => {
        showToast(`${feature} is coming soon`, 'info');
    }, []);

    const goSupport = useCallback(() => {
        Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() =>
            showToast('No email app is set up on this device', 'error'),
        );
    }, []);

    const logout = useCallback(() => {
        Alert.alert('Logout', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: () => logoutMutation.mutate() },
        ]);
    }, [logoutMutation]);

    return {
        goTrips: () => navigation.navigate('DriverTrips' as never),
        goPayments: () => comingSoon('Payments'),
        goSupport,
        goSettings: () => navigation.navigate('DriverSettings' as never),
        logout,
    };
};

const OptionItem = React.memo(({ item }: { item: ProfileOption }) => {
    const Icon = item.icon;
    return (
        <Pressable style={styles.option} onPress={item.onPress}>
            <Icon color="#1F2937" size={18} />
            <Text style={styles.optionText}>{item.title}</Text>
            <ChevronRight color="#999" size={18} />
        </Pressable>
    );
});

const ProfileScreen = () => {
    const { data: driver, isLoading, error, refetch } = useMe();
    const actions = useProfileActions();

    const options: ProfileOption[] = [
        { id: '1', title: 'Your Trips', icon: Receipt, onPress: actions.goTrips },
        { id: '2', title: 'Payments', icon: CreditCard, onPress: actions.goPayments },
        { id: '3', title: 'Support', icon: Headphones, onPress: actions.goSupport },
        { id: '4', title: 'Settings', icon: Settings, onPress: actions.goSettings },
    ];

    const renderItem = useCallback(
        ({ item }: { item: ProfileOption }) => <OptionItem item={item} />,
        []
    );

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#111" />
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
                        <View style={styles.header}>
                            <Image
                                source={{ uri: 'https://i.pravatar.cc/150?img=3' }}
                                style={styles.avatar}
                            />
                            <Text style={styles.name}>{driver?.displayName || driver?.email || 'Driver'}</Text>
                            <View style={styles.ratingRow}>
                                <Star color="#F59E0B" fill="#F59E0B" size={14} />
                                <Text style={styles.rating}>
                                    {driver?.rating != null ? driver.rating.toFixed(1) : '—'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.deliveriesCard}>
                            <Text style={styles.deliveriesLabel}>Total Deliveries</Text>
                            <Text style={styles.deliveriesAmount}>
                                {driver?.totalDeliveries ?? 0}
                            </Text>
                        </View>
                    </>
                }
                data={options}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F7F7',
    },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
    errorText: { color: '#DC2626', fontSize: 14, textAlign: 'center' },
    retryButton: { backgroundColor: '#111', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
    retryText: { color: '#fff', fontWeight: '600' },

    header: {
        alignItems: 'center',
        paddingVertical: 24,
        backgroundColor: '#FFF',
    },

    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 10,
    },

    name: {
        fontSize: 18,
        fontWeight: '700',
    },

    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    rating: {
        fontSize: 14,
        color: '#666',
    },

    deliveriesCard: {
        backgroundColor: '#111',
        margin: 16,
        borderRadius: 16,
        padding: 16,
    },

    deliveriesLabel: {
        color: '#AAA',
        fontSize: 12,
    },

    deliveriesAmount: {
        color: '#FFF',
        fontSize: 22,
        fontWeight: '700',
        marginTop: 4,
    },

    option: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#FFF',
        padding: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#EEE',
    },

    optionText: {
        flex: 1,
        fontSize: 15,
    },

    logout: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        margin: 16,
        backgroundColor: '#FF3B30',
        padding: 14,
        borderRadius: 12,
    },

    logoutText: {
        color: '#FFF',
        fontWeight: '700',
    },
});
