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
    TextInput,
    Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMyShipments, useCancelShipment } from '@features/shipments/hooks';
import type { Shipment as MyShipment } from '@shipment/types';
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
    List,
    Bike,
    Car,
    FileText,
    Smartphone,
    AlertTriangle,
    BookOpen,
    Shirt,
    Armchair,
    UtensilsCrossed,
    Calendar,
    Check,
    Inbox,
    Hourglass,
    Weight,
    Search,
    SlidersHorizontal,
    Copy,
    Star,
    ArrowRight,
    Plus,
    Download,
    CalendarDays,
    type LucideIcon,
} from 'lucide-react-native';
import { RootStackParamList } from '../navigation/types';
import FONTS from '@utils/fonts';
import { useAppTheme } from '@theme/ThemeContext';
import { showToast } from '@ui/alert/toastStore';
import { useTabBarContentPadding } from '../navigation/useTabBarStyle';


const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Design Tokens ──────────────────────────────────────────────────────────
// Rebranded to Kalanabha's own orange identity (§4/§7) — every key kept so
// the rest of this file (which reads C.* extensively) didn't need touching.
// Built from useAppTheme() inside each component below instead of a
// module-level constant, so it flips with dark mode.
const makeC = (BRAND: ReturnType<typeof useAppTheme>['colors']) => ({
    primary: BRAND.PRIMARY,
    primaryDark: BRAND.PRIMARY_DARK,
    primaryLight: BRAND.PRIMARY_LIGHT,
    accent: BRAND.PRIMARY,
    bg: BRAND.BACKGROUND,
    card: BRAND.SURFACE,
    text: BRAND.TEXT_PRIMARY,
    textMid: BRAND.TEXT_SECONDARY,
    textLight: BRAND.GRAY,
    border: BRAND.BORDER,
    success: BRAND.SUCCESS,
    successLight: '#ECFDF5',
    warning: BRAND.WARNING,
    warningLight: '#FFFBEB',
    danger: BRAND.ERROR,
    dangerLight: '#FEF2F2',
    white: '#FFFFFF',
});
type ListColors = ReturnType<typeof makeC>;

const S = (v: number) => v;
const H = (v: number) => v;
const W = (v: number) => v;

// Vehicle icon mapping
const VEHICLE_ICONS: Record<string, LucideIcon> = {
    bike: Bike,
    mini: Car,
    truck: Truck,
    medium: Truck,
    large: Truck,
};

const CATEGORY_ICONS: Record<string, LucideIcon> = {
    Documents: FileText,
    Electronics: Smartphone,
    Fragile: AlertTriangle,
    Books: BookOpen,
    Clothing: Shirt,
    Furniture: Armchair,
    Food: UtensilsCrossed,
    Others: Package,
};

// Status configuration with enhanced colors
const makeStatus = (C: ListColors): Record<string, { label: string; color: string; bg: string; icon: LucideIcon }> => ({
    searching: {
        label: 'Searching',
        color: C.warning,
        bg: C.warningLight,
        icon: Zap,
    },
    'in-transit': {
        label: 'In Transit',
        color: C.primary,
        bg: C.primaryLight,
        icon: Truck,
    },
    delivered: {
        label: 'Delivered',
        color: C.success,
        bg: C.successLight,
        icon: CheckCircle2,
    },
    expired: {
        label: 'Expired',
        color: C.danger,
        bg: C.dangerLight,
        icon: AlertCircle,
    },
    pending: {
        label: 'Pending',
        color: C.warning,
        bg: C.warningLight,
        icon: Clock,
    },
    active: {
        label: 'Active',
        color: C.primary,
        bg: C.primaryLight,
        icon: Package,
    },
});

const TABS = [
    { key: 'all', label: 'All', icon: List },
    { key: 'in-transit', label: 'In Transit', icon: Truck },
    { key: 'searching', label: 'Searching', icon: Zap },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
    { key: 'expired', label: 'Expired', icon: Hourglass },
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
    // Previously dropped by this mapper even though ShipmentCard's JSX
    // already referenced item.sender/receiver/pickupSlot/serviceType —
    // those rendered as "undefined (undefined)" silently. Carried through
    // for real now, plus dispatch/paymentMode for the mockup's driver row
    // and payment-mode caption.
    sender: s.sender,
    receiver: s.receiver,
    pickupSlot: s.pickupSlot,
    serviceType: s.serviceType,
    paymentMode: s.paymentMode,
    dispatch: s.dispatch,
});

