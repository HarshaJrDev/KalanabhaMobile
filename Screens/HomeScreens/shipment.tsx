import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Platform,
    FlatList,
    ActivityIndicator,
    Pressable,
    Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMyShipments } from '../../features/shipments/hooks';
import type { Shipment as MyShipment } from '../../shipment/types';
import Animated, {
    FadeInDown,
    FadeInUp,
    ZoomIn,
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    interpolate,
    Extrapolate,
} from 'react-native-reanimated';
import {
    MapPin,
    Truck,
    Clock,
    AlertCircle,
    CheckCircle2,
    Package,
    User,
    Phone,
    Zap,
} from 'lucide-react-native';
import { RootStackParamList } from '../navigation/types';
import FONTS from '../../utils/fonts';


const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Design Tokens ──────────────────────────────────────────────────────────
const C = {
    primary: '#2B3FD4',
    primaryDark: '#1A2BA8',
    primaryLight: '#EEF2FF',
    accent: '#FF6B2C',
    bg: '#F2F5FF',
    card: '#FFFFFF',
    text: '#0F1035',
    textMid: '#4B5563',
    textLight: '#9CA3C8',
    border: '#E4E8FF',
    success: '#10B981',
    successLight: '#ECFDF5',
    warning: '#F59E0B',
    warningLight: '#FFFBEB',
    danger: '#EF4444',
    dangerLight: '#FEF2F2',
    white: '#FFFFFF',
};

const S = (v: number) => v;
const H = (v: number) => v;
const W = (v: number) => v;

// Vehicle emoji mapping
const VEHICLE_EMOJIS: Record<string, string> = {
    bike: '🛵',
    mini: '🚗',
    truck: '🚛',
    medium: '🚐',
    large: '🚚',
};

const CATEGORY_EMOJIS: Record<string, string> = {
    Documents: '📄',
    Electronics: '📱',
    Fragile: '⚠️',
    Books: '📚',
    Clothing: '👕',
    Furniture: '🛋️',
    Food: '🍱',
    Others: '📦',
};

// Status configuration with enhanced colors
const STATUS: Record<string, { label: string; color: string; bg: string; emoji: string; icon: any }> = {
    searching: {
        label: 'Searching',
        color: C.warning,
        bg: C.warningLight,
        emoji: '🔎',
        icon: Zap,
    },
    'in-transit': {
        label: 'In Transit',
        color: C.primary,
        bg: C.primaryLight,
        emoji: '🚚',
        icon: Truck,
    },
    delivered: {
        label: 'Delivered',
        color: C.success,
        bg: C.successLight,
        emoji: '✅',
        icon: CheckCircle2,
    },
    expired: {
        label: 'Expired',
        color: C.danger,
        bg: C.dangerLight,
        emoji: '⌛',
        icon: AlertCircle,
    },
    pending: {
        label: 'Pending',
        color: C.warning,
        bg: C.warningLight,
        emoji: '⏳',
        icon: Clock,
    },
    active: {
        label: 'Active',
        color: C.primary,
        bg: C.primaryLight,
        emoji: '📦',
        icon: Package,
    },
};

const TABS = [
    { key: 'all', label: 'All', emoji: '📋' },
    { key: 'searching', label: 'Searching', emoji: '🔎' },
    { key: 'in-transit', label: 'In Transit', emoji: '🚚' },
    { key: 'delivered', label: 'Delivered', emoji: '✅' },
    { key: 'expired', label: 'Expired', emoji: '⌛' },
];

type HomeScreenProp = NativeStackNavigationProp<RootStackParamList, 'Shipment'>;

// ─── Main Component ──────────────────────────────────────────────────────────
// features/shipments' BackendShipment mapped to this screen's loosely-typed
// display shape — mirrors the old Firestore doc shape closely enough that
// the render code below needed no changes.
// NOTE: GET /shipments/mine only returns active shipments (SEARCHING/
// ACCEPTED/IN_TRANSIT) — kalanabhaBackend has no "full shipment history"
// endpoint yet, so the Delivered/Expired tabs stay empty until one exists.
const toListItem = (s: MyShipment) => ({
    id: s.id,
    status: s.status === 'in_transit' ? 'in-transit' : s.status,
    trackingId: s.trackingId,
    orderId: s.shipmentId,
    vehicleType: s.vehicleType,
    package: s.package,
    from: s.from,
    to: s.to,
    price: s.price,
    createdAt: { seconds: Math.floor(new Date(s.createdAt).getTime() / 1000) },
});

const ShipmentScreen = () => {
    const navigation = useNavigation<HomeScreenProp>();
    const [activeTab, setActiveTab] = useState('all');
    const { data: rawShipments, isLoading: loading } = useMyShipments();
    const shipments = useMemo(() => (rawShipments ?? []).map(toListItem), [rawShipments]);
    const [sortBy, setSortBy] = useState<'date' | 'status'>('date');
    const [showSort, setShowSort] = useState(false);

    // Reanimated values
    const headerScale = useSharedValue(0.95);
    const fadeOpacity = useSharedValue(0);
    const listSlide = useSharedValue(20);
    const listFade = useSharedValue(0);
    const sortPanelY = useSharedValue(100);
    const sortPanelOpacity = useSharedValue(0);

    // Initialize header animations
    useEffect(() => {
        headerScale.value = withSpring(1, { damping: 12, mass: 1 });
        fadeOpacity.value = withTiming(1, { duration: 600 });
    }, []);

    // Trigger list animation
    const animateList = () => {
        listSlide.value = 20;
        listFade.value = 0;
        listSlide.value = withSpring(0, { damping: 10, mass: 1 });
        listFade.value = withTiming(1, { duration: 400 });
    };

    // Re-run the list entrance animation whenever the backend-sourced list changes.
    useEffect(() => {
        if (!loading) {
            animateList();
        }
    }, [loading, shipments]);

    // Handle tab change
    const handleTabChange = (key: string) => {
        setActiveTab(key);
        animateList();
    };

    // Toggle sort panel
    const toggleSort = () => {
        setShowSort((v) => {
            const newVal = !v;
            sortPanelY.value = withSpring(newVal ? 0 : 100, { damping: 12 });
            sortPanelOpacity.value = withTiming(newVal ? 1 : 0, { duration: 200 });
            return newVal;
        });
    };

    // Filter & sort shipments
    const filtered = (() => {
        let list = activeTab === 'all' ? shipments : shipments.filter((s) => s.status === activeTab);
        if (sortBy === 'status') {
            list = [...list].sort((a, b) => (a.status || '').localeCompare(b.status || ''));
        }
        return list;
    })();

    // Count per tab
    const counts = TABS.reduce((acc, t) => {
        acc[t.key] = t.key === 'all' ? shipments.length : shipments.filter((s) => s.status === t.key).length;
        return acc;
    }, {} as Record<string, number>);

    // Animated styles
    const headerAnimStyle = useAnimatedStyle(() => ({
        opacity: fadeOpacity.value,
        transform: [{ scale: headerScale.value }],
    }));

    const listAnimStyle = useAnimatedStyle(() => ({
        opacity: listFade.value,
        transform: [{ translateY: listSlide.value }],
    }));

    const sortPanelAnimStyle = useAnimatedStyle(() => ({
        opacity: sortPanelOpacity.value,
        transform: [{ translateY: sortPanelY.value }],
        pointerEvents: showSort ? 'auto' : 'none',
    }));

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" backgroundColor={C.primaryDark} />

            {/* Header */}
            <Animated.View style={[headerAnimStyle]}>
                <LinearGradient
                    colors={[C.primary, C.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.header}
                >
                    <View style={styles.blob1} />
                    <View style={styles.blob2} />
                    <View style={styles.blob3} />

                    {/* Header Content */}
                    <View style={styles.headerTop}>
                        <View>
                            <Text style={[styles.headerSub, { fontFamily: FONTS.MEDIUM_PRIMARY }]}>
                                📦 Overview
                            </Text>
                            <Text style={[styles.headerTitle, { fontFamily: FONTS.BOLD_PRIMARY }]}>
                                My Shipments
                            </Text>
                        </View>
                        <Pressable style={styles.settingsBtn} onPress={toggleSort}>
                            <Text style={styles.settingsEmoji}>⚙️</Text>
                        </Pressable>
                    </View>

                    {/* Summary Stats */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.summaryRow}
                    >
                        {[
                            {
                                label: 'Total',
                                value: shipments.length,
                                color: 'rgba(255,255,255,0.2)',
                                icon: '📦',
                            },
                            {
                                label: 'Searching',
                                value: shipments.filter((s) => s.status === 'searching').length,
                                color: 'rgba(245,158,11,0.4)',
                                icon: '🔎',
                            },
                            {
                                label: 'In Transit',
                                value: shipments.filter((s) => s.status === 'in-transit').length,
                                color: 'rgba(99,102,241,0.4)',
                                icon: '🚚',
                            },
                            {
                                label: 'Delivered',
                                value: shipments.filter((s) => s.status === 'delivered').length,
                                color: 'rgba(16,185,129,0.4)',
                                icon: '✅',
                            },
                        ].map((item, idx) => (
                            <View key={idx} style={[styles.summaryPill, { backgroundColor: item.color }]}>
                                <Text style={styles.summaryEmoji}>{item.icon}</Text>
                                <Text style={[styles.summaryValue, { fontFamily: FONTS.BOLD_PRIMARY }]}>
                                    {item.value}
                                </Text>
                                <Text style={[styles.summaryLabel, { fontFamily: FONTS.SECONDARY }]}>
                                    {item.label}
                                </Text>
                            </View>
                        ))}
                    </ScrollView>

                    {/* Sort Panel */}
                    <Animated.View style={[styles.sortPanel, sortPanelAnimStyle]}>
                        <Text style={[styles.sortTitle, { fontFamily: FONTS.BOLD_PRIMARY }]}>
                            Sort by
                        </Text>
                        {['date', 'status'].map((s) => (
                            <TouchableOpacity
                                key={s}
                                style={styles.sortOption}
                                onPress={() => {
                                    setSortBy(s as any);
                                    toggleSort();
                                }}
                            >
                                <Text
                                    style={[
                                        styles.sortOptionText,
                                        { fontFamily: FONTS.MEDIUM_PRIMARY },
                                        sortBy === s && styles.sortOptionActive,
                                    ]}
                                >
                                    {s === 'date' ? '📅 Date' : '🏷️ Status'}
                                </Text>
                                {sortBy === s && (
                                    <Text style={[styles.sortCheck, { fontFamily: FONTS.BOLD_PRIMARY }]}>
                                        ✓
                                    </Text>
                                )}
                            </TouchableOpacity>
                        ))}
                    </Animated.View>
                </LinearGradient>
            </Animated.View>

            {/* Tab Navigation */}
            <View style={styles.tabsWrap}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabsRow}
                >
                    {TABS.map((t) => {
                        const isActive = activeTab === t.key;
                        return (
                            <TouchableOpacity
                                key={t.key}
                                style={[styles.tab, isActive && styles.tabActive]}
                                onPress={() => handleTabChange(t.key)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.tabEmoji}>{t.emoji}</Text>
                                <Text
                                    style={[
                                        styles.tabLabel,
                                        { fontFamily: FONTS.SEMI_BOLD_PRIMARY },
                                        isActive && styles.tabLabelActive,
                                    ]}
                                >
                                    {t.label}
                                </Text>
                                {counts[t.key] > 0 && (
                                    <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
                                        <Text
                                            style={[
                                                styles.tabBadgeText,
                                                { fontFamily: FONTS.BOLD_PRIMARY },
                                                isActive && styles.tabBadgeTextActive,
                                            ]}
                                        >
                                            {counts[t.key]}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Content */}
            {loading ? (
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="large" color={C.primary} />
                    <Text style={[styles.loadingText, { fontFamily: FONTS.MEDIUM_PRIMARY }]}>
                        Loading shipments…
                    </Text>
                </View>
            ) : filtered.length === 0 ? (
                <Animated.View style={[styles.emptyWrap, listAnimStyle]}>
                    <Text style={styles.emptyEmoji}>📭</Text>
                    <Text style={[styles.emptyTitle, { fontFamily: FONTS.BOLD_PRIMARY }]}>
                        No shipments found
                    </Text>
                    <Text style={[styles.emptyText, { fontFamily: FONTS.SECONDARY }]}>
                        Nothing in this category yet
                    </Text>
                </Animated.View>
            ) : (
                <Animated.View style={[{ flex: 1 }, listAnimStyle]}>
                    <FlatList
                        data={filtered}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item, index }) => (
                            <ShipmentCard
                                item={item}
                                index={index}
                                onPress={() =>
                                    navigation.navigate('ShipmentDetailsScreen', { id: item.id })
                                }
                            />
                        )}
                    />
                </Animated.View>
            )}
        </View>
    );
};

// ─── Shipment Card Component ─────────────────────────────────────────────────
type ShipmentCardProps = {
    item: any;
    index: number;
    onPress: () => void;
};

const ShipmentCard: React.FC<ShipmentCardProps> = ({ item, index, onPress }) => {
    const pressScale = useSharedValue(1);
    const cfg = STATUS[item.status] || STATUS.pending;
    const vehicleEmoji = VEHICLE_EMOJIS[item.vehicleType] || '🚚';
    const categoryEmoji = CATEGORY_EMOJIS[item.package?.category] || '📦';

    const createdDate = item.createdAt?.seconds
        ? new Date(item.createdAt.seconds * 1000)
        : new Date();
    const formattedDate = createdDate.toLocaleDateString([], {
        day: '2-digit',
        month: 'short',
        year: '2-digit',
    });

    return (
        <Animated.View
            entering={FadeInDown.delay(index * 80)}
            style={{ marginBottom: 12 }}
        >
            <Pressable
                style={({ pressed }) => [
                    styles.card,
                    { transform: [{ scale: pressed ? 0.96 : 1 }] },
                ]}
                onPress={onPress}
            >
                {/* Left Status Stripe */}
                <View style={[styles.cardAccent, { backgroundColor: cfg.color }]} />

                <View style={styles.cardBody}>
                    {/* Card Header */}
                    <View style={styles.cardHeader}>
                        <View style={{ flex: 1 }}>
                            <Text
                                style={[
                                    styles.cardTrackingId,
                                    { fontFamily: FONTS.BOLD_PRIMARY },
                                ]}
                            >
                                {vehicleEmoji} {item.trackingId}
                            </Text>
                            <Text
                                style={[
                                    styles.cardOrderId,
                                    { fontFamily: FONTS.SECONDARY },
                                ]}
                            >
                                Order #{item.orderId || 'N/A'}
                            </Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                            <Text style={{ fontSize: 12 }}>{cfg.emoji}</Text>
                            <Text
                                style={[
                                    styles.statusBadgeText,
                                    { color: cfg.color, fontFamily: FONTS.SEMI_BOLD_PRIMARY },
                                ]}
                            >
                                {cfg.label}
                            </Text>
                        </View>
                    </View>

                    {/* Route Display */}
                    <View style={styles.routeSection}>
                        <View style={styles.routePoint}>
                            <MapPin size={14} color={C.primary} />
                            <View style={{ flex: 1 }}>
                                <Text
                                    style={[
                                        styles.routeLabel,
                                        { fontFamily: FONTS.MEDIUM_PRIMARY },
                                    ]}
                                >
                                    From
                                </Text>
                                <Text
                                    style={[
                                        styles.routeCity,
                                        { fontFamily: FONTS.SEMI_BOLD_PRIMARY },
                                    ]}
                                    numberOfLines={1}
                                >
                                    {item.from}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.routeArrow}>
                            <Text style={{ fontSize: 18 }}>→</Text>
                        </View>

                        <View style={[styles.routePoint, { alignItems: 'flex-end' }]}>
                            <MapPin size={14} color={C.accent} />
                            <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                <Text
                                    style={[
                                        styles.routeLabel,
                                        { fontFamily: FONTS.MEDIUM_PRIMARY, textAlign: 'right' },
                                    ]}
                                >
                                    To
                                </Text>
                                <Text
                                    style={[
                                        styles.routeCity,
                                        { fontFamily: FONTS.SEMI_BOLD_PRIMARY },
                                    ]}
                                    numberOfLines={1}
                                >
                                    {item.to}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Package Details */}
                    <View style={styles.packageDetails}>
                        <View style={styles.detailChip}>
                            <Text style={styles.chipEmoji}>{categoryEmoji}</Text>
                            <Text
                                style={[
                                    styles.chipText,
                                    { fontFamily: FONTS.SECONDARY },
                                ]}
                            >
                                {item.package?.category || 'N/A'}
                            </Text>
                        </View>
                        {item.package?.weight && (
                            <View style={styles.detailChip}>
                                <Text style={styles.chipEmoji}>⚖️</Text>
                                <Text
                                    style={[
                                        styles.chipText,
                                        { fontFamily: FONTS.SECONDARY },
                                    ]}
                                >
                                    {item.package.weight} kg
                                </Text>
                            </View>
                        )}
                        <View style={styles.detailChip}>
                            <Clock size={12} color={C.textLight} />
                            <Text
                                style={[
                                    styles.chipText,
                                    { fontFamily: FONTS.SECONDARY },
                                ]}
                            >
                                {item.pickupSlot || '--'}
                            </Text>
                        </View>
                    </View>

                    {/* Sender/Receiver */}
                    <View style={styles.partySection}>
                        <View style={styles.partyItem}>
                            <User size={13} color={C.primary} />
                            <View style={{ flex: 1 }}>
                                <Text
                                    style={[
                                        styles.partyRole,
                                        { fontFamily: FONTS.MEDIUM_PRIMARY },
                                    ]}
                                >
                                    Sender
                                </Text>
                                <Text
                                    style={[
                                        styles.partyName,
                                        { fontFamily: FONTS.SEMI_BOLD_PRIMARY },
                                    ]}
                                    numberOfLines={1}
                                >
                                    {item.sender?.name} ({item.sender?.city})
                                </Text>
                            </View>
                        </View>

                        <View style={styles.partyItem}>
                            <User size={13} color={C.accent} />
                            <View style={{ flex: 1 }}>
                                <Text
                                    style={[
                                        styles.partyRole,
                                        { fontFamily: FONTS.MEDIUM_PRIMARY },
                                    ]}
                                >
                                    Receiver
                                </Text>
                                <Text
                                    style={[
                                        styles.partyName,
                                        { fontFamily: FONTS.SEMI_BOLD_PRIMARY },
                                    ]}
                                    numberOfLines={1}
                                >
                                    {item.receiver?.name} ({item.receiver?.city})
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Footer Meta */}
                    <View style={styles.cardFooter}>
                        <Text
                            style={[
                                styles.footerMeta,
                                { fontFamily: FONTS.SECONDARY },
                            ]}
                        >
                            📅 {formattedDate}
                        </Text>
                        <Text
                            style={[
                                styles.footerMeta,
                                { fontFamily: FONTS.SECONDARY },
                            ]}
                        >
                            {item.serviceType === 'same-day' ? '⚡ Same-day' : '📦 Standard'}
                        </Text>
                        <View style={styles.detailsBtn}>
                            <Text
                                style={[
                                    styles.detailsBtnText,
                                    { fontFamily: FONTS.SEMI_BOLD_PRIMARY },
                                ]}
                            >
                                Details →
                            </Text>
                        </View>
                    </View>
                </View>
            </Pressable>
        </Animated.View>
    );
};

export default ShipmentScreen;

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },

    // Header
    header: {
        paddingTop: Platform.OS === 'ios' ? H(56) : H(38),
        paddingHorizontal: S(16),
        paddingBottom: H(12),
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
    },
    blob1: {
        position: 'absolute',
        top: -80,
        right: -40,
        width: W(200),
        height: W(200),
        borderRadius: W(100),
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    blob2: {
        position: 'absolute',
        bottom: -30,
        left: -50,
        width: W(150),
        height: W(150),
        borderRadius: W(75),
        backgroundColor: 'rgba(255,255,255,0.06)',
    },
    blob3: {
        position: 'absolute',
        top: '50%',
        right: -80,
        width: W(180),
        height: W(180),
        borderRadius: W(90),
        backgroundColor: 'rgba(255,255,255,0.05)',
    },

    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: H(12),
    },
    headerSub: {
        color: 'rgba(255,255,255,0.65)',
        fontSize: 11,
        letterSpacing: 0.5,
        marginBottom: H(2),
    },
    headerTitle: {
        color: '#fff',
        fontSize: 26,
        letterSpacing: -0.5,
        marginTop: H(2),
    },
    settingsBtn: {
        width: W(40),
        height: W(40),
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderRadius: W(12),
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.22)',
    },
    settingsEmoji: { fontSize: 20 },

    summaryRow: {
        gap: S(10),
        paddingBottom: H(4),
        paddingRight: S(16),
    },
    summaryPill: {
        paddingHorizontal: S(14),
        paddingVertical: H(12),
        borderRadius: W(14),
        alignItems: 'center',
        minWidth: W(85),
        justifyContent: 'center',
    },
    summaryEmoji: { fontSize: 18, marginBottom: H(4) },
    summaryValue: {
        color: '#fff',
        fontSize: 18,
    },
    summaryLabel: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: 10,
        marginTop: H(2),
    },

    sortPanel: {
        backgroundColor: C.card,
        borderRadius: W(14),
        padding: S(12),
        marginTop: H(10),
        position: 'absolute',
        right: S(16),
        top: H(100),
        zIndex: 99,
        width: W(180),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    sortTitle: {
        fontSize: 11,
        color: C.textLight,
        letterSpacing: 0.5,
        marginBottom: H(10),
    },
    sortOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: H(8),
    },
    sortOptionText: {
        fontSize: 13,
        color: C.textMid,
    },
    sortOptionActive: { color: C.primary },
    sortCheck: { color: C.primary, fontSize: 16 },

    // Tabs
    tabsWrap: {
        backgroundColor: C.white,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
        elevation: 2,
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    tabsRow: {
        paddingHorizontal: S(12),
        paddingVertical: H(10),
        gap: S(8),
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: S(12),
        paddingVertical: H(8),
        borderRadius: W(20),
        backgroundColor: C.bg,
        borderWidth: 1,
        borderColor: C.border,
        gap: S(6),
    },
    tabActive: {
        backgroundColor: C.primary,
        borderColor: C.primary,
    },
    tabEmoji: { fontSize: 14 },
    tabLabel: { fontSize: 12, color: C.textMid },
    tabLabelActive: { color: '#fff' },
    tabBadge: {
        backgroundColor: C.border,
        borderRadius: W(10),
        minWidth: W(20),
        height: W(20),
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabBadgeActive: { backgroundColor: 'rgba(255,255,255,0.4)' },
    tabBadgeText: { fontSize: 10, color: C.textMid },
    tabBadgeTextActive: { color: '#fff' },

    // List
    listContent: {
        paddingHorizontal: S(12),
        paddingVertical: H(12),
        paddingBottom: H(44),
    },
    loadingWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: H(12),
    },
    loadingText: { color: C.textLight, fontSize: 13 },
    emptyWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: H(8),
    },
    emptyEmoji: { fontSize: 48 },
    emptyTitle: { fontSize: 18, color: C.text, marginTop: H(6) },
    emptyText: { fontSize: 13, color: C.textLight },

    // Card
    card: {
        backgroundColor: C.card,
        borderRadius: W(16),
        flexDirection: 'row',
        overflow: 'hidden',
        shadowColor: '#2B3FD4',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    cardAccent: { width: W(5) },
    cardBody: { flex: 1, padding: S(14), gap: H(10) },

    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: S(10),
    },
    cardTrackingId: { fontSize: 14, color: C.text, letterSpacing: -0.3 },
    cardOrderId: { fontSize: 11, color: C.textLight, marginTop: H(2) },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: S(4),
        borderRadius: W(10),
        paddingHorizontal: S(10),
        paddingVertical: H(5),
    },
    statusBadgeText: { fontSize: 11 },

    routeSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: S(8),
    },
    routePoint: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: S(6),
    },
    routeLabel: { fontSize: 9, color: C.textLight, letterSpacing: 0.5 },
    routeCity: { fontSize: 12, color: C.text, marginTop: H(2) },
    routeArrow: { alignItems: 'center', justifyContent: 'center' },

    packageDetails: {
        flexDirection: 'row',
        gap: S(8),
        flexWrap: 'wrap',
    },
    detailChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: S(4),
        backgroundColor: C.bg,
        borderRadius: W(12),
        paddingHorizontal: S(8),
        paddingVertical: H(4),
    },
    chipEmoji: { fontSize: 12 },
    chipText: { fontSize: 11, color: C.textMid },

    partySection: { gap: H(6) },
    partyItem: { flexDirection: 'row', alignItems: 'flex-start', gap: S(6) },
    partyRole: { fontSize: 9, color: C.textLight, letterSpacing: 0.5 },
    partyName: { fontSize: 11, color: C.text, marginTop: H(1) },

    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: S(8),
        paddingTop: H(6),
        borderTopWidth: 1,
        borderTopColor: C.border,
    },
    footerMeta: { fontSize: 11, color: C.textLight },
    detailsBtn: {
        marginLeft: 'auto',
        backgroundColor: C.primaryLight,
        borderRadius: W(10),
        paddingHorizontal: S(10),
        paddingVertical: H(5),
    },
    detailsBtnText: { color: C.primary, fontSize: 11 },
});