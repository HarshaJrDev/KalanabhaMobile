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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMyShipments } from '../../features/shipments/hooks';
import { useUnreadNotificationCount } from '../../features/notifications/hooks';
import { useAuthStore } from '../../features/store/authStore';
import {
    MapPin,
    Bell,
    Search,
    QrCode,
    Truck,
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
} from 'lucide-react-native';
import { RootStackParamList } from '../navigation/types';
import FONTS from '../../utils/fonts';

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
};

const COLORS = {
    primary: '#2563EB',
    primaryDark: '#1D4ED8',
    primaryLight: '#4F9CFF',
    accent: '#F59E0B',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    background: '#F8FAFC',
    card: '#FFFFFF',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textLight: '#94A3B8',
    border: '#E2E8F0',
    gradientStart: '#3B82F6',
    gradientEnd: '#1E40AF',
    gradientPromo1: ['#8B5CF6', '#7C3AED'],
    gradientPromo2: ['#F59E0B', '#D97706'],
    gradientPromo3: ['#10B981', '#059669'],
};

const SPACING = {
    s: 8,
    m: 12,
    l: 16,
    xl: 20,
    xxl: 24,
};

// Adapts features/shipments' backend-shaped Shipment (nested pickup/drop,
// underscored status) to this screen's local display shape.
const toHomeShipment = (s: import('../../shipment/types').Shipment): Shipment => ({
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
});

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: any; label: string }> = {
    searching: { color: COLORS.warning, bg: '#FEF3C7', icon: Clock, label: 'Pending' },
    accepted: { color: COLORS.primary, bg: '#EFF6FF', icon: Truck, label: 'Accepted' },
    'in-transit': { color: COLORS.accent, bg: '#FEF3C7', icon: Truck, label: 'In Transit' },
    delivered: { color: COLORS.success, bg: '#ECFDF5', icon: CheckCircle2, label: 'Delivered' },
    expired: { color: COLORS.danger, bg: '#FEF2F2', icon: AlertCircle, label: 'Expired' },
};



type HomeScreenProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
    const navigation = useNavigation<HomeScreenProp>();

    // Backend-backed data (Screen -> hook -> API client -> typed response -> cache -> UI)
    const authUser = useAuthStore((s) => s.user);
    const {
        data: myShipments,
        isLoading: shipmentsLoading,
        isRefetching: shipmentsRefetching,
        refetch: refetchShipments,
    } = useMyShipments();
    const { data: unreadCount, refetch: refetchUnreadCount } = useUnreadNotificationCount();

    const activeShipments = useMemo<Shipment[]>(
        () => (myShipments ?? []).map(toHomeShipment),
        [myShipments],
    );
    const pendingCount = useMemo(
        () => activeShipments.filter((s) => s.status === 'searching').length,
        [activeShipments],
    );
    // NOTE: kalanabhaBackend has no "count my delivered shipments" endpoint
    // yet (GET /shipments/mine only returns active ones) — left at 0 rather
    // than inventing one. Revisit once that exists.
    const deliveredCount = 0;
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

                {/* Top row */}
                <View style={styles.topRow}>
                    <Pressable style={styles.locationPill}>
                        <MapPin size={16} color="#F1F5F9" />
                        <Text style={styles.cityText}>Hyderabad, TS</Text>
                        <ChevronRight size={16} color="#CBD5E1" />
                    </Pressable>

                    <Animated.View style={{
                        transform: [{
                            rotate: bellShake.interpolate({
                                inputRange: [-12, 12],
                                outputRange: ['-12deg', '12deg']
                            })
                        }]
                    }}>
                        <Pressable style={styles.notifBtn}>
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

                {/* Greeting */}
                <View style={styles.greeting}>
                    <Text style={styles.greetingText}>{getGreeting()}</Text>
                    <Text style={styles.userName}>{userName}!</Text>
                    <Text style={styles.greetingSub}>Ready to ship?</Text>
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
                    />
                    <Pressable style={styles.qrBtn}>
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

    const renderPromo = () => {
        const promos = [
            { title: 'First Shipment 20% OFF', subtitle: 'Use code WELCOME20', gradient: COLORS.gradientPromo1 },
            { title: 'Express Delivery', subtitle: 'Same day available now', gradient: COLORS.gradientPromo2 },
            { title: 'Refer & Earn ₹200', subtitle: 'Share with friends', gradient: COLORS.gradientPromo3 },
        ];
        const promo = promos[promoIndex];

        return (
            <Animated.View style={[styles.promoContainer, { opacity: promoAnim }]}>
                <LinearGradient colors={promo.gradient} style={styles.promoCard}>
                    <View style={styles.promoContent}>
                        <Text style={styles.promoTitle}>{promo.title}</Text>
                        <Text style={styles.promoSubtitle}>{promo.subtitle}</Text>
                        <Pressable style={styles.promoButton}>
                            <Text style={styles.promoButtonText}>Claim Now</Text>
                            <ArrowRight size={16} color="white" />
                        </Pressable>
                    </View>
                    <View style={styles.promoIndicator}>
                        {promos.map((_, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.promoDot,
                                    i === promoIndex && styles.promoDotActive
                                ]}
                            />
                        ))}
                    </View>
                </LinearGradient>
            </Animated.View>
        );
    };

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
                    <Pressable style={styles.viewAllButton}>
                        <Text style={styles.viewAllText}>View All</Text>
                        <ChevronRight size={16} color={COLORS.primary} />
                    </Pressable>
                </View>

                {activeShipments.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Package size={48} color={COLORS.textLight} />
                        <Text style={styles.emptyTitle}>No active shipments</Text>
                        <Text style={styles.emptySubtitle}>Create your first shipment</Text>
                        <Pressable style={styles.emptyButton}>
                            <Text style={styles.emptyButtonText}>Schedule Pickup</Text>
                        </Pressable>
                    </View>
                ) : (
                    activeShipments.map((shipment) => (
                        <ShipmentCard
                            key={shipment.id}
                            shipment={shipment}
                            navigation={navigation}
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
                    {renderShipments()}
                </View>
            </ScrollView>
        </View>
    );
};


type ShipmentCardProps = {
    shipment: Shipment;
    navigation: HomeScreenProp;
};

const ShipmentCard: React.FC<ShipmentCardProps> = ({ shipment, navigation }) => {
    const config = STATUS_CONFIG[shipment.status] || STATUS_CONFIG.searching;
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

                    <View style={styles.shipmentFooter}>
                        <View style={styles.footerItem}>
                            <Calendar size={14} color={COLORS.textLight} />
                            <Text style={styles.footerText}>
                                {new Date(shipment.createdAt).toLocaleDateString()}
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

const styles = StyleSheet.create({
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
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 120,
        overflow: 'hidden',
        position: 'relative',
    },
    promoContent: {
        flex: 1,
    },
    promoTitle: {
        color: 'white',
        fontSize: 18,
        fontFamily: FONTS.PRIMARY,
        letterSpacing: 0.3,
        marginBottom: 4,
    },
    promoSubtitle: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        fontFamily: FONTS.PRIMARY,
        marginBottom: 12,
    },
    promoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
    },
    promoButtonText: {
        color: 'white',
        fontSize: 13,
        fontFamily: FONTS.PRIMARY
    },
    promoIndicator: {
        position: 'absolute',
        bottom: 16,
        right: 20,
        flexDirection: 'row',
        gap: 6,
    },
    promoDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.4)',
    },
    promoDotActive: {
        width: 20,
        backgroundColor: 'white',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
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
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: '#EFF6FF',
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