import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    StyleSheet,
    View,
    Text,
    RefreshControl,
    ActivityIndicator,
    StatusBar,
    Dimensions,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSearchingShipments, useMyShipmentsAsDriver, useAcceptShipment } from '@features/shipments/hooks';
import Animated, {
    FadeIn,
    FadeOut,
    SlideInDown,
    Layout,
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { DriverHeader } from '@components/DriverHeader';
import { LogisticsCardList, LogisticsItem } from '@components/LogisticsCardList';
import {
    AlertCircle,
    RefreshCw,
    Package,
    Inbox,
    CheckCircle2,
    Wallet,
    MessageCircle,
    Fuel,
    ShieldAlert,
    MapPin,
    Navigation,
    X,
} from 'lucide-react-native';

import { registerFCMToken, setupFCMListeners } from '@utils/cm';
import { safeNumber } from '@utils/parsers';
import { useDriverLiveLocation } from '@location/useDriverLiveLocation';
import { openGoogleMapsDirections } from '@utils/navigation';
import { useAuthStore } from '@features/store/authStore';
import { showToast } from '@ui/alert/toastStore';
import { Linking } from 'react-native';

// No emergency/support phone number exists anywhere in this app's
// backend (BusinessSetting has no such key) — reusing the same real
// support channel Profile.tsx's Help Center already uses rather than
// inventing a fake SOS hotline.
const SUPPORT_EMAIL = 'support@kalanabha.com';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HomeScreenProps { }

// Adapts features/shipments' mapped Shipment (shipment/types.ts shape) to
// this screen's LogisticsItem, which LogisticsCardList renders.
const toLogisticsItem = (s: import('@shipment/types').Shipment): LogisticsItem => ({
    id: s.id,
    goodsType: s.goodsType,
    weightKg: s.weightKg,
    pickup: s.pickup,
    drop: s.drop,
    price: s.price,
    distanceKm: s.distanceKm,
    status: s.status,
    createdAt: s.createdAt,
    driverName: s.dispatch?.driverName,
    driverRating: s.dispatch?.driverRating,
    driverId: s.dispatch?.driverId ?? '',
    driverPhone: s.dispatch?.driverPhone,
    customerName: s.sender?.name ?? 'Customer',
    customerPhone: s.sender?.phone,
});

const HomeScreen: React.FC<HomeScreenProps> = () => {
    // Screen -> hook -> shipments.api -> GET /shipments/searching -> cache -> UI
    const navigation = useNavigation();
    const {
        data: searchingShipments,
        isLoading: loading,
        isRefetching: refreshing,
        error: shipmentsError,
        refetch: refetchShipments,
    } = useSearchingShipments();

    // Real "shipments assigned to me" data (GET /shipments/driver/mine) —
    // added specifically so there's a way to reach the chat for whichever
    // delivery this driver is actively on. Previously nothing on this
    // screen (or anywhere else in the driver app) surfaced this.
    const { data: myShipments } = useMyShipmentsAsDriver();
    const activeDelivery = useMemo(
        () => myShipments?.find((s) => s.status === 'accepted' || s.status === 'in_transit'),
        [myShipments],
    );

    const shipments = useMemo<LogisticsItem[]>(
        () => (searchingShipments ?? []).map(toLogisticsItem),
        [searchingShipments],
    );
    const error = shipmentsError ? shipmentsError.message : null;

    // Real today's earnings/delivered-count, now that GET
    // /shipments/driver/mine (`myShipments` above) exists — previously
    // stuck at 0 because there was no driver-scoped shipments endpoint to
    // compute them from. `updatedAt` is used as the delivery timestamp
    // (the row is updated exactly when DispatchService.completeDelivery
    // flips status to DELIVERED) since there's no separate completedAt column.
    const todaysDeliveries = useMemo(() => {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        return (myShipments ?? []).filter(
            (s) => s.status === 'delivered' && new Date(s.updatedAt) >= startOfToday,
        );
    }, [myShipments]);
    const todayEarnings = useMemo(
        () => todaysDeliveries.reduce((sum, s) => sum + s.price, 0),
        [todaysDeliveries],
    );
    const deliveredToday = todaysDeliveries.length;
    // Was a disconnected local useState(true) — always showed "Online"
    // regardless of the real, persisted User.isOnline value (and never
    // reflected a toggle made from another device/session).
    const isOnline = useAuthStore((s) => s.user?.isOnline ?? false);

    // First searching-pool request becomes the "Incoming Load Request"
    // hero card below, matching what the reference mockup highlights —
    // everything on it (price, distance, package, sender, insured flag)
    // is real; no surge multiplier, demand radar, countdown/expiry,
    // acceptance-score %, or OTP claim since none of those have any
    // backend behind them.
    const incomingRequest = searchingShipments?.[0];
    const remainingShipments = useMemo(
        () => shipments.filter((s) => s.id !== incomingRequest?.id),
        [shipments, incomingRequest],
    );
    const { mutate: acceptIncoming, isPending: acceptingIncoming } = useAcceptShipment(incomingRequest?.id ?? '');
    const [dismissedIncomingId, setDismissedIncomingId] = useState<string | null>(null);
    const showIncomingCard = incomingRequest && incomingRequest.id !== dismissedIncomingId;

    const handleAcceptIncoming = () => {
        if (!incomingRequest) return;
        acceptIncoming(undefined, {
            onSuccess: () => showToast('Order accepted! Start delivery.', 'success'),
            onError: () => showToast('Order already taken', 'error'),
        });
    };

    const handleSos = () => {
        Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Driver%20SOS`).catch(() =>
            showToast('No email app is set up on this device', 'error'),
        );
    };

    // ━━━━━ Animations
    const headerScale = useSharedValue(0.95);
    const contentOpacity = useSharedValue(0);

    useEffect(() => {
        headerScale.value = withSpring(1, { damping: 12, mass: 1 });
        contentOpacity.value = withSpring(1, { damping: 10, mass: 1 });
    }, []);




    // Rapido-style live tracking: only pings location while this driver has
    // a shipment actively accepted/in_transit — not just because they're
    // online, to avoid draining battery for idle drivers browsing orders.
    // Previously always evaluated false: it checked the SEARCHING pool
    // (`shipments` above), which by definition never contains a shipment
    // already assigned to this driver. Fixed now that
    // GET /shipments/driver/mine (`activeDelivery` above) exists.
    useDriverLiveLocation(!!activeDelivery);

    // Register driver FCM token on mount
    useEffect(() => {
        registerFCMToken('driver');
        const unsub = setupFCMListeners((title, body, data) => {
            // Show in-app alert for new orders
            Alert.alert(title, body, [
                {
                    text: 'View',
                    onPress: () => {
                        if (data?.shipmentId) {
                            (navigation as any).navigate('ShipmentDetailsScreen', { id: data.shipmentId });
                        }
                    },
                },
                { text: 'Dismiss' },
            ]);
        });
        return () => unsub();
    }, []);

    // ━━━━━ Pull to Refresh
    const onRefresh = useCallback(() => {
        refetchShipments();
    }, [refetchShipments]);

    // ━━━━━ Retry handler
    const onRetry = useCallback(() => {
        refetchShipments();
    }, [refetchShipments]);

    // ━━━━━ Animated styles
    const headerAnimStyle = useAnimatedStyle(() => ({
        transform: [{ scale: headerScale.value }],
    }));

    const contentAnimStyle = useAnimatedStyle(() => ({
        opacity: contentOpacity.value,
    }));

    // ━━━━━ Loading State
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
                <Animated.View entering={FadeIn} style={styles.loadingContent}>
                    <ActivityIndicator size="large" color="#2563EB" />
                    <Text style={styles.loadingText}>Loading your orders...</Text>
                    <Text style={styles.loadingSubtext}>Syncing with Firestore</Text>
                </Animated.View>
            </View>
        );
    }

    // ━━━━━ Error State
    if (error && shipments.length === 0) {
        return (
            <View style={styles.errorContainer}>
                <StatusBar barStyle="dark-content" backgroundColor="#FEF2F2" />
                <Animated.View entering={FadeIn} style={styles.errorContent}>
                    <View style={styles.errorIcon}>
                        <AlertCircle size={48} color="#EF4444" />
                    </View>
                    <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
                    <Text style={styles.errorMessage}>{error}</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={onRetry}
                    // entering={SlideInDown.delay(200)}
                    >
                        <RefreshCw size={18} color="#FFF" />
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        );
    }

    return (
        <>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
            <View style={styles.container}>
                {/* 🚚 Driver Header */}
                <View style={{ position: 'relative' }}>
                    <Animated.View style={[headerAnimStyle, { width: '100%' }]}>
                        <DriverHeader
                            earnings={todayEarnings}
                            deliveredToday={deliveredToday}
                            isOnline={isOnline}
                            style={styles.header}
                        />
                    </Animated.View>
                    {/* No emergency-dispatch system exists — this opens a
                        real email to support (same channel Profile.tsx's
                        Help Center uses), not a fake panic button. */}
                    <TouchableOpacity style={styles.sosBtn} onPress={handleSos}>
                        <ShieldAlert color="#fff" size={16} />
                        <Text style={styles.sosBtnText}>SOS</Text>
                    </TouchableOpacity>
                </View>

                {/* 💬 Active Delivery — chat + real directions */}
                {activeDelivery && (
                    <View style={styles.activeDeliveryCard}>
                        <TouchableOpacity
                            style={styles.activeDeliveryRow}
                            onPress={() => (navigation as any).navigate('ShipmentChat', { shipmentId: activeDelivery.id })}
                        >
                            <View style={styles.activeDeliveryIcon}>
                                <Package color="#FF7518" size={18} />
                            </View>
                            <View style={styles.activeDeliveryContent}>
                                <Text style={styles.activeDeliveryTitle}>
                                    Active delivery · {activeDelivery.trackingId}
                                </Text>
                                <Text style={styles.activeDeliverySub} numberOfLines={1}>
                                    {activeDelivery.from} → {activeDelivery.to}
                                </Text>
                            </View>
                            <View style={styles.chatPill}>
                                <MessageCircle color="#fff" size={14} />
                                <Text style={styles.chatPillText}>Chat</Text>
                            </View>
                        </TouchableOpacity>
                        {/* No embedded map library is installed in this
                            app — opens the real Google Maps app/website
                            (free, no API key) for turn-by-turn directions,
                            same pattern ShipmentDetailsScreen already uses. */}
                        <TouchableOpacity
                            style={styles.openMapsRow}
                            onPress={() => openGoogleMapsDirections(activeDelivery.pickup, activeDelivery.drop)}
                        >
                            <Navigation color="#FF7518" size={13} />
                            <Text style={styles.openMapsText}>Open directions in Maps</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* 📥 Incoming Load Request — the top searching-pool
                    shipment, styled as the reference mockup's hero card.
                    Every figure on it is real (price/distanceKm/package/
                    sender/insured flag); no surge, demand-radar,
                    countdown-with-expiry, acceptance-score, or OTP claim —
                    none of those exist anywhere in the backend. */}
                {showIncomingCard && incomingRequest && (
                    <Animated.View entering={FadeIn} style={styles.incomingCard}>
                        <View style={styles.incomingHeaderRow}>
                            <Text style={styles.incomingHeaderText}>INCOMING LOAD REQUEST</Text>
                            <TouchableOpacity onPress={() => setDismissedIncomingId(incomingRequest.id)} hitSlop={8}>
                                <X size={16} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.incomingPriceRow}>
                            <Text style={styles.incomingPrice}>₹{incomingRequest.price}</Text>
                            <View style={styles.incomingPaymentPill}>
                                <Text style={styles.incomingPaymentPillText}>
                                    {incomingRequest.paymentMode === 'cod' ? 'COD' : incomingRequest.paymentMode === 'prepaid' ? 'UPI' : 'Credit'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.incomingStatsRow}>
                            <View style={styles.incomingStat}>
                                <Text style={styles.incomingStatLabel}>TOTAL RUN</Text>
                                <Text style={styles.incomingStatValue}>{incomingRequest.distanceKm.toFixed(1)} km</Text>
                            </View>
                            <View style={styles.incomingStat}>
                                <Text style={styles.incomingStatLabel}>TRIP NET</Text>
                                <Text style={styles.incomingStatValue}>
                                    ₹{(incomingRequest.price / Math.max(incomingRequest.distanceKm, 0.1)).toFixed(1)}/km
                                </Text>
                            </View>
                        </View>

                        <View style={styles.incomingSenderRow}>
                            <View style={styles.incomingSenderAvatar}>
                                <Text style={styles.incomingSenderInitials}>
                                    {(incomingRequest.sender?.name ?? '?').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
                                </Text>
                            </View>
                            <Text style={styles.incomingSenderName} numberOfLines={1}>
                                {incomingRequest.sender?.name ?? 'Customer'}
                            </Text>
                        </View>

                        <View style={styles.incomingVehicleRow}>
                            <Text style={styles.incomingVehicleText}>
                                {incomingRequest.vehicleType} · Up to {incomingRequest.package?.weight ?? incomingRequest.weightKg} kg
                            </Text>
                            <Text style={styles.incomingPackageText} numberOfLines={1}>
                                {incomingRequest.package?.category ?? incomingRequest.goodsType}
                            </Text>
                            {/* No "insured" flag actually reaches the backend — addOrders.tsx
                                collects a fragile/insurance toggle in the booking form, but
                                CreateShipmentPayload's package only carries category/weight,
                                so there's nothing real to show here. */}
                        </View>

                        <View style={styles.incomingRouteRow}>
                            <MapPin size={13} color="#16A34A" />
                            <Text style={styles.incomingRouteText} numberOfLines={1}>{incomingRequest.pickup.address}</Text>
                        </View>
                        <View style={styles.incomingRouteRow}>
                            <MapPin size={13} color="#FF7518" />
                            <Text style={styles.incomingRouteText} numberOfLines={1}>{incomingRequest.drop.address}</Text>
                        </View>

                        <View style={styles.incomingActionsRow}>
                            <TouchableOpacity
                                style={styles.declineBtn}
                                onPress={() => setDismissedIncomingId(incomingRequest.id)}
                            >
                                <Text style={styles.declineBtnText}>Decline</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.acceptBtn}
                                onPress={handleAcceptIncoming}
                                disabled={acceptingIncoming}
                            >
                                <Text style={styles.acceptBtnText}>
                                    {acceptingIncoming ? 'Accepting…' : 'Accept Load'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                )}

                {/* ⛽ Find nearby fuel stations — GET /maps/fuel-stations (free
                    OpenStreetMap data) + log a fill-up against /fuel-expenses so
                    admin can see driver fuel spend. */}
                <TouchableOpacity
                    style={styles.fuelCard}
                    onPress={() => (navigation as any).navigate('FuelStations')}
                >
                    <View style={styles.fuelIconWrap}>
                        <Fuel color="#F59E0B" size={18} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.fuelCardTitle}>Find Fuel Stations</Text>
                        <Text style={styles.fuelCardSub}>Nearby petrol bunks · log a fill-up</Text>
                    </View>
                    <View style={styles.fuelOpenPill}>
                        <Text style={styles.chatPillText}>Open</Text>
                    </View>
                </TouchableOpacity>

                {/* 📦 Orders Section */}
                <Animated.View style={[{ flex: 1 }, contentAnimStyle]}>
                    <View style={styles.ordersSection}>
                        <View style={styles.sectionHeader}>
                            <View>
                                <Text style={styles.sectionTitle}>
                                    Nearby Orders
                                </Text>
                                <Text style={styles.subtitle}>
                                    {remainingShipments.length} available • Real-time updates
                                </Text>
                            </View>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{remainingShipments.length}</Text>
                            </View>
                        </View>

                        {remainingShipments.length === 0 ? (
                            <Animated.View
                                entering={FadeIn.delay(300)}
                                style={styles.emptyState}
                            >
                                <Inbox color="#9CA3AF" size={56} style={styles.emptyEmoji} />
                                <Text style={styles.emptyTitle}>No orders nearby</Text>
                                <Text style={styles.emptyMessage}>
                                    Check back soon for new deliveries in your area
                                </Text>
                            </Animated.View>
                        ) : (
                            <LogisticsCardList
                                data={remainingShipments}
                                refreshControl={
                                    <RefreshControl
                                        refreshing={refreshing}
                                        onRefresh={onRefresh}
                                        colors={['#2563EB']}
                                        tintColor="#2563EB"
                                        progressBackgroundColor="#F0F0F0"
                                    />
                                }
                            />
                        )}
                    </View>
                </Animated.View>

                {/* 📊 Live Stats Footer */}
                {shipments.length > 0 && (
                    <Animated.View
                        entering={SlideInDown.delay(400)}
                        style={styles.statsFooterWrap}
                    >
                        <LinearGradient
                            colors={['#2563EB', '#1E40AF']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.statsFooter}
                        >
                            <View style={styles.statItem}>
                                <Package color="#fff" size={24} style={styles.statEmoji} />
                                <Text style={styles.statNumber}>{shipments.length}</Text>
                                <Text style={styles.statLabel}>Available</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <CheckCircle2 color="#fff" size={24} style={styles.statEmoji} />
                                <Text style={styles.statNumber}>{deliveredToday}</Text>
                                <Text style={styles.statLabel}>Delivered</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Wallet color="#fff" size={24} style={styles.statEmoji} />
                                <Text style={styles.statNumber}>₹{todayEarnings.toLocaleString()}</Text>
                                <Text style={styles.statLabel}>Earnings</Text>
                            </View>
                        </LinearGradient>
                    </Animated.View>
                )}
            </View>
        </>
    );
};

export default HomeScreen;

// ━━━━━ STYLES
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },

    // Loading States
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
    },
    loadingContent: {
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#1F2937',
        fontWeight: '600',
    },
    loadingSubtext: {
        fontSize: 13,
        color: '#9CA3AF',
    },

    // Error States
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
    },
    errorContent: {
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    errorIcon: {
        marginBottom: 16,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#DC2626',
        marginBottom: 8,
        textAlign: 'center',
    },
    errorMessage: {
        fontSize: 14,
        color: '#7F1D1D',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#DC2626',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    retryText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '600',
    },

    // Header
    header: {
        marginBottom: 0,
    },

    // Active Delivery card
    sosBtn: {
        position: 'absolute',
        top: 14,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#DC2626',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    sosBtnText: { color: '#fff', fontSize: 11, fontWeight: '800' },

    activeDeliveryCard: {
        marginHorizontal: 16,
        marginTop: 12,
        backgroundColor: '#FFF',
        borderRadius: 14,
        padding: 14,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
    },
    activeDeliveryRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    activeDeliveryIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFE8D6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeDeliveryContent: { flex: 1 },
    activeDeliveryTitle: { fontSize: 13, fontWeight: '700', color: '#111827' },
    activeDeliverySub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    chatPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FF7518',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
    },
    chatPillText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    openMapsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    openMapsText: { fontSize: 12, fontWeight: '700', color: '#FF7518' },

    // ── Incoming Load Request hero card
    incomingCard: {
        marginHorizontal: 16,
        marginTop: 12,
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1.5,
        borderColor: '#FF7518',
        elevation: 3,
        shadowColor: '#FF7518',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
    },
    incomingHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    incomingHeaderText: { fontSize: 11, fontWeight: '800', color: '#FF7518', letterSpacing: 0.5 },
    incomingPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    incomingPrice: { fontSize: 26, fontWeight: '800', color: '#111827' },
    incomingPaymentPill: { backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    incomingPaymentPillText: { fontSize: 11, fontWeight: '700', color: '#6B7280' },
    incomingStatsRow: { flexDirection: 'row', gap: 20, marginBottom: 12 },
    incomingStat: {},
    incomingStatLabel: { fontSize: 10, color: '#9CA3AF', letterSpacing: 0.3 },
    incomingStatValue: { fontSize: 14, fontWeight: '700', color: '#111827', marginTop: 2 },
    incomingSenderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    incomingSenderAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#FFE8D6', alignItems: 'center', justifyContent: 'center' },
    incomingSenderInitials: { fontSize: 11, fontWeight: '700', color: '#FF7518' },
    incomingSenderName: { fontSize: 13, fontWeight: '700', color: '#111827', flex: 1 },
    incomingVehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
    incomingVehicleText: { fontSize: 12, color: '#374151', fontWeight: '600', textTransform: 'capitalize' },
    incomingPackageText: { fontSize: 12, color: '#6B7280' },
    incomingInsuredPill: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#F0FDF4', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
    incomingInsuredText: { fontSize: 10, fontWeight: '700', color: '#16A34A' },
    incomingRouteRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    incomingRouteText: { flex: 1, fontSize: 12, color: '#374151' },
    incomingActionsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
    declineBtn: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    declineBtnText: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
    acceptBtn: {
        flex: 2,
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#FF7518',
    },
    acceptBtnText: { fontSize: 13, fontWeight: '800', color: '#fff' },

    fuelCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginHorizontal: 16,
        marginTop: 12,
        backgroundColor: '#FFF',
        borderRadius: 14,
        padding: 14,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
    },
    fuelIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FEF3C7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    fuelCardTitle: { fontSize: 13, fontWeight: '700', color: '#111827' },
    fuelCardSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    fuelOpenPill: {
        backgroundColor: '#F59E0B',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
    },

    // Orders Section
    ordersSection: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1C1C1E',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#8E8E93',
        fontWeight: '500',
    },
    badge: {
        backgroundColor: '#2563EB',
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 12,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
    },

    // Empty State
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyEmoji: {
        fontSize: 56,
        marginBottom: 12,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1C1C1E',
        marginBottom: 8,
    },
    emptyMessage: {
        fontSize: 14,
        color: '#8E8E93',
        textAlign: 'center',
        maxWidth: 240,
    },

    // Stats Footer
    statsFooterWrap: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    statsFooter: {
        flexDirection: 'row',
        backgroundColor: '#2563EB',
        paddingVertical: 18,
        paddingHorizontal: 16,
        borderRadius: 20,
        elevation: 5,
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statEmoji: {
        fontSize: 24,
        marginBottom: 4,
    },
    statNumber: {
        fontSize: 18,
        fontWeight: '900',
        color: '#FFF',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginHorizontal: 8,
    },
});