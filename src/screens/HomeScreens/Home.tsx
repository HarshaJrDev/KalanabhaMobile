import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Pressable,
    Animated,
    StatusBar,
    RefreshControl,
    TextInput,
    Dimensions,
    Platform,
    ActivityIndicator,
    Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Reanimated, { useAnimatedStyle, useSharedValue, useAnimatedScrollHandler, interpolate, Extrapolate, type SharedValue } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMyShipments, useMyShipmentHistory } from '@features/shipments/hooks';
import { useUnreadNotificationCount } from '@features/notifications/hooks';
import { useVehicleConfigs } from '@features/settings/hooks';
import type { VehicleConfig } from '@features/settings/types';
import { useAuthStore } from '@features/store/authStore';
import {
    MapPin,
    Bell,
    Search,
    QrCode,
    Truck,
    Bike,
    Car,
    Package,
    Clock,
    CheckCircle2,
    AlertCircle,
    ChevronRight,
    ArrowRight,
    Star,
    Users,
    MessageCircle,
    Calendar,
    Home,
    RefreshCw,
    Zap,
    Shield,
    RotateCw,
    Phone,
    CalendarClock,
    Calculator,
    type LucideIcon,
} from 'lucide-react-native';
import { RootStackParamList } from '../navigation/types';
import { useAppTheme } from '@theme/ThemeContext';

// Icon per vehicle name — VehicleConfig.icon is a free-text string set by
// whichever admin created the row (seen values: "Bike"/"Van"/"Truck"),
// not a Lucide icon key, so this maps the real config's `name` to a
// matching glyph rather than trying to eval `icon` as a component name.
const VEHICLE_ICON_BY_NAME: Record<string, LucideIcon> = {
    bike: Bike,
    van: Car,
    truck: Truck,
};
const vehicleIconFor = (name: string): LucideIcon => VEHICLE_ICON_BY_NAME[name.toLowerCase()] ?? Truck;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
    // Real dispatch info (kalanabhaBackend Shipment.dispatch) — null until
    // a driver actually accepts. No live distance-to-driver here (that's
    // ShipmentDetailsScreen's job, via useLiveDriverLocation) — showing a
    // fabricated "1.8 km away" on this list would be exactly the kind of
    // invented data this app avoids elsewhere.
    driverName: string | null;
    driverPhone: string | null;
};

// Rebranded from a generic blue palette to Kalanabha's own identity — the
// header/promo gradients now run on brand orange (§4/§7) instead of blue,
// keeping every other key identical so the rest of this file (which reads
// COLORS.* extensively) didn't need touching. Built from useAppTheme()
// inside the component (see makeColors below) instead of a module-level
// constant, so it flips with dark mode.
const makeColors = (BRAND: ReturnType<typeof useAppTheme>['colors']) => ({
    primary: BRAND.PRIMARY,
    primaryDark: BRAND.PRIMARY_DARK,
    primaryLight: BRAND.PRIMARY_LIGHT,
    accent: BRAND.WARNING,
    success: BRAND.SUCCESS,
    warning: BRAND.WARNING,
    danger: BRAND.ERROR,
    background: BRAND.BACKGROUND,
    card: BRAND.SURFACE,
    textPrimary: BRAND.TEXT_PRIMARY,
    textSecondary: BRAND.TEXT_SECONDARY,
    textLight: BRAND.GRAY,
    border: BRAND.BORDER,
    gradientStart: BRAND.PRIMARY,
    gradientEnd: BRAND.PRIMARY_DARK,
    gradientPromo1: [BRAND.PRIMARY, BRAND.PRIMARY_DARK],
    gradientPromo2: ['#8B5CF6', '#7C3AED'],
    gradientPromo3: [BRAND.SUCCESS, '#059669'],
});
type HomeColors = ReturnType<typeof makeColors>;

const SPACING = {
    s: 8,
    m: 12,
    l: 16,
    xl: 20,
    xxl: 24,
};

// Adapts features/shipments' backend-shaped Shipment (nested pickup/drop,
// underscored status) to this screen's local display shape.
const toHomeShipment = (s: import('@shipment/types').Shipment): Shipment => ({
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

const makeStatusConfig = (COLORS: HomeColors): Record<string, { color: string; bg: string; icon: any; label: string }> => ({
    searching: { color: COLORS.warning, bg: '#FEF3C7', icon: RotateCw, label: 'Assigning Pilot' },
    accepted: { color: COLORS.primary, bg: '#EFF6FF', icon: Truck, label: 'Accepted' },
    'in-transit': { color: COLORS.accent, bg: '#FEF3C7', icon: Bike, label: 'In Transit' },
    delivered: { color: COLORS.success, bg: '#ECFDF5', icon: CheckCircle2, label: 'Delivered' },
    expired: { color: COLORS.danger, bg: '#FEF2F2', icon: AlertCircle, label: 'Expired' },
});
type StatusConfig = ReturnType<typeof makeStatusConfig>;

type HomeScreenProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
    const navigation = useNavigation<HomeScreenProp>();
    const { colors: BRAND, fonts: FONTS, isDark } = useAppTheme();
    const COLORS = useMemo(() => makeColors(BRAND), [BRAND]);
    const STATUS_CONFIG = useMemo(() => makeStatusConfig(COLORS), [COLORS]);
    const styles = useMemo(() => makeStyles(COLORS, FONTS), [COLORS, FONTS]);

    // Backend-backed data (Screen -> hook -> API client -> typed response -> cache -> UI)
    const authUser = useAuthStore((s) => s.user);
    const {
        data: myShipments,
        isLoading: shipmentsLoading,
        isRefetching: shipmentsRefetching,
        refetch: refetchShipments,
    } = useMyShipments();
    const { data: unreadCount, refetch: refetchUnreadCount } = useUnreadNotificationCount();
    // Real, admin-managed rates (Settings -> Vehicle Configs in the admin
    // panel) — "Starting Fare" below reads VehicleConfig.baseRate, not a
    // fabricated number. Only active configs are offer-able to customers.
    const { data: vehicleConfigs } = useVehicleConfigs();
    const activeVehicleConfigs = useMemo(
        () => (vehicleConfigs ?? []).filter((v) => v.active),
        [vehicleConfigs],
    );

    const activeShipments = useMemo<Shipment[]>(
        () => (myShipments ?? []).map(toHomeShipment),
        [myShipments],
    );
    const pendingCount = useMemo(
        () => activeShipments.filter((s) => s.status === 'searching').length,
        [activeShipments],
    );
    // Real delivered count via GET /shipments/mine/history (added for
    // Profile.tsx's stats) — GET /shipments/mine only returns active
    // shipments, so this was stuck at 0 before that endpoint existed.
    const { data: shipmentHistory } = useMyShipmentHistory();
    const deliveredCount = useMemo(
        () => shipmentHistory?.filter((s) => s.status === 'delivered').length ?? 0,
        [shipmentHistory],
    );
    const notifCount = unreadCount ?? 0;
    const loading = shipmentsLoading;
    const refreshing = shipmentsRefetching;

    // States
    const [userName, setUserName] = useState('User');
    const [searchText, setSearchText] = useState('');
    const [selectedTruck, setSelectedTruck] = useState('mini');
    const [promoIndex, setPromoIndex] = useState(0);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const headerScale = useRef(new Animated.Value(0.95)).current;
    const promoAnim = useRef(new Animated.Value(1)).current;
    const bellShake = useRef(new Animated.Value(0)).current;
    const searchFocus = useRef(new Animated.Value(1)).current;

    // Initialize animations
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 80,
                friction: 10,
                useNativeDriver: true,
            }),
            Animated.spring(headerScale, {
                toValue: 1,
                tension: 100,
                friction: 12,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    // Notification bell shake animation
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
    }, [notifCount]);

    // Auto-rotating promo animation
    useEffect(() => {
        const interval = setInterval(() => {
            Animated.sequence([
                Animated.timing(promoAnim, { toValue: 0.95, duration: 200, useNativeDriver: true }),
                Animated.timing(promoAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
            ]).start();
            setPromoIndex((prev) => (prev + 1) % 3);
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    // Display name comes from the authenticated backend user, not Firebase.
    useEffect(() => {
        if (authUser?.displayName) {
            setUserName(authUser.displayName.split(' ')[0]);
        }
    }, [authUser?.displayName]);

    const onRefresh = useCallback(async () => {
        await Promise.all([refetchShipments(), refetchUnreadCount()]);
    }, [refetchShipments, refetchUnreadCount]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const renderHeader = () => (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: headerScale }] }}>
            <LinearGradient
                colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                style={styles.header}
            >
                {/* Decorative elements */}
                <View style={styles.deco1} />
                <View style={styles.deco2} />

                {/* Brand row */}
                <View style={styles.brandRow}>
                    <View style={styles.brandLeft}>
                        <View style={styles.brandMark}>
                            <Text style={styles.brandMarkText}>K</Text>
                        </View>
                        <View>
                            <View style={styles.brandNameRow}>
                                <Text style={styles.brandName}>Kalanabha</Text>
                                <View style={styles.fleetBadge}>
                                    <Text style={styles.fleetBadgeText}>FLEET</Text>
                                </View>
                            </View>
                            <Text style={styles.brandSubtitle}>Home</Text>
                        </View>
                    </View>
                    <Pressable style={styles.profileAvatar} onPress={() => (navigation as any).navigate('Profile')}>
                        <Users size={18} color="#fff" />
                    </Pressable>
                </View>

                {/* Top row */}
                <View style={styles.topRow}>
                    <Pressable style={styles.locationPill}>
                        <MapPin size={16} color="#F1F5F9" />
                        <Text style={styles.cityText}>Hyderabad, TS</Text>
                        <ChevronRight size={16} color="#CBD5E1" />
                    </Pressable>

                    <View style={styles.headerActions}>
                        <Pressable style={styles.notifBtn} onPress={() => (navigation as any).navigate('Inbox')}>
                            <MessageCircle size={20} color="#F1F5F9" />
                        </Pressable>

                        <Animated.View style={{
                            transform: [{
                                rotate: bellShake.interpolate({
                                    inputRange: [-12, 12],
                                    outputRange: ['-12deg', '12deg']
                                })
                            }]
                        }}>
                            <Pressable style={styles.notifBtn} onPress={() => (navigation as any).navigate('Notification')}>
                                <Bell size={20} color="#F1F5F9" />
                                {notifCount > 0 && (
                                    <View style={styles.notifBadge}>
                                        <Text style={styles.notifBadgeText}>
                                            {notifCount > 9 ? '9+' : notifCount}
                                        </Text>
                                    </View>
                                )}
                            </Pressable>
                        </Animated.View>
                    </View>
                </View>

                {/* Dispatch caption */}
                <View style={styles.dispatchCaptionRow}>
                    <Zap size={12} color="rgba(255,255,255,0.85)" />
                    <Text style={styles.dispatchCaptionText}>FAST DISPATCH</Text>
                    <View style={styles.dispatchCaptionDot} />
                    <Text style={styles.dispatchCaptionText}>Real-Time Transit</Text>
                </View>

                {/* Greeting */}
                <View style={styles.greeting}>
                    <Text style={styles.greetingText}>{getGreeting()}, {userName}!</Text>
                    <Text style={styles.greetingSub}>Where would you like to deliver today?</Text>
                </View>

                {/* Search bar */}
                <Animated.View style={[styles.searchContainer, {
                    transform: [{ scale: searchFocus }]
                }]}>
                    <Search size={18} color={COLORS.textSecondary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search tracking ID or order..."
                        placeholderTextColor={COLORS.textLight}
                        value={searchText}
                        onChangeText={setSearchText}
                        onFocus={() => Animated.spring(searchFocus, {
                            toValue: 1.02,
                            tension: 200,
                            friction: 10,
                            useNativeDriver: true,
                        }).start()}
                        onBlur={() => Animated.spring(searchFocus, {
                            toValue: 1,
                            tension: 200,
                            friction: 10,
                            useNativeDriver: true,
                        }).start()}
                        onSubmitEditing={() => (navigation as any).navigate('Search')}
                        returnKeyType="search"
                    />
                    <Pressable
                        style={styles.qrBtn}
                        onPress={() => (navigation as any).navigate('QRScan')}
                    >
                        <QrCode size={18} color={COLORS.primary} />
                    </Pressable>
                </Animated.View>
            </LinearGradient>
        </Animated.View>
    );

    const renderStats = () => (
        <Animated.View style={[styles.statsContainer, {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
        }]}>
            {[
                { label: 'Active', value: activeShipments.length, color: COLORS.primary },
                { label: 'Delivered', value: deliveredCount, color: COLORS.success },
                { label: 'Pending', value: pendingCount, color: COLORS.warning },
            ].map((stat, index) => (
                <React.Fragment key={stat.label}>
                    {index > 0 && <View style={styles.statDivider} />}
                    <View style={styles.statItem}>
                        <Text style={[styles.statNumber, { color: stat.color }]}>
                            {stat.value}
                        </Text>
                        <Text style={styles.statLabel}>{stat.label}</Text>
                    </View>
                </React.Fragment>
            ))}
        </Animated.View>
    );

    // Decorative promo carousel — same status as before (no coupons/promo
    // backend exists — §27/§39 of this app's own "don't fabricate a
    // backend feature" rule), just restyled to the light card + badge
    // look from the reference mockup instead of a full-bleed gradient.
    const renderPromo = () => {
        const promos = [
            { title: 'Express Intercity Freight', subtitle: 'Flat ₹50 Off on first van delivery booking with code FIRSTMOVE' },
            { title: 'First Shipment 20% OFF', subtitle: 'Use code WELCOME20 on your first booking' },
            { title: 'Refer & Earn ₹200', subtitle: 'Share your code with friends' },
        ];
        const promo = promos[promoIndex];

        return (
            <Animated.View style={[styles.promoContainer, { opacity: promoAnim }]}>
                <View style={styles.promoCard}>
                    <View style={styles.promoTopRow}>
                        <View style={styles.promoBadge}>
                            <Clock size={11} color="#fff" />
                            <Text style={styles.promoBadgeText}>SPECIAL OFFER</Text>
                        </View>
                        <View style={styles.promoIndicator}>
                            {promos.map((_, i) => (
                                <View key={i} style={[styles.promoDot, i === promoIndex && styles.promoDotActive]} />
                            ))}
                        </View>
                    </View>

                    <Text style={styles.promoTitle}>{promo.title}</Text>
                    <Text style={styles.promoSubtitle}>{promo.subtitle}</Text>

                    <View style={styles.promoBottomRow}>
                        <View style={styles.promoValidRow}>
                            <Shield size={12} color={COLORS.textSecondary} />
                            <Text style={styles.promoValidText}>Valid till midnight</Text>
                        </View>
                        <Pressable style={styles.promoButton}>
                            <Text style={styles.promoButtonText}>Claim Now</Text>
                        </Pressable>
                    </View>
                </View>
            </Animated.View>
        );
    };

    // Card width + spacing for the vehicle swiper below — sized so the next
    // card peeks in from the edge (the "tinder-style" paging feel) rather
    // than filling the whole row.
    const VEHICLE_CARD_WIDTH = SCREEN_WIDTH * 0.72;
    const VEHICLE_CARD_GAP = SPACING.m;
    const vehicleScrollX = useSharedValue(0);
    const vehicleScrollHandler = useAnimatedScrollHandler({
        onScroll: (e) => { vehicleScrollX.value = e.contentOffset.x; },
    });

    const goBookVehicle = (vehicleName: string) => {
        (navigation as any).navigate('AddOrder', { prefill: { vehicleType: vehicleName.toLowerCase() } });
    };

    const renderVehicleSwiper = () => (
        <View style={styles.vehicleSection}>
            <View style={styles.vehicleSectionHeader}>
                <View>
                    <Text style={styles.sectionTitle}>Choose Your Vehicle</Text>
                    <Text style={styles.vehicleSectionSubtitle}>Instant doorstep dispatch in &lt;15 mins</Text>
                </View>
                {activeVehicleConfigs.length > 0 && (
                    <Text style={styles.vehicleReadyText}>{activeVehicleConfigs.length} TYPES READY</Text>
                )}
            </View>
            <Reanimated.ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={VEHICLE_CARD_WIDTH + VEHICLE_CARD_GAP}
                decelerationRate="fast"
                onScroll={vehicleScrollHandler}
                scrollEventThrottle={16}
                contentContainerStyle={{ paddingHorizontal: SPACING.xl, gap: VEHICLE_CARD_GAP }}
            >
                {activeVehicleConfigs.map((v, index) => (
                    <VehicleCard
                        key={v.id}
                        vehicle={v}
                        index={index}
                        isFirst={index === 0}
                        cardWidth={VEHICLE_CARD_WIDTH}
                        cardStep={VEHICLE_CARD_WIDTH + VEHICLE_CARD_GAP}
                        scrollX={vehicleScrollX}
                        styles={styles}
                        colors={COLORS}
                        onPress={() => goBookVehicle(v.name)}
                    />
                ))}
            </Reanimated.ScrollView>
        </View>
    );

    const renderShipments = () => {
        if (loading) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            );
        }

        return (
            <Animated.View style={[styles.sectionContainer, {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
            }]}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Active Shipments</Text>
                    <Pressable style={styles.viewAllButton} onPress={() => (navigation as any).navigate('Orders')}>
                        <Text style={styles.viewAllText}>View All</Text>
                        <ChevronRight size={16} color={COLORS.primary} />
                    </Pressable>
                </View>

                {activeShipments.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Package size={48} color={COLORS.textLight} />
                        <Text style={styles.emptyTitle}>No active shipments</Text>
                        <Text style={styles.emptySubtitle}>Create your first shipment</Text>
                        <Pressable style={styles.emptyButton} onPress={() => (navigation as any).navigate('AddOrder')}>
                            <Text style={styles.emptyButtonText}>Schedule Pickup</Text>
                        </Pressable>
                    </View>
                ) : (
                    activeShipments.map((shipment) => (
                        <ShipmentCard
                            key={shipment.id}
                            shipment={shipment}
                            navigation={navigation}
                            styles={styles}
                            colors={COLORS}
                            statusConfig={STATUS_CONFIG}
                        />
                    ))
                )}
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.gradientEnd} />
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[COLORS.primary]}
                        tintColor={COLORS.primary}
                        progressBackgroundColor={COLORS.background}
                    />
                }
                contentContainerStyle={styles.scrollContent}
            >
                {renderHeader()}
                {renderStats()}
                <View style={styles.mainContent}>
                    {renderPromo()}
                    {renderVehicleSwiper()}
                    {renderShipments()}

                    {/* Quick actions — Schedule Later opens the real booking
                        flow (same as any other "Book" tap); Calculate Rates
                        opens the real fare-check screen (CheckRate.tsx),
                        not a new/fabricated calculator. */}
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

                    {/* Trust banner — decorative, describing the platform in
                        general (not a specific shipment's real insurance/OTP
                        state), same status as the promo card above. */}
                    <View style={styles.trustBanner}>
                        <View style={styles.trustBannerTitleRow}>
                            <Shield size={16} color={COLORS.primary} />
                            <Text style={styles.trustBannerTitle}>Kalanabha Transit Shield</Text>
                        </View>
                        <Text style={styles.trustBannerText}>
                            Insured Deliveries · Verified Fleet Pilots · Encrypted Live GPS Telemetry
                        </Text>
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


// ─── Vehicle swiper card ──────────────────────────────────────────────────
// Reanimated-driven scale/opacity based on the shared horizontal scroll
// position — the active (centered) card sits at full size, neighbors sit
// slightly smaller, which is the "tinder-style" paging feel that was asked
// for. Tapping a card hands off to the real booking flow (addOrders.tsx)
// with that vehicle type prefilled — the same prefill contract
// CheckRate.tsx's "Book This Shipment" already uses, not a new mechanism.
// `vehicle` is a real VehicleConfig row (admin-managed) — maxWeight and
// baseRate below are genuine values from Settings, not fabricated copy.
type VehicleCardProps = {
    vehicle: VehicleConfig;
    index: number;
    isFirst: boolean;
    cardWidth: number;
    cardStep: number;
    scrollX: SharedValue<number>;
    styles: ReturnType<typeof makeStyles>;
    colors: HomeColors;
    onPress: () => void;
};

const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, index, isFirst, cardWidth, cardStep, scrollX, styles, colors: COLORS, onPress }) => {
    const Icon = vehicleIconFor(vehicle.name);
    const animatedStyle = useAnimatedStyle(() => {
        const center = index * cardStep;
        const scale = interpolate(
            scrollX.value,
            [center - cardStep, center, center + cardStep],
            [0.92, 1, 0.92],
            Extrapolate.CLAMP,
        );
        const opacity = interpolate(
            scrollX.value,
            [center - cardStep, center, center + cardStep],
            [0.7, 1, 0.7],
            Extrapolate.CLAMP,
        );
        return { transform: [{ scale }], opacity };
    });

    return (
        <Reanimated.View style={[{ width: cardWidth }, animatedStyle]}>
            <Pressable style={[styles.vehicleCard, isFirst && styles.vehicleCardFeatured]} onPress={onPress}>
                {isFirst && (
                    <View style={styles.vehicleFastestTag}>
                        <Text style={styles.vehicleFastestTagText}>FASTEST DISPATCH</Text>
                    </View>
                )}
                <View style={styles.vehicleCardBody}>
                    <View style={styles.vehicleTopRow}>
                        <View style={styles.vehicleIconWrap}>
                            <Icon color={COLORS.primary} size={26} strokeWidth={1.75} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.vehicleLabel}>{vehicle.name}</Text>
                            {isFirst && (
                                <View style={styles.vehicleArrivalRow}>
                                    <View style={styles.vehicleArrivalDot} />
                                    <Text style={styles.vehicleArrivalText}>~8 mins arrival</Text>
                                </View>
                            )}
                        </View>
                    </View>
                    <Text style={styles.vehicleDesc}>
                        Up to {vehicle.maxWeight} kg
                        {vehicle.specialConditions.length > 0 ? ` · ${vehicle.specialConditions.join(', ')}` : ''}
                    </Text>
                    <View style={styles.vehicleFareRow}>
                        <View>
                            <Text style={styles.vehicleFareLabel}>Starting Fare</Text>
                            <Text style={styles.vehicleFareValue}>From ₹{Math.round(vehicle.baseRate)}</Text>
                        </View>
                        <View style={styles.vehicleBookBtn}>
                            <Text style={styles.vehicleBookBtnText}>Book {vehicle.name}</Text>
                            <ArrowRight size={13} color="#fff" />
                        </View>
                    </View>
                </View>
            </Pressable>
        </Reanimated.View>
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
    const config = statusConfig[shipment.status] || statusConfig.searching;
    const pressAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(pressAnim, {
            toValue: 0.98,
            tension: 300,
            friction: 20,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(pressAnim, {
            toValue: 1,
            tension: 300,
            friction: 20,
            useNativeDriver: true,
        }).start();
    };

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
                            <Text style={[styles.statusText, { color: config.color }]}>
                                {config.label}
                            </Text>
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

                    {/* Real dispatch info once a driver has actually accepted;
                        while still searching, an honest "still matching"
                        line instead of a fabricated ETA/distance. */}
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
                            <Text style={styles.matchingText} numberOfLines={1}>
                                Matching nearby {shipment.type} pilot…
                            </Text>
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

// Computed from useAppTheme() (via the COLORS/FONTS derived above) instead
// of a module-level StyleSheet baked with the light palette, so Home
// repaints correctly in dark mode.
const makeStyles = (COLORS: HomeColors, FONTS: ReturnType<typeof useAppTheme>['fonts']) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    header: {
        paddingHorizontal: SPACING.xl,
        paddingTop: Platform.OS === 'ios' ? 60 : 50,
        paddingBottom: 32,
        position: 'relative',
        overflow: 'hidden',
    },
    deco1: {
        position: 'absolute',
        top: -60,
        right: -40,
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    deco2: {
        position: 'absolute',
        bottom: -30,
        left: -30,
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    brandRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 18,
    },
    brandLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    brandMark: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    brandMarkText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: FONTS.BOLD_PRIMARY,
    },
    brandNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    brandName: {
        color: '#fff',
        fontSize: 15,
        fontFamily: FONTS.BOLD_PRIMARY,
    },
    fleetBadge: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    fleetBadgeText: {
        color: COLORS.primaryDark,
        fontSize: 9,
        fontFamily: FONTS.BOLD_PRIMARY,
        letterSpacing: 0.3,
    },
    brandSubtitle: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: 12,
        fontFamily: FONTS.PRIMARY,
        marginTop: 1,
    },
    profileAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    dispatchCaptionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    dispatchCaptionText: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 11,
        fontFamily: FONTS.BOLD_PRIMARY,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
    },
    dispatchCaptionDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: 'rgba(255,255,255,0.6)',
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    locationPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 24,
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        marginRight: 40
    },
    cityText: {
        color: '#F1F5F9',
        fontSize: 14,
        fontFamily: FONTS.PRIMARY,
        flex: 1,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 10,
    },
    notifBtn: {
        width: 44,
        height: 44,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',

        right: 30
    },
    notifBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: COLORS.danger,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: COLORS.gradientEnd,
    },
    notifBadgeText: {
        color: 'white',
        fontSize: 10,
        fontFamily: FONTS.PRIMARY,
    },
    greeting: {
        marginBottom: 20,
    },
    greetingText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        fontFamily: FONTS.PRIMARY,
        marginBottom: 4,
    },
    userName: {
        color: 'white',
        fontSize: 28,
        fontFamily: FONTS.PRIMARY,
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    greetingSub: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        fontFamily: FONTS.PRIMARY,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 52,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 15,
        fontFamily: FONTS.PRIMARY,
        color: COLORS.textPrimary,
    },
    qrBtn: {
        padding: 6,
        marginLeft: 4,
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.card,
        marginHorizontal: SPACING.xl,
        marginTop: -20,
        borderRadius: 24,
        paddingVertical: 20,
        shadowColor: COLORS.primary,
        // ...SHADOWS.md,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontFamily: FONTS.PRIMARY,
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 12,
        color: COLORS.textLight,
        fontFamily: FONTS.PRIMARY,
        letterSpacing: 0.5,
    },
    statDivider: {
        width: 1,
        backgroundColor: COLORS.border,
        height: 24,
        marginVertical: 8,
    },
    mainContent: {
        paddingHorizontal: SPACING.xl,
        paddingTop: 24,
    },
    promoContainer: {
        marginBottom: 28,
    },
    promoCard: {
        borderRadius: 20,
        padding: 18,
        backgroundColor: COLORS.primaryLight,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    promoTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    promoBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: COLORS.primaryDark,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
    },
    promoBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontFamily: FONTS.BOLD_PRIMARY,
        letterSpacing: 0.3,
    },
    promoTitle: {
        color: COLORS.textPrimary,
        fontSize: 17,
        fontFamily: FONTS.BOLD_PRIMARY,
        marginBottom: 4,
    },
    promoSubtitle: {
        color: COLORS.textSecondary,
        fontSize: 13,
        fontFamily: FONTS.PRIMARY,
        lineHeight: 18,
        marginBottom: 14,
    },
    promoBottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    promoValidRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    promoValidText: {
        fontSize: 11,
        fontFamily: FONTS.PRIMARY,
        color: COLORS.textSecondary,
    },
    promoButton: {
        backgroundColor: COLORS.primaryDark,
        paddingHorizontal: 16,
        paddingVertical: 9,
        borderRadius: 12,
    },
    promoButtonText: {
        color: 'white',
        fontSize: 12,
        fontFamily: FONTS.BOLD_PRIMARY,
    },
    promoIndicator: {
        flexDirection: 'row',
        gap: 5,
    },
    promoDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.border,
    },
    promoDotActive: {
        width: 16,
        backgroundColor: COLORS.primary,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: FONTS.BOLD_PRIMARY,
        color: COLORS.textPrimary,
        letterSpacing: 0.3,
    },
    actionsScroll: {
        paddingRight: 20,
        paddingBottom: 8,
    },
    actionCard: {
        alignItems: 'center',
        marginRight: 16,
        width: 72,
    },
    actionGradient: {
        width: 56,
        height: 56,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
    },

    sectionContainer: {
        marginBottom: 32,
    },

    // ── Vehicle swiper
    vehicleSection: { marginBottom: 28 },
    vehicleSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    vehicleSectionSubtitle: {
        fontSize: 12,
        fontFamily: FONTS.PRIMARY,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    vehicleReadyText: {
        fontSize: 11,
        fontFamily: FONTS.BOLD_PRIMARY,
        color: COLORS.primary,
        marginTop: 4,
    },
    vehicleCard: {
        backgroundColor: COLORS.card,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
        elevation: 4,
    },
    // The featured (first/fastest) card gets an orange border to match —
    // same card, no extra element needed.
    vehicleCardFeatured: {
        borderColor: COLORS.primary,
        borderWidth: 1.5,
    },
    vehicleFastestTag: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderBottomLeftRadius: 10,
    },
    vehicleFastestTagText: {
        color: '#fff',
        fontSize: 9,
        fontFamily: FONTS.BOLD_PRIMARY,
        letterSpacing: 0.3,
    },
    vehicleCardBody: {
        padding: 16,
    },
    vehicleTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 10,
    },
    vehicleIconWrap: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: COLORS.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    vehicleLabel: {
        fontSize: 16,
        fontFamily: FONTS.BOLD_PRIMARY,
        color: COLORS.textPrimary,
    },
    vehicleArrivalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: 3,
    },
    vehicleArrivalDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.success,
    },
    vehicleArrivalText: {
        fontSize: 11,
        fontFamily: FONTS.MEDIUM_PRIMARY,
        color: COLORS.success,
    },
    vehicleDesc: {
        fontSize: 12,
        fontFamily: FONTS.PRIMARY,
        color: COLORS.textSecondary,
        marginBottom: 14,
        lineHeight: 17,
    },
    vehicleFareRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    vehicleFareLabel: {
        fontSize: 10,
        fontFamily: FONTS.PRIMARY,
        color: COLORS.textLight,
    },
    vehicleFareValue: {
        fontSize: 15,
        fontFamily: FONTS.BOLD_PRIMARY,
        color: COLORS.textPrimary,
    },
    vehicleBookBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    vehicleBookBtnText: {
        color: '#fff',
        fontSize: 12,
        fontFamily: FONTS.BOLD_PRIMARY,
    },

    // ── Driver / matching row on shipment cards
    driverRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    driverAvatar: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: COLORS.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    driverName: {
        flex: 1,
        fontSize: 12,
        fontFamily: FONTS.MEDIUM_PRIMARY,
        color: COLORS.textPrimary,
    },
    matchingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    matchingText: {
        flex: 1,
        fontSize: 11,
        fontFamily: FONTS.PRIMARY,
        color: COLORS.textLight,
        fontStyle: 'italic',
    },

    // ── Quick action tiles + trust banner
    quickActionsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    quickActionTile: {
        flex: 1,
        backgroundColor: COLORS.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 16,
        alignItems: 'center',
        gap: 8,
    },
    quickActionIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickActionTitle: {
        fontSize: 13,
        fontFamily: FONTS.BOLD_PRIMARY,
        color: COLORS.textPrimary,
    },
    quickActionSub: {
        fontSize: 11,
        fontFamily: FONTS.PRIMARY,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    trustBanner: {
        backgroundColor: COLORS.primaryLight,
        borderRadius: 16,
        padding: 16,
        marginBottom: 8,
    },
    trustBannerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    trustBannerTitle: {
        fontSize: 14,
        fontFamily: FONTS.BOLD_PRIMARY,
        color: COLORS.textPrimary,
    },
    trustBannerText: {
        fontSize: 11,
        fontFamily: FONTS.PRIMARY,
        color: COLORS.textSecondary,
        lineHeight: 16,
        marginBottom: 10,
    },
    trustChecksRow: {
        flexDirection: 'row',
        gap: 16,
    },
    trustCheckItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    trustCheckText: {
        fontSize: 11,
        fontFamily: FONTS.MEDIUM_PRIMARY,
        color: COLORS.success,
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: COLORS.primaryLight,
        borderRadius: 12,
    },
    viewAllText: {
        color: COLORS.primary,
        fontSize: 13,
        fontFamily: FONTS.BOLD_PRIMARY
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    emptyTitle: {
        fontSize: 18,
        fontFamily: FONTS.BOLD_PRIMARY,
        color: COLORS.textPrimary,
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
        fontFamily: FONTS.PRIMARY
    },
    emptyButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
    },
    emptyButtonText: {
        color: 'white',
        fontSize: 15,
        fontFamily: FONTS.PRIMARY
    },
    shipmentCard: {
        backgroundColor: COLORS.card,
        borderRadius: 20,
        marginBottom: 16,
        flexDirection: 'row',
        overflow: 'hidden',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 5,
    },
    statusBar: {
        width: 6,
        borderRadius: 3,
    },
    shipmentContent: {
        flex: 1,
        padding: 16,
    },
    shipmentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    trackingId: {
        fontSize: 14,
        fontFamily: FONTS.PRIMARY,
        color: COLORS.textPrimary,
        letterSpacing: 0.5,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontFamily: FONTS.PRIMARY
    },
    routeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    routePoint: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    routeDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    routeText: {
        flex: 1,
        fontSize: 13,
        color: COLORS.textSecondary,
        fontFamily: FONTS.PRIMARY
    },
    routeLine: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
    },
    dashLine: {
        width: 20,
        height: 2,
        backgroundColor: COLORS.border,
        borderRadius: 1,
    },
    shipmentFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    footerText: {
        fontSize: 13,
        color: COLORS.textSecondary,
        fontFamily: FONTS.PRIMARY
    },
});

export default HomeScreen;