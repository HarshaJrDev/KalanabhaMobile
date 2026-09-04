// Home.tsx — customer Home screen.
//
// Rebuilt around real state instead of a static card stack: an active
// shipment (if any) is promoted to a dominant hero card at the top
// (ActiveBookingCard), not buried in a list; the primary booking surfaces
// (vehicle selector, recent trips, popular pickup points) are all real,
// backend-backed data with their own independent loading/empty states, so
// one failing section (e.g. history) never blocks booking. The fabricated
// promo carousel (no coupons/promotions backend exists anywhere in this
// app) has been removed rather than kept as decoration with no product
// purpose — see §27/§39 of this app's "don't fabricate a backend feature"
// rule, which the new design brief's "no decoration without purpose"
// principle reinforces rather than contradicts.
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Animated,
    StatusBar,
    RefreshControl,
    ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';
import { useMyShipments, useMyShipmentHistory } from '@features/shipments/hooks';
import { useUnreadNotificationCount } from '@features/notifications/hooks';
import { useVehicleConfigs, useServiceAreas } from '@features/settings/hooks';
import type { ServiceArea } from '@features/settings/types';
import { useAuthStore } from '@features/store/authStore';
import type { Shipment as BackendShipment } from '@shipment/types';
import {
    Truck,
    Bike,
    Clock,
    CheckCircle2,
    AlertCircle,
    ChevronRight,
    Users,
    RotateCw,
    Phone,
    CalendarClock,
    Calculator,
    ArrowRight,
    Shield,
    PackagePlus,
} from 'lucide-react-native';
import { RootStackParamList } from '../navigation/types';
import { useAppTheme } from '@theme/ThemeContext';
import { makeHomeColors, SPACING } from './homeSections/theme';
import HomeHeader from './homeSections/HomeHeader';
import ActiveBookingCard from './homeSections/ActiveBookingCard';
import QuickVehicleSelector from './homeSections/QuickVehicleSelector';
import RecentTrips from './homeSections/RecentTrips';
import PopularPickupPoints from './homeSections/PopularPickupPoints';
import HomeSkeleton from './homeSections/HomeSkeleton';

type Shipment = {
    id: string;
    userId: string;
    from: string;
    to: string;
    status: 'searching' | 'accepted' | 'in-transit' | 'delivered' | 'expired';
    trackingId: string;
    orderId: string;
    type: 'mini' | 'small' | 'medium' | 'large';
    createdAt: string;
    expiresAt: number;
    driverName: string | null;
    driverPhone: string | null;
};

const toHomeShipment = (s: BackendShipment): Shipment => ({
    id: s.id,
    userId: s.userId,
    from: s.pickup.address,
    to: s.drop.address,
    status: s.status === 'in_transit' ? 'in-transit' : (s.status as Shipment['status']),
    trackingId: s.trackingId,
    orderId: s.shipmentId,
    type: (s.vehicleType as Shipment['type']) ?? 'mini',
    createdAt: s.createdAt,
    expiresAt: 0,
    driverName: s.dispatch?.driverName ?? null,
    driverPhone: s.dispatch?.driverPhone ?? null,
});

const makeStatusConfig = (COLORS: ReturnType<typeof makeHomeColors>) => ({
    searching: { color: COLORS.warning, bg: '#FEF3C7', icon: RotateCw, label: 'Assigning Pilot' },
    accepted: { color: COLORS.primary, bg: '#EFF6FF', icon: Truck, label: 'Accepted' },
    'in-transit': { color: COLORS.accent, bg: '#FEF3C7', icon: Bike, label: 'In Transit' },
    delivered: { color: COLORS.success, bg: '#ECFDF5', icon: CheckCircle2, label: 'Delivered' },
    expired: { color: COLORS.danger, bg: '#FEF2F2', icon: AlertCircle, label: 'Expired' },
});
type StatusConfig = ReturnType<typeof makeStatusConfig>;
type HomeColors = ReturnType<typeof makeHomeColors>;

type HomeScreenProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
    const navigation = useNavigation<HomeScreenProp>();
    const { colors: BRAND, fonts: FONTS } = useAppTheme();
    const COLORS = useMemo(() => makeHomeColors(BRAND), [BRAND]);
    const STATUS_CONFIG = useMemo(() => makeStatusConfig(COLORS), [COLORS]);
    const styles = useMemo(() => makeStyles(COLORS, FONTS), [COLORS, FONTS]);

    const authUser = useAuthStore((s) => s.user);
    const {
        data: myShipments,
        isLoading: shipmentsLoading,
        isRefetching: shipmentsRefetching,
        refetch: refetchShipments,
    } = useMyShipments();
    const { data: unreadCount, refetch: refetchUnreadCount } = useUnreadNotificationCount();
    const { data: vehicleConfigs, isLoading: vehiclesLoading, refetch: refetchVehicleConfigs } = useVehicleConfigs();
    const activeVehicleConfigs = useMemo(() => (vehicleConfigs ?? []).filter((v) => v.active), [vehicleConfigs]);
    const { data: serviceAreas, refetch: refetchServiceAreas } = useServiceAreas();
    const activeServiceAreas = useMemo(() => (serviceAreas ?? []).filter((a) => a.active), [serviceAreas]);

    const activeShipmentsRaw = useMemo(() => myShipments ?? [], [myShipments]);
    const heroShipment = activeShipmentsRaw[0] ?? null;
    const activeShipments = useMemo<Shipment[]>(
        () => activeShipmentsRaw.filter((s) => s.id !== heroShipment?.id).map(toHomeShipment),
        [activeShipmentsRaw, heroShipment?.id],
    );
    const pendingCount = useMemo(() => activeShipmentsRaw.filter((s) => s.status === 'searching').length, [activeShipmentsRaw]);

    const { data: shipmentHistory, isLoading: historyLoading, refetch: refetchHistory } = useMyShipmentHistory();
    const deliveredCount = useMemo(() => shipmentHistory?.filter((s) => s.status === 'delivered').length ?? 0, [shipmentHistory]);
    const recentDeliveredTrips = useMemo(() => (shipmentHistory ?? []).filter((s) => s.status === 'delivered'), [shipmentHistory]);

    const notifCount = unreadCount ?? 0;
    // Critical first-paint data only — history/service-areas are secondary
    // sections that show their own empty state rather than blocking the
    // whole screen behind a skeleton.
    const initialLoading = shipmentsLoading && vehiclesLoading;
    const refreshing = shipmentsRefetching;

    const [userName, setUserName] = useState('User');
    const [searchText, setSearchText] = useState('');

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const headerScale = useRef(new Animated.Value(0.95)).current;
    const bellShake = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
            Animated.spring(headerScale, { toValue: 1, tension: 100, friction: 12, useNativeDriver: true }),
        ]).start();
        // fadeAnim/slideAnim/headerScale are useRef-held Animated.Value
        // instances — stable identity across renders, deliberately not in
        // the dep array (this should run once, on mount).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (notifCount > 0) {
            Animated.sequence([
                Animated.timing(bellShake, { toValue: 12, duration: 100, useNativeDriver: true }),
                Animated.timing(bellShake, { toValue: -12, duration: 100, useNativeDriver: true }),
                Animated.timing(bellShake, { toValue: 8, duration: 80, useNativeDriver: true }),
                Animated.timing(bellShake, { toValue: -8, duration: 80, useNativeDriver: true }),
                Animated.timing(bellShake, { toValue: 0, duration: 100, useNativeDriver: true }),
            ]).start();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [notifCount]);

    useEffect(() => {
        if (authUser?.displayName) {
            setUserName(authUser.displayName.split(' ')[0]);
        }
    }, [authUser?.displayName]);

    const onRefresh = useCallback(async () => {
        await Promise.all([refetchShipments(), refetchUnreadCount(), refetchVehicleConfigs(), refetchServiceAreas(), refetchHistory()]);
    }, [refetchShipments, refetchUnreadCount, refetchVehicleConfigs, refetchServiceAreas, refetchHistory]);

    const vehicleScrollX = useSharedValue(0);
    const vehicleScrollHandler = useAnimatedScrollHandler({
        onScroll: (e) => { vehicleScrollX.value = e.contentOffset.x; },
    });

    const goBookVehicle = (vehicleName: string) => {
        (navigation as any).navigate('AddOrder', { prefill: { vehicleType: vehicleName.toLowerCase() } });
    };

    const goBookAgain = (trip: BackendShipment) => {
        (navigation as any).navigate('AddOrder', {
            prefill: { pickup: trip.pickup.address, drop: trip.drop.address, vehicleType: trip.vehicleType },
        });
    };

    const goBookFromArea = (area: ServiceArea) => {
        (navigation as any).navigate('AddOrder', { prefill: { pickup: area.name } });
    };

    const isNewCustomer = activeShipmentsRaw.length === 0 && (shipmentHistory?.length ?? 0) === 0 && !historyLoading;

    if (initialLoading) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor={COLORS.gradientEnd} />
                <HomeSkeleton colors={COLORS} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.gradientEnd} />
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} tintColor={COLORS.primary} progressBackgroundColor={COLORS.background} />
                }
                contentContainerStyle={styles.scrollContent}
            >
                <HomeHeader
                    userName={userName}
                    notifCount={notifCount}
                    searchText={searchText}
                    onSearchChange={setSearchText}
                    onSubmitSearch={() => (navigation as any).navigate('Search')}
                    onOpenProfile={() => (navigation as any).navigate('Profile')}
                    onOpenInbox={() => (navigation as any).navigate('Inbox')}
                    onOpenNotifications={() => (navigation as any).navigate('Notification')}
                    onOpenQrScan={() => (navigation as any).navigate('QRScan')}
                    colors={COLORS}
                    fonts={FONTS}
                    fadeAnim={fadeAnim}
                    headerScale={headerScale}
                    bellShake={bellShake}
                />

                {/* State #1 priority: an active booking is the most urgent
                    thing on screen, promoted above everything else — not a
                    card buried in a list further down. */}
                {heroShipment && (
                    <ActiveBookingCard
                        shipment={heroShipment}
                        onTrack={() => (navigation as any).navigate('ShipmentDetailsScreen', { id: heroShipment.id })}
                        colors={COLORS}
                        fonts={FONTS}
                    />
                )}

                <Animated.View style={[styles.statsContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    {[
                        { label: 'Active', value: activeShipmentsRaw.length, color: COLORS.primary },
                        { label: 'Delivered', value: deliveredCount, color: COLORS.success },
                        { label: 'Pending', value: pendingCount, color: COLORS.warning },
                    ].map((stat, index) => (
                        <React.Fragment key={stat.label}>
                            {index > 0 && <View style={styles.statDivider} />}
                            <View style={styles.statItem}>
                                <Text style={[styles.statNumber, { color: stat.color }]}>{stat.value}</Text>
                                <Text style={styles.statLabel}>{stat.label}</Text>
                            </View>
                        </React.Fragment>
                    ))}
                </Animated.View>

                <View style={styles.mainContent}>
                    {/* New-customer first-booking nudge — only shown when
                        there's genuinely no history at all, not decoration
                        for a returning customer. */}
                    {isNewCustomer && (
                        <Pressable style={styles.firstBookingCard} onPress={() => (navigation as any).navigate('AddOrder')}>
                            <View style={styles.firstBookingIconWrap}>
                                <PackagePlus size={22} color="#fff" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.firstBookingTitle}>Start your first delivery</Text>
                                <Text style={styles.firstBookingSub}>Pick a vehicle below or tap here to book</Text>
                            </View>
                            <ArrowRight size={18} color="#fff" />
                        </Pressable>
                    )}
                </View>

                <QuickVehicleSelector
                    vehicles={activeVehicleConfigs}
                    scrollX={vehicleScrollX}
                    onScroll={vehicleScrollHandler}
                    onSelect={goBookVehicle}
                    colors={COLORS}
                    fonts={FONTS}
                />

                {recentDeliveredTrips.length > 0 && (
                    <RecentTrips
                        trips={recentDeliveredTrips}
                        onBookAgain={goBookAgain}
                        onViewAll={() => (navigation as any).navigate('Orders')}
                        colors={COLORS}
                        fonts={FONTS}
                    />
                )}

                {activeServiceAreas.length > 0 && (
                    <PopularPickupPoints areas={activeServiceAreas} onSelect={goBookFromArea} colors={COLORS} fonts={FONTS} />
                )}

                <View style={styles.mainContent}>
                    {activeShipments.length > 0 && (
                        <Animated.View style={[styles.sectionContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>More Active Shipments</Text>
                                <Pressable style={styles.viewAllButton} onPress={() => (navigation as any).navigate('Orders')}>
                                    <Text style={styles.viewAllText}>View All</Text>
                                    <ChevronRight size={16} color={COLORS.primary} />
                                </Pressable>
                            </View>
                            {activeShipments.map((shipment) => (
                                <ShipmentCard key={shipment.id} shipment={shipment} navigation={navigation} styles={styles} colors={COLORS} statusConfig={STATUS_CONFIG} />
                            ))}
                        </Animated.View>
                    )}

                    <View style={styles.quickActionsRow}>
                        <Pressable style={styles.quickActionTile} onPress={() => (navigation as any).navigate('AddOrder')}>
                            <View style={styles.quickActionIconWrap}>
                                <CalendarClock size={20} color={COLORS.primary} />
                            </View>
                            <Text style={styles.quickActionTitle}>Schedule Later</Text>
                            <Text style={styles.quickActionSub}>Plan forward pickups</Text>
                        </Pressable>
                        <Pressable style={styles.quickActionTile} onPress={() => (navigation as any).navigate('CheckRate')}>
                            <View style={styles.quickActionIconWrap}>
                                <Calculator size={20} color={COLORS.primary} />
                            </View>
                            <Text style={styles.quickActionTitle}>Calculate Rates</Text>
                            <Text style={styles.quickActionSub}>Estimate before you book</Text>
                        </Pressable>
                    </View>

                    <Pressable
                        style={styles.movingBanner}
                        onPress={() => (navigation as any).navigate('AddOrder', { prefill: { category: 'HOUSE_SHIFTING' } })}
                    >
                        <View style={styles.movingBannerIconWrap}>
                            <Truck size={22} color="#fff" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.movingBannerTitle}>House Shifting</Text>
                            <Text style={styles.movingBannerSub}>Movers with loading/unloading help — van or truck</Text>
                        </View>
                        <ArrowRight size={18} color="#fff" />
                    </Pressable>

                    <View style={styles.trustBanner}>
                        <View style={styles.trustBannerTitleRow}>
                            <Shield size={16} color={COLORS.primary} />
                            <Text style={styles.trustBannerTitle}>Kalanabha Transit Shield</Text>
                        </View>
                        <Text style={styles.trustBannerText}>Insured Deliveries · Verified Fleet Pilots · Encrypted Live GPS Telemetry</Text>
                        <View style={styles.trustChecksRow}>
                            <View style={styles.trustCheckItem}>
                                <CheckCircle2 size={13} color={COLORS.success} />
                                <Text style={styles.trustCheckText}>Insured</Text>
                            </View>
                            <View style={styles.trustCheckItem}>
                                <CheckCircle2 size={13} color={COLORS.success} />
                                <Text style={styles.trustCheckText}>Instant OTP Proof</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

type ShipmentCardProps = {
    shipment: Shipment;
    navigation: HomeScreenProp;
    styles: ReturnType<typeof makeStyles>;
    colors: HomeColors;
    statusConfig: StatusConfig;
};

const ShipmentCard: React.FC<ShipmentCardProps> = ({ shipment, navigation, styles, colors: COLORS, statusConfig }) => {
    const config = (statusConfig as any)[shipment.status] || statusConfig.searching;
    const pressAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => Animated.spring(pressAnim, { toValue: 0.98, tension: 300, friction: 20, useNativeDriver: true }).start();
    const handlePressOut = () => Animated.spring(pressAnim, { toValue: 1, tension: 300, friction: 20, useNativeDriver: true }).start();

    return (
        <Animated.View style={{ transform: [{ scale: pressAnim }] }}>
            <Pressable
                style={styles.shipmentCard}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={() => navigation.navigate('ShipmentDetailsScreen', { id: shipment.id })}
            >
                <View style={[styles.statusBar, { backgroundColor: config.color }]} />
                <View style={styles.shipmentContent}>
                    <View style={styles.shipmentHeader}>
                        <Text style={styles.trackingId}>{shipment.trackingId}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
                            <config.icon size={14} color={config.color} />
                            <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
                        </View>
                    </View>

                    <View style={styles.routeContainer}>
                        <View style={styles.routePoint}>
                            <View style={[styles.routeDot, { backgroundColor: COLORS.primary }]} />
                            <Text style={styles.routeText} numberOfLines={1}>{shipment.from}</Text>
                        </View>
                        <View style={styles.routeLine}>
                            <View style={styles.dashLine} />
                            <ChevronRight size={16} color={COLORS.textLight} />
                        </View>
                        <View style={styles.routePoint}>
                            <View style={[styles.routeDot, { backgroundColor: COLORS.accent }]} />
                            <Text style={styles.routeText} numberOfLines={1}>{shipment.to}</Text>
                        </View>
                    </View>

                    {shipment.driverName ? (
                        <View style={styles.driverRow}>
                            <View style={styles.driverAvatar}>
                                <Users size={13} color={COLORS.primary} />
                            </View>
                            <Text style={styles.driverName} numberOfLines={1}>{shipment.driverName}</Text>
                            {shipment.driverPhone && <Phone size={14} color={COLORS.textSecondary} />}
                        </View>
                    ) : shipment.status === 'searching' ? (
                        <View style={styles.matchingRow}>
                            <RotateCw size={12} color={COLORS.textLight} />
                            <Text style={styles.matchingText} numberOfLines={1}>Matching nearby {shipment.type} pilot…</Text>
                        </View>
                    ) : null}

                    <View style={styles.shipmentFooter}>
                        <View style={styles.footerItem}>
                            <Clock size={14} color={COLORS.textLight} />
                            <Text style={styles.footerText}>
                                {new Date(shipment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })},{' '}
                                {new Date(shipment.createdAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                            </Text>
                        </View>
                        <View style={styles.footerItem}>
                            <Truck size={14} color={COLORS.textSecondary} />
                            <Text style={styles.footerText}>{shipment.type}</Text>
                        </View>
                    </View>
                </View>
            </Pressable>
        </Animated.View>
    );
};

const makeStyles = (COLORS: HomeColors, FONTS: ReturnType<typeof useAppTheme>['fonts']) => StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scrollContent: { paddingBottom: 40 },
    statsContainer: {
        flexDirection: 'row', backgroundColor: COLORS.card, marginHorizontal: SPACING.xl,
        marginTop: SPACING.l, borderRadius: 24, paddingVertical: 20, shadowColor: COLORS.primary,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statNumber: { fontSize: 24, fontFamily: FONTS.PRIMARY, marginBottom: 2 },
    statLabel: { fontSize: 12, color: COLORS.textLight, fontFamily: FONTS.PRIMARY, letterSpacing: 0.5 },
    statDivider: { width: 1, backgroundColor: COLORS.border, height: 24, marginVertical: 8 },
    mainContent: { paddingHorizontal: SPACING.xl },
    firstBookingCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: COLORS.primaryDark, borderRadius: 18, padding: 16, marginTop: SPACING.l, marginBottom: SPACING.l,
    },
    firstBookingIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    firstBookingTitle: { fontSize: 14, fontFamily: FONTS.BOLD_PRIMARY, color: '#fff' },
    firstBookingSub: { fontSize: 11, fontFamily: FONTS.PRIMARY, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontFamily: FONTS.BOLD_PRIMARY, color: COLORS.textPrimary, letterSpacing: 0.3 },
    sectionContainer: { marginBottom: 32 },
    driverRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
    driverAvatar: { width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
    driverName: { flex: 1, fontSize: 12, fontFamily: FONTS.MEDIUM_PRIMARY, color: COLORS.textPrimary },
    matchingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
    matchingText: { flex: 1, fontSize: 11, fontFamily: FONTS.PRIMARY, color: COLORS.textLight, fontStyle: 'italic' },
    quickActionsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    quickActionTile: { flex: 1, backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 16, alignItems: 'center', gap: 8 },
    quickActionIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
    quickActionTitle: { fontSize: 13, fontFamily: FONTS.BOLD_PRIMARY, color: COLORS.textPrimary },
    quickActionSub: { fontSize: 11, fontFamily: FONTS.PRIMARY, color: COLORS.textSecondary, textAlign: 'center' },
    movingBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.primary, borderRadius: 16, padding: 16, marginBottom: 20 },
    movingBannerIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    movingBannerTitle: { fontSize: 14, fontFamily: FONTS.BOLD_PRIMARY, color: '#fff' },
    movingBannerSub: { fontSize: 11, fontFamily: FONTS.PRIMARY, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
    trustBanner: { backgroundColor: COLORS.primaryLight, borderRadius: 16, padding: 16, marginBottom: 8 },
    trustBannerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    trustBannerTitle: { fontSize: 14, fontFamily: FONTS.BOLD_PRIMARY, color: COLORS.textPrimary },
    trustBannerText: { fontSize: 11, fontFamily: FONTS.PRIMARY, color: COLORS.textSecondary, lineHeight: 16, marginBottom: 10 },
    trustChecksRow: { flexDirection: 'row', gap: 16 },
    trustCheckItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    trustCheckText: { fontSize: 11, fontFamily: FONTS.MEDIUM_PRIMARY, color: COLORS.success },
    viewAllButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: COLORS.primaryLight, borderRadius: 12 },
    viewAllText: { color: COLORS.primary, fontSize: 13, fontFamily: FONTS.BOLD_PRIMARY },
    shipmentCard: {
        backgroundColor: COLORS.card, borderRadius: 20, marginBottom: 16, flexDirection: 'row', overflow: 'hidden',
        shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 5,
    },
    statusBar: { width: 6, borderRadius: 3 },
    shipmentContent: { flex: 1, padding: 16 },
    shipmentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    trackingId: { fontSize: 14, fontFamily: FONTS.PRIMARY, color: COLORS.textPrimary, letterSpacing: 0.5 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
    statusText: { fontSize: 12, fontFamily: FONTS.PRIMARY },
    routeContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    routePoint: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
    routeDot: { width: 10, height: 10, borderRadius: 5 },
    routeText: { flex: 1, fontSize: 13, color: COLORS.textSecondary, fontFamily: FONTS.PRIMARY },
    routeLine: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8 },
    dashLine: { width: 20, height: 2, backgroundColor: COLORS.border, borderRadius: 1 },
    shipmentFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    footerText: { fontSize: 13, color: COLORS.textSecondary, fontFamily: FONTS.PRIMARY },
});

export default HomeScreen;