const ShipmentScreen = () => {
    const { colors: BRAND } = useAppTheme();
    const C = useMemo(() => makeC(BRAND), [BRAND]);
    const STATUS = useMemo(() => makeStatus(C), [C]);
    const styles = useMemo(() => makeStyles(C), [C]);
    const navigation = useNavigation<HomeScreenProp>();
    const [activeTab, setActiveTab] = useState('all');
    const { data: rawShipments, isLoading: loading } = useMyShipments();
    const shipments = useMemo(() => (rawShipments ?? []).map(toListItem), [rawShipments]);
    const [searchText, setSearchText] = useState('');
    // This screen lives under the bottom tab bar (HomeTabs.tsx "Orders")
    // — the list's fixed H(44) bottom padding didn't account for it, so
    // the last card sat behind the bar instead of scrolling clear of it.
    const tabBarPadding = useTabBarContentPadding();

    // Reanimated values
    const headerScale = useSharedValue(0.95);
    const fadeOpacity = useSharedValue(0);
    const listSlide = useSharedValue(20);
    const listFade = useSharedValue(0);

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

    // Filter by tab, then by the search box — client-side over the
    // already-fetched active-shipment list (no separate search endpoint
    // exists), matching against tracking ID, route, or recipient name.
    const filtered = useMemo(() => {
        let list = activeTab === 'all' ? shipments : shipments.filter((s) => s.status === activeTab);
        const q = searchText.trim().toLowerCase();
        if (q) {
            list = list.filter((s) =>
                s.trackingId?.toLowerCase().includes(q) ||
                s.from?.toLowerCase().includes(q) ||
                s.to?.toLowerCase().includes(q) ||
                s.receiver?.name?.toLowerCase().includes(q) ||
                s.sender?.name?.toLowerCase().includes(q),
            );
        }
        return list;
    }, [shipments, activeTab, searchText]);

    // Count per tab
    const counts = TABS.reduce((acc, t) => {
        acc[t.key] = t.key === 'all' ? shipments.length : shipments.filter((s) => s.status === t.key).length;
        return acc;
    }, {} as Record<string, number>);
    const activeTripsCount = counts['in-transit'] + (shipments.filter((s) => s.status === 'accepted').length);

    // Animated styles
    const headerAnimStyle = useAnimatedStyle(() => ({
        opacity: fadeOpacity.value,
        transform: [{ scale: headerScale.value }],
    }));

    const listAnimStyle = useAnimatedStyle(() => ({
        opacity: listFade.value,
        transform: [{ translateY: listSlide.value }],
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
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.headerTitle, { fontFamily: FONTS.BOLD_PRIMARY }]}>
                                My Orders
                            </Text>
                            <Text style={[styles.headerSub, { fontFamily: FONTS.MEDIUM_PRIMARY }]}>
                                Manage &amp; track all consignments
                            </Text>
                        </View>
                        {activeTripsCount > 0 && (
                            <View style={styles.activeTripsBadge}>
                                <Text style={[styles.activeTripsBadgeText, { fontFamily: FONTS.SEMI_BOLD_PRIMARY }]}>
                                    {activeTripsCount} Active Trip{activeTripsCount === 1 ? '' : 's'}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Search */}
                    <View style={styles.searchBar}>
                        <Search size={16} color={C.textLight} />
                        <TextInput
                            style={[styles.searchInput, { fontFamily: FONTS.MEDIUM_PRIMARY }]}
                            placeholder="Search by tracking ID, route, or recipient..."
                            placeholderTextColor={C.textLight}
                            value={searchText}
                            onChangeText={setSearchText}
                        />
                        <SlidersHorizontal size={16} color={C.textLight} />
                    </View>
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
                                <t.icon color={isActive ? '#fff' : C.textMid} size={14} style={styles.tabEmoji} />
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
                    <Inbox color={C.textLight} size={48} style={styles.emptyEmoji} />
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
                        contentContainerStyle={[styles.listContent, { paddingBottom: tabBarPadding }]}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item, index }) => (
                            <ShipmentCard
                                item={item}
                                index={index}
                                onPress={() =>
                                    navigation.navigate('ShipmentDetailsScreen', { id: item.id })
                                }
                                styles={styles}
                                colors={C}
                                status={STATUS}
                            />
                        )}
                    />
                </Animated.View>
            )}

            {/* Footer utility bar */}
            <View style={styles.footerBar}>
                <Pressable style={styles.filterDateBtn} onPress={() => showToast('Date filtering is coming soon', 'info')}>
                    <CalendarDays size={16} color={C.textMid} />
                    <View>
                        <Text style={[styles.filterDateLabel, { fontFamily: FONTS.SECONDARY }]}>Filter Date</Text>
                        <Text style={[styles.filterDateValue, { fontFamily: FONTS.SEMI_BOLD_PRIMARY }]}>All time</Text>
                    </View>
                </Pressable>
                <Pressable style={styles.exportBtn} onPress={() => showToast('Export is not available yet', 'info')}>
                    <Download size={14} color={C.textMid} />
                    <Text style={[styles.exportBtnText, { fontFamily: FONTS.SEMI_BOLD_PRIMARY }]}>Export</Text>
                </Pressable>
                <Pressable style={styles.fab} onPress={() => (navigation as any).navigate('AddOrder')}>
                    <Plus size={20} color="#fff" />
                </Pressable>
            </View>
        </View>
    );
};

// ─── Shipment Card Component ─────────────────────────────────────────────────
type ShipmentCardProps = {
    item: any;
    index: number;
    onPress: () => void;
    styles: ReturnType<typeof makeStyles>;
    colors: ListColors;
    status: ReturnType<typeof makeStatus>;
};

const PAYMENT_LABEL: Record<string, string> = {
    prepaid: 'Paid UPI',
    cod: 'Cash on Delivery',
    credit: 'Credit Account',
};

const ShipmentCard: React.FC<ShipmentCardProps> = ({ item, index, onPress, styles, colors: C, status: STATUS }) => {
    const cfg = STATUS[item.status] || STATUS.pending;
    const VehicleIcon = VEHICLE_ICONS[item.vehicleType] || Truck;
    const CategoryIcon = CATEGORY_ICONS[item.package?.category] || Package;
    const { mutate: cancelShipment, isPending: cancelling } = useCancelShipment(item.id);

    const createdDate = item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000) : new Date();
    const isToday = createdDate.toDateString() === new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = createdDate.toDateString() === yesterday.toDateString();
    const dayLabel = isToday ? 'Today' : isYesterday ? 'Yesterday' : createdDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const timeLabel = createdDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

    const isDelivered = item.status === 'delivered';
    const hasDriver = !!item.dispatch?.driverName;
    const initials = (item.dispatch?.driverName ?? '')
        .split(' ')
        .map((p: string) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const handleCancel = () => {
        Alert.alert('Cancel this order?', `${item.trackingId} will be cancelled.`, [
            { text: 'No', style: 'cancel' },
            {
                text: 'Yes, cancel',
                style: 'destructive',
                onPress: () => cancelShipment(undefined, { onError: () => showToast('Could not cancel — try again', 'error') }),
            },
        ]);
    };

    return (
        <Animated.View entering={FadeInDown.delay(index * 80)} style={{ marginBottom: 14 }}>
            <Pressable
                style={({ pressed }) => [styles.card, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}
                onPress={onPress}
            >
                <View style={[styles.cardAccent, { backgroundColor: cfg.color }]} />

                <View style={styles.cardBody}>
                    {/* Header: tracking id + date, status badge */}
                    <View style={styles.cardHeader}>
                        <View style={styles.cardTrackingRow}>
                            <Text style={[styles.cardTrackingId, { fontFamily: FONTS.BOLD_PRIMARY }]}>
                                {item.trackingId}
                            </Text>
                            <Copy size={12} color={C.textLight} />
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                            <cfg.icon color={cfg.color} size={12} />
                            <Text style={[styles.statusBadgeText, { color: cfg.color, fontFamily: FONTS.SEMI_BOLD_PRIMARY }]}>
                                {cfg.label.toUpperCase()}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.cardDateRow}>
                        <Calendar color={C.textLight} size={11} />
                        <Text style={[styles.cardDateText, { fontFamily: FONTS.SECONDARY }]}>
                            {dayLabel}, {timeLabel}
                        </Text>
                    </View>

                    {isDelivered ? (
                        // Compact single-line route for a finished order — the
                        // full pick-up/drop-off breakdown matters while it's
                        // still moving, not after.
                        <View style={styles.compactRouteRow}>
                            <Text style={[styles.compactRouteText, { fontFamily: FONTS.MEDIUM_PRIMARY }]} numberOfLines={1}>
                                {item.from}
                            </Text>
                            <ArrowRight size={13} color={C.textLight} />
                            <Text style={[styles.compactRouteText, { fontFamily: FONTS.MEDIUM_PRIMARY }]} numberOfLines={1}>
                                {item.to}
                            </Text>
                            <Text style={[styles.compactRouteFare, { fontFamily: FONTS.BOLD_PRIMARY }]}>
                                ₹{item.price ?? '--'}
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.routeFareRow}>
                            <View style={styles.routeCol}>
                                <View style={styles.routeRow}>
                                    <View style={[styles.routeDot, { backgroundColor: C.success }]} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.routeLabel, { fontFamily: FONTS.MEDIUM_PRIMARY }]}>Pick up</Text>
                                        <Text style={[styles.routeCity, { fontFamily: FONTS.SEMI_BOLD_PRIMARY }]} numberOfLines={1}>
                                            {item.from}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.routeDashLine} />
                                <View style={styles.routeRow}>
                                    <View style={[styles.routeDot, { backgroundColor: C.accent }]} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.routeLabel, { fontFamily: FONTS.MEDIUM_PRIMARY }]}>Drop off</Text>
                                        <Text style={[styles.routeCity, { fontFamily: FONTS.SEMI_BOLD_PRIMARY }]} numberOfLines={1}>
                                            {item.to}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.fareCol}>
                                <Text style={[styles.fareLabel, { fontFamily: FONTS.MEDIUM_PRIMARY }]}>
                                    {item.status === 'searching' ? 'Fare Est.' : 'Fare'}
                                </Text>
                                <Text style={[styles.fareValue, { fontFamily: FONTS.BOLD_PRIMARY }]}>₹{item.price ?? '--'}</Text>
                                {item.paymentMode && (
                                    <Text style={[styles.fareSub, { fontFamily: FONTS.SECONDARY }]} numberOfLines={1}>
                                        {PAYMENT_LABEL[item.paymentMode] ?? item.paymentMode}
                                    </Text>
                                )}
                            </View>
                        </View>
                    )}

                    {/* Tags: vehicle + package category */}
                    <View style={styles.packageDetails}>
                        <View style={styles.detailChip}>
                            <VehicleIcon color={C.textMid} size={12} style={styles.chipEmoji} />
                            <Text style={[styles.chipText, { fontFamily: FONTS.SECONDARY }]}>{item.vehicleType || 'N/A'}</Text>
                        </View>
                        <View style={styles.detailChip}>
                            <CategoryIcon color={C.textMid} size={12} style={styles.chipEmoji} />
                            <Text style={[styles.chipText, { fontFamily: FONTS.SECONDARY }]}>
                                {item.package?.category || 'N/A'}
                            </Text>
                        </View>
                    </View>

                    {isDelivered ? (
                        <View style={styles.deliveredFooter}>
                            <View style={styles.deliveredRcvdRow}>
                                <Check color={C.success} size={13} strokeWidth={3} />
                                <Text style={[styles.deliveredRcvdText, { fontFamily: FONTS.MEDIUM_PRIMARY }]} numberOfLines={1}>
                                    Rcvd by {item.receiver?.name ?? 'recipient'} (OTP)
                                </Text>
                            </View>
                            <View style={styles.deliveredActions}>
                                <TouchableOpacity onPress={() => showToast('Rebooking is coming soon', 'info')}>
                                    <Text style={[styles.rebookText, { fontFamily: FONTS.SEMI_BOLD_PRIMARY }]}>Rebook</Text>
                                </TouchableOpacity>
                                <Pressable
                                    style={styles.podBtn}
                                    onPress={() => showToast('Proof of delivery download is not available yet', 'info')}
                                >
                                    <Download size={12} color={C.textMid} />
                                    <Text style={[styles.podBtnText, { fontFamily: FONTS.SEMI_BOLD_PRIMARY }]}>POD</Text>
                                </Pressable>
                            </View>
                        </View>
                    ) : hasDriver ? (
                        <View style={styles.driverRow}>
                            <View style={styles.driverAvatar}>
                                <Text style={[styles.driverInitials, { fontFamily: FONTS.BOLD_PRIMARY }]}>{initials}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <View style={styles.driverNameRow}>
                                    <Text style={[styles.driverName, { fontFamily: FONTS.SEMI_BOLD_PRIMARY }]} numberOfLines={1}>
                                        {item.dispatch.driverName}
                                    </Text>
                                    {item.dispatch.driverRating != null && (
                                        <View style={styles.driverRatingRow}>
                                            <Star size={11} color="#F59E0B" fill="#F59E0B" />
                                            <Text style={[styles.driverRatingText, { fontFamily: FONTS.SEMI_BOLD_PRIMARY }]}>
                                                {item.dispatch.driverRating.toFixed(1)}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                            {item.dispatch.driverPhone && (
                                <Pressable style={styles.driverCallBtn}>
                                    <Phone size={14} color={C.primary} />
                                </Pressable>
                            )}
                            <Pressable style={styles.trackLiveBtn} onPress={onPress}>
                                <Text style={[styles.trackLiveBtnText, { fontFamily: FONTS.BOLD_PRIMARY }]}>Track Live</Text>
                                <ArrowRight size={13} color="#fff" />
                            </Pressable>
                        </View>
                    ) : (
                        <View style={styles.findingFooter}>
                            <TouchableOpacity onPress={handleCancel} disabled={cancelling}>
                                <Text style={[styles.cancelText, { fontFamily: FONTS.SEMI_BOLD_PRIMARY }]}>
                                    {cancelling ? 'Cancelling…' : 'Cancel Request'}
                                </Text>
                            </TouchableOpacity>
                            <Pressable style={styles.viewStatusBtn} onPress={onPress}>
                                <Text style={[styles.viewStatusBtnText, { fontFamily: FONTS.SEMI_BOLD_PRIMARY }]}>View Status</Text>
                            </Pressable>
                        </View>
                    )}
                </View>
            </Pressable>
        </Animated.View>
    );
};

export default ShipmentScreen;

// ─── Styles ─────────────────────────────────────────────────────────────────
// Computed from useAppTheme() (via the C token set derived above) instead
// of a module-level StyleSheet baked with the light palette, so this
// screen repaints correctly in dark mode.
const makeStyles = (C: ListColors) => StyleSheet.create({
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
        alignItems: 'flex-start',
        marginBottom: H(14),
        gap: S(10),
    },
    headerSub: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        marginTop: H(3),
    },
    headerTitle: {
        color: '#fff',
        fontSize: 24,
        letterSpacing: -0.5,
    },
    activeTripsBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: W(12),
        paddingHorizontal: S(12),
        paddingVertical: H(6),
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
    },
    activeTripsBadgeText: { color: '#fff', fontSize: 11 },

    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: S(8),
        backgroundColor: C.white,
        borderRadius: W(14),
        paddingHorizontal: S(14),
        height: H(46),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    searchInput: { flex: 1, fontSize: 13, color: C.text },

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
    tabEmoji: {},
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
    emptyEmoji: { marginBottom: 8 },
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
    cardTrackingRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: S(6) },
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

    cardDateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    cardDateText: { fontSize: 11, color: C.textLight },

    // Compact route for a delivered order
    compactRouteRow: { flexDirection: 'row', alignItems: 'center', gap: S(6) },
    compactRouteText: { flex: 1, fontSize: 12, color: C.textMid },
    compactRouteFare: { fontSize: 14, color: C.text },

    // Route + fare (searching/accepted/in-transit)
    routeFareRow: { flexDirection: 'row', gap: S(10) },
    routeCol: { flex: 1 },
    routeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: S(8) },
    routeDot: { width: 8, height: 8, borderRadius: 4, marginTop: H(3) },
    routeDashLine: { width: 1, height: H(14), backgroundColor: C.border, marginLeft: 3.5, marginVertical: H(2) },
    routeLabel: { fontSize: 9, color: C.textLight, letterSpacing: 0.5 },
    routeCity: { fontSize: 12, color: C.text, marginTop: H(2) },
    fareCol: { alignItems: 'flex-end', justifyContent: 'center' },
    fareLabel: { fontSize: 9, color: C.textLight },
    fareValue: { fontSize: 16, color: C.text, marginTop: H(2) },
    fareSub: { fontSize: 10, color: C.textLight, marginTop: H(2) },

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
    chipEmoji: {},
    chipText: { fontSize: 11, color: C.textMid },

    // Driver row (accepted/in-transit)
    driverRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: S(8),
        backgroundColor: C.primaryLight,
        borderRadius: W(12),
        padding: S(10),
    },
    driverAvatar: {
        width: W(32),
        height: W(32),
        borderRadius: W(16),
        backgroundColor: C.card,
        alignItems: 'center',
        justifyContent: 'center',
    },
    driverInitials: { fontSize: 11, color: C.primary },
    driverNameRow: { flexDirection: 'row', alignItems: 'center', gap: S(6) },
    driverName: { fontSize: 12, color: C.text },
    driverRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    driverRatingText: { fontSize: 11, color: C.textMid },
    driverCallBtn: {
        width: W(30),
        height: W(30),
        borderRadius: W(15),
        backgroundColor: C.card,
        alignItems: 'center',
        justifyContent: 'center',
    },
    trackLiveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: C.primary,
        borderRadius: W(10),
        paddingHorizontal: S(10),
        paddingVertical: H(8),
    },
    trackLiveBtnText: { color: '#fff', fontSize: 11 },

    // Searching / no driver yet
    findingFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: H(4),
    },
    cancelText: { fontSize: 12, color: C.danger },
    viewStatusBtn: {
        backgroundColor: C.bg,
        borderRadius: W(10),
        paddingHorizontal: S(12),
        paddingVertical: H(7),
        borderWidth: 1,
        borderColor: C.border,
    },
    viewStatusBtnText: { fontSize: 11, color: C.textMid },

    // Delivered footer
    deliveredFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: S(8),
        paddingTop: H(4),
        borderTopWidth: 1,
        borderTopColor: C.border,
    },
    deliveredRcvdRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
    deliveredRcvdText: { flex: 1, fontSize: 11, color: C.success },
    deliveredActions: { flexDirection: 'row', alignItems: 'center', gap: S(12) },
    rebookText: { fontSize: 12, color: C.primary },
    podBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: C.bg,
        borderRadius: W(10),
        paddingHorizontal: S(10),
        paddingVertical: H(6),
        borderWidth: 1,
        borderColor: C.border,
    },
    podBtnText: { fontSize: 11, color: C.textMid },

    // ── Footer utility bar
    footerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: S(10),
        paddingHorizontal: S(16),
        paddingVertical: H(12),
        backgroundColor: C.card,
        borderTopWidth: 1,
        borderTopColor: C.border,
    },
    filterDateBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
    filterDateLabel: { fontSize: 10, color: C.textLight },
    filterDateValue: { fontSize: 12, color: C.text },
    exportBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: C.bg,
        borderRadius: W(10),
        paddingHorizontal: S(12),
        paddingVertical: H(9),
        borderWidth: 1,
        borderColor: C.border,
    },
    exportBtnText: { fontSize: 12, color: C.textMid },
    fab: {
        width: W(44),
        height: W(44),
        borderRadius: W(22),
        backgroundColor: C.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
});