import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
    StatusBar,
    Platform,
    Pressable,
    ActivityIndicator,
    Alert,
    Clipboard,
    Linking,
    Share,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useShipment } from '@features/shipments/hooks';
import { useLiveDriverLocation } from '@location/useLiveDriverLocation';
import { haversineDistanceKm } from '@utils/geo';
import { openGoogleMapsDirections } from '@utils/navigation';
import { showToast } from '@ui/alert/toastStore';
import {
    CheckCircle2,
    Truck,
    Clock,
    Package,
    XCircle,
    ClipboardList,
    Bike,
    Check,
    Copy,
    MapPin,
    Home,
    Tag,
    Folder,
    Weight,
    Hash,
    Map,
    Phone,
    MessageCircle,
    FileText,
    Circle,
    type LucideIcon,
} from 'lucide-react-native';

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const C = {
    primary: '#2B3FD4',
    primaryDark: '#1A2BA8',
    primaryLight: '#EEF2FF',
    accent: '#FF6B2C',
    accentLight: '#FFF0E8',
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

const RF = (s: number) => s;
const H = (v: number) => v;
const S = (v: number) => v;
const W = (v: number) => v;

// ─── Status config ──────────────────────────────────────────────────────────────
const STATUS: Record<string, { label: string; color: string; bg: string; icon: LucideIcon }> = {
    delivered: { label: 'Delivered', color: C.success, bg: C.successLight, icon: CheckCircle2 },
    'in-transit': { label: 'In Transit', color: C.primary, bg: C.primaryLight, icon: Truck },
    pending: { label: 'Pending', color: C.warning, bg: C.warningLight, icon: Clock },
    active: { label: 'Active', color: C.primary, bg: C.primaryLight, icon: Package },
    cancelled: { label: 'Cancelled', color: C.danger, bg: C.dangerLight, icon: XCircle },
};

// ─── Timeline steps ─────────────────────────────────────────────────────────────
const TIMELINE = [
    { key: 'placed', label: 'Order Placed', icon: ClipboardList, done: true },
    { key: 'picked', label: 'Picked Up', icon: Package, done: true },
    { key: 'in-transit', label: 'In Transit', icon: Truck, done: true },
    { key: 'out', label: 'Out for Delivery', icon: Bike, done: false },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle2, done: false },
];

// ─── Demo fallback data ─────────────────────────────────────────────────────────
const DEMO: any = {
    id: '#15152162GH9994',
    trackingId: '554551955',
    status: 'in-transit',
    name: 'Electronic Components',
    category: 'Electronics',
    weight: '2.70 Kg',
    quantity: 35,
    deliveredOn: 'Saturday, 15th Mar, 12:39 PM',
    estimatedDate: 'Monday, 17th Mar',
    sender: {
        name: 'Arjun Sharma',
        phone: '+91 98765 43210',
        address: '123, MG Road, Bangalore – 560001',
    },
    receiver: {
        name: 'Priya Patel',
        phone: '+91 87654 32100',
        address: '456, Brigade Road, Hyderabad – 500001',
    },
    payment: {
        courierCharge: 35,
        delivery: 10,
        vat: 10,
        coupon: -10,
        total: 75,
        currency: '₹',
        method: 'UPI',
    },
    timeline: ['placed', 'picked', 'in-transit'],
};

// ─── Prop types ─────────────────────────────────────────────────────────────────
type RouteParams = { id?: string };

const formatTimeAgo = (date: Date | null): string => {
    if (!date) return 'just now';
    const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
    if (seconds < 10) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.round(minutes / 60)}h ago`;
};

// ═══════════════════════════════════════════════════════════════════════════════
const ShipmentDetailsScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
    const shipmentId = route?.params?.id;

    // Screen -> hook -> shipments.api -> GET /shipments/:id -> typed Shipment -> cache -> UI
    const { data: shipment, isLoading: shipmentLoading } = useShipment(shipmentId);
    const loading = !!shipmentId && shipmentLoading;
    const data: any = shipment ?? (loading ? null : DEMO);
    const [copied, setCopied] = useState(false);

    // Rapido-style live tracking — only listens while a driver is actually
    // assigned and out on the delivery (backend status strings use
    // underscores: 'accepted' / 'in_transit', unlike this screen's own
    // display-only STATUS map below which uses hyphens for labels).
    const isDriverEnRoute = data?.status === 'accepted' || data?.status === 'in_transit';
    const liveDriverLocation = useLiveDriverLocation(isDriverEnRoute ? shipmentId : null);
    const distanceToDriverKm =
        liveDriverLocation && data?.pickup?.lat != null && data?.pickup?.lng != null
            ? haversineDistanceKm(
                { lat: data.pickup.lat, lng: data.pickup.lng },
                { lat: liveDriverLocation.lat, lng: liveDriverLocation.lng }
            )
            : null;

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const headerScale = useRef(new Animated.Value(0.95)).current;
    const cardAnims = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(30))).current;
    const cardFades = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(0))).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Pulse for active step
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.18, duration: 700, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    // Staggered card entrance
    const runEntrance = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.spring(headerScale, { toValue: 1, tension: 55, friction: 9, useNativeDriver: true }),
            ...cardAnims.map((a, i) =>
                Animated.spring(a, { toValue: 0, tension: 55, friction: 9, delay: 80 + i * 70, useNativeDriver: true })
            ),
            ...cardFades.map((a, i) =>
                Animated.timing(a, { toValue: 1, duration: 350, delay: 80 + i * 70, useNativeDriver: true })
            ),
        ]).start();
    };

    // Re-run the entrance animation once the backend-sourced shipment (or
    // the no-id DEMO fallback) is ready to render.
    useEffect(() => {
        if (!loading) {
            runEntrance();
        }
    }, [loading, shipment]);

    const copyToClipboard = (text: string) => {
        Clipboard.setString(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <View style={styles.loadingWrap}>
                <StatusBar barStyle="light-content" backgroundColor={C.primaryDark} />
                <LinearGradient colors={[C.primary, C.primaryDark]} style={styles.loadingGrad}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.loadingText}>Loading shipment…</Text>
                </LinearGradient>
            </View>
        );
    }

    const statusCfg = STATUS[data?.status] || STATUS['in-transit'];
    const payment = data?.payment || DEMO.payment;
    const doneSteps = data?.timeline || DEMO.timeline;

    // ─── Renders ───────────────────────────────────────────────────────────────

    const renderHeader = () => (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: headerScale }] }}>
            <LinearGradient
                colors={[C.primary, C.primaryDark]}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {/* Decorative blobs */}
                <View style={styles.blob1} />
                <View style={styles.blob2} />

                {/* Back + Title */}
                <View style={styles.headerTop}>
                    <TouchableOpacity
                        style={styles.backBtn}
                        activeOpacity={0.8}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.backArrow}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Shipment Details</Text>
                    <TouchableOpacity
                        style={styles.backBtn}
                        activeOpacity={0.8}
                        onPress={() => {
                            const trackingId = data?.trackingId || DEMO.trackingId;
                            Share.share({
                                message: `Track my Kalanabha shipment #${trackingId}`,
                            }).catch(() => showToast('Unable to share', 'error'));
                        }}
                    >
                        <Text style={{ fontSize: 18 }}>↗</Text>
                    </TouchableOpacity>
                </View>

                {/* Shipment ID pill */}
                <Pressable
                    style={styles.idPill}
                    onPress={() => copyToClipboard(data?.id || DEMO.id)}
                >
                    <Text style={styles.idLabel}>SHIPMENT ID</Text>
                    <View style={styles.idRow}>
                        <Text style={styles.idValue}>{data?.id || DEMO.id}</Text>
                        <View style={[styles.copyBtn, copied && styles.copyBtnDone]}>
                            {copied ? (
                                <Check color={C.success} size={12} strokeWidth={3} />
                            ) : (
                                <Copy color={C.textMid} size={12} />
                            )}
                        </View>
                    </View>
                </Pressable>

                {/* Status badge */}
                <View style={styles.statusRow}>
                    <View style={[styles.statusPill, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                        <statusCfg.icon color="#fff" size={14} />
                        <Text style={styles.statusLabel}>{statusCfg.label}</Text>
                    </View>
                    <View>
                        <Text style={styles.estLabel}>
                            {data?.status === 'delivered' ? 'Delivered on' : 'Estimated delivery'}
                        </Text>
                        <Text style={styles.estDate}>
                            {data?.status === 'delivered'
                                ? (data?.deliveredOn || DEMO.deliveredOn)
                                : (data?.estimatedDate || DEMO.estimatedDate)}
                        </Text>
                    </View>
                </View>
            </LinearGradient>
        </Animated.View>
    );

    const renderTimeline = () => (
        <AnimatedCard anim={cardAnims[0]} fade={cardFades[0]}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Tracking Timeline</Text>
                <Text style={styles.trackingId}>#{data?.trackingId || DEMO.trackingId}</Text>
            </View>
            <View style={styles.timeline}>
                {TIMELINE.map((step, i) => {
                    const isDone = doneSteps.includes(step.key);
                    const isActive = doneSteps[doneSteps.length - 1] === step.key;
                    const isLast = i === TIMELINE.length - 1;
                    return (
                        <View key={step.key} style={styles.timelineRow}>
                            {/* Left column */}
                            <View style={styles.timelineLeft}>
                                {isActive ? (
                                    <Animated.View style={[styles.tlDotActive, { transform: [{ scale: pulseAnim }] }]}>
                                        <step.icon color="#fff" size={12} />
                                    </Animated.View>
                                ) : (
                                    <View style={[styles.tlDot, isDone && styles.tlDotDone]}>
                                        {isDone ? (
                                            <step.icon color={C.primary} size={12} />
                                        ) : (
                                            <Circle color={C.textLight} size={10} />
                                        )}
                                    </View>
                                )}
                                {!isLast && (
                                    <View style={[styles.tlLine, isDone && styles.tlLineDone]} />
                                )}
                            </View>
                            {/* Content */}
                            <View style={[styles.tlContent, !isLast && { marginBottom: H(20) }]}>
                                <Text style={[styles.tlLabel, isDone && { color: C.text, fontWeight: '700' }]}>
                                    {step.label}
                                </Text>
                                {isActive && (
                                    <View style={styles.tlActivePill}>
                                        <Text style={styles.tlActivePillText}>Current Status</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    );
                })}
            </View>
        </AnimatedCard>
    );

    const renderRoute = () => (
        <AnimatedCard anim={cardAnims[1]} fade={cardFades[1]}>
            <Text style={styles.cardTitle}>Route</Text>
            <View style={styles.routeWrap}>
                {/* From */}
                <View style={styles.routeNode}>
                    <View style={[styles.routeDot, { backgroundColor: C.primary }]}>
                        <MapPin color="#fff" size={12} />
                    </View>
                    <View style={styles.routeInfo}>
                        <Text style={styles.routeRole}>SENDER</Text>
                        <Text style={styles.routeName}>{data?.sender?.name || DEMO.sender.name}</Text>
                        <Text style={styles.routeAddr}>{data?.sender?.address || DEMO.sender.address}</Text>
                        <Text style={styles.routePhone}>{data?.sender?.phone || DEMO.sender.phone}</Text>
                    </View>
                </View>

                {/* Connector */}
                <View style={styles.routeConnector}>
                    <View style={styles.routeConnLine} />
                    <LinearGradient colors={[C.primary, C.accent]} style={[styles.routeArrowBadge, styles.routeArrowBadgeRow]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                        <Truck color="#fff" size={11} />
                        <Text style={styles.routeArrowText}>In Transit</Text>
                    </LinearGradient>
                    <View style={styles.routeConnLine} />
                </View>

                {/* To */}
                <View style={styles.routeNode}>
                    <View style={[styles.routeDot, { backgroundColor: C.accent }]}>
                        <Home color="#fff" size={12} />
                    </View>
                    <View style={styles.routeInfo}>
                        <Text style={[styles.routeRole, { color: C.accent }]}>RECEIVER</Text>
                        <Text style={styles.routeName}>{data?.receiver?.name || DEMO.receiver.name}</Text>
                        <Text style={styles.routeAddr}>{data?.receiver?.address || DEMO.receiver.address}</Text>
                        <Text style={styles.routePhone}>{data?.receiver?.phone || DEMO.receiver.phone}</Text>
                    </View>
                </View>
            </View>
        </AnimatedCard>
    );

    const renderLiveTracking = () => {
        if (!liveDriverLocation) return null;

        return (
            <AnimatedCard anim={cardAnims[1]} fade={cardFades[1]}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Live Tracking</Text>
                    <View style={styles.liveBadge}>
                        <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
                        <Text style={styles.liveBadgeText}>LIVE</Text>
                    </View>
                </View>
                <View style={styles.liveTrackingRow}>
                    <Bike color={C.primary} size={28} style={styles.liveTrackingEmoji} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.liveTrackingMain}>
                            {distanceToDriverKm != null
                                ? `Driver is ${distanceToDriverKm.toFixed(1)} km away`
                                : 'Driver location received'}
                        </Text>
                        <Text style={styles.liveTrackingSub}>
                            Updated {formatTimeAgo(liveDriverLocation.updatedAt)}
                        </Text>
                    </View>
                </View>
            </AnimatedCard>
        );
    };

    const renderPackage = () => (
        <AnimatedCard anim={cardAnims[2]} fade={cardFades[2]}>
            <Text style={styles.cardTitle}>Package Details</Text>
            <View style={styles.packageGrid}>
                {[
                    { icon: Tag, label: 'Name', value: data?.name || DEMO.name },
                    { icon: Folder, label: 'Category', value: data?.category || DEMO.category },
                    { icon: Weight, label: 'Weight', value: data?.weight || DEMO.weight },
                    { icon: Hash, label: 'Quantity', value: String(data?.quantity ?? DEMO.quantity) },
                ].map(item => (
                    <View key={item.label} style={styles.packageItem}>
                        <item.icon color={C.primary} size={18} style={styles.pkgEmoji} />
                        <Text style={styles.pkgLabel}>{item.label}</Text>
                        <Text style={styles.pkgValue}>{item.value}</Text>
                    </View>
                ))}
            </View>
        </AnimatedCard>
    );

    const renderPayment = () => {
        const rows = [
            { label: 'Courier Charge', value: payment.courierCharge, bold: false },
            { label: 'Delivery', value: payment.delivery, bold: false },
            { label: 'VAT', value: payment.vat, bold: false },
            { label: 'Coupon', value: payment.coupon, bold: false, isDiscount: true },
        ];
        return (
            <AnimatedCard anim={cardAnims[3]} fade={cardFades[3]}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Payment Summary</Text>
                    <View style={styles.payMethodPill}>
                        <Text style={styles.payMethodText}>{payment.method || 'UPI'}</Text>
                    </View>
                </View>
                {rows.map(row => (
                    <View key={row.label} style={styles.payRow}>
                        <Text style={styles.payLabel}>{row.label}</Text>
                        <Text style={[styles.payValue, row.isDiscount && { color: C.success }]}>
                            {row.isDiscount && row.value < 0 ? `- ${payment.currency} ${Math.abs(row.value)}` : `${payment.currency} ${row.value}`}
                        </Text>
                    </View>
                ))}
                <View style={styles.payDivider} />
                <View style={styles.payTotalRow}>
                    <Text style={styles.payTotalLabel}>Total</Text>
                    <Text style={styles.payTotalValue}>{payment.currency} {payment.total}</Text>
                </View>
            </AnimatedCard>
        );
    };

    const handleLiveMap = () => {
        if (data?.pickup?.lat == null || data?.drop?.lat == null) {
            showToast('Route not available yet', 'info');
            return;
        }
        openGoogleMapsDirections(data.pickup, data.drop).catch(() =>
            showToast('Unable to open maps', 'error'),
        );
    };

    const handleCallDriver = () => {
        const phone = data?.dispatch?.driverPhone;
        if (!phone) {
            showToast('No driver assigned yet', 'info');
            return;
        }
        Linking.openURL(`tel:${phone}`).catch(() => showToast('Unable to open the dialer', 'error'));
    };

    const handleChatSupport = () => {
        if (!shipmentId) {
            showToast('Chat is unavailable in demo mode', 'info');
            return;
        }
        (navigation as any).navigate('ShipmentChat', { shipmentId });
    };

    const handleDownloadPod = () => {
        // No proof-of-delivery document endpoint exists on the backend yet
        // (kalanabhaBackend has no file-generation/storage for this) —
        // surfaced honestly rather than faking a download.
        showToast('Proof of delivery download is not available yet', 'info');
    };

    const renderActions = () => (
        <AnimatedCard anim={cardAnims[4]} fade={cardFades[4]} noPad>
            <View style={styles.actionsGrid}>
                {[
                    { icon: Map, label: 'Live Map', color: [C.primary, '#6366F1'] as const, onPress: handleLiveMap },
                    { icon: Phone, label: 'Call Driver', color: ['#10B981', '#059669'] as const, onPress: handleCallDriver },
                    { icon: MessageCircle, label: 'Chat Support', color: ['#F59E0B', '#D97706'] as const, onPress: handleChatSupport },
                    { icon: FileText, label: 'Download POD', color: ['#EF4444', '#DC2626'] as const, onPress: handleDownloadPod },
                ].map(btn => (
                    <TouchableOpacity key={btn.label} style={styles.actionBtn} activeOpacity={0.85} onPress={btn.onPress}>
                        <LinearGradient colors={btn.color} style={styles.actionBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                            <btn.icon color="#fff" size={20} />
                        </LinearGradient>
                        <Text style={styles.actionBtnLabel}>{btn.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </AnimatedCard>
    );

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" backgroundColor={C.primaryDark} />
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {renderHeader()}
                <View style={styles.body}>
                    {renderTimeline()}
                    {renderRoute()}
                    {renderLiveTracking()}
                    {renderPackage()}
                    {renderPayment()}
                    {renderActions()}
                </View>
            </ScrollView>
        </View>
    );
};

// ─── AnimatedCard wrapper ───────────────────────────────────────────────────────
const AnimatedCard = ({ children, anim, fade, noPad }: {
    children: React.ReactNode;
    anim: Animated.Value;
    fade: Animated.Value;
    noPad?: boolean;
}) => (
    <Animated.View style={[
        styles.card,
        noPad && { padding: 0, overflow: 'hidden' },
        { opacity: fade, transform: [{ translateY: anim }] },
    ]}>
        {children}
    </Animated.View>
);

export default ShipmentDetailsScreen;

// ─── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    scrollContent: { paddingBottom: H(40) },
    loadingWrap: { flex: 1 },
    loadingGrad: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: H(14) },
    loadingText: { color: '#fff', fontSize: RF(15), fontWeight: '600' },

    // ── Header
    header: {
        paddingTop: Platform.OS === 'ios' ? H(58) : H(38),
        paddingHorizontal: S(20),
        paddingBottom: H(26),
        borderBottomLeftRadius: W(28),
        borderBottomRightRadius: W(28),
        overflow: 'hidden',
    },
    blob1: { position: 'absolute', top: -50, right: -40, width: W(200), height: W(200), borderRadius: W(100), backgroundColor: 'rgba(255,255,255,0.05)' },
    blob2: { position: 'absolute', bottom: -30, left: -30, width: W(140), height: W(140), borderRadius: W(70), backgroundColor: 'rgba(255,255,255,0.04)' },

    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: H(20) },
    backBtn: { width: W(38), height: W(38), backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: W(12), alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    backArrow: { color: '#fff', fontSize: RF(18), fontWeight: '700' },
    headerTitle: { color: '#fff', fontSize: RF(17), fontWeight: '800', letterSpacing: 0.3 },

    idPill: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: W(14), padding: S(14), marginBottom: H(16), borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    idLabel: { color: 'rgba(255,255,255,0.6)', fontSize: RF(10), fontWeight: '700', letterSpacing: 1, marginBottom: H(4) },
    idRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    idValue: { color: '#fff', fontSize: RF(16), fontWeight: '800', letterSpacing: 0.5 },
    copyBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: W(8), paddingHorizontal: S(10), paddingVertical: H(5) },
    copyBtnDone: { backgroundColor: C.success },

    statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    statusPill: { flexDirection: 'row', alignItems: 'center', gap: S(7), borderRadius: W(12), paddingHorizontal: S(12), paddingVertical: H(7) },
    statusLabel: { color: '#fff', fontSize: RF(13), fontWeight: '700' },
    estLabel: { color: 'rgba(255,255,255,0.55)', fontSize: RF(10), fontWeight: '600', textAlign: 'right' },
    estDate: { color: '#fff', fontSize: RF(12), fontWeight: '700', textAlign: 'right', marginTop: H(2) },

    // ── Body + Card
    body: { padding: S(16), gap: H(14) },
    card: {
        backgroundColor: C.card,
        borderRadius: W(20),
        padding: S(18),
        shadowColor: '#2B3FD4',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.07,
        shadowRadius: 14,
        elevation: 4,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: H(14) },
    cardTitle: { fontSize: RF(15), fontWeight: '800', color: C.text, marginBottom: H(14), letterSpacing: 0.2 },

    trackingId: { fontSize: RF(12), color: C.primary, fontWeight: '700', backgroundColor: C.primaryLight, paddingHorizontal: S(10), paddingVertical: H(4), borderRadius: W(10) },

    // ── Live tracking
    liveBadge: { flexDirection: 'row', alignItems: 'center', gap: S(5), backgroundColor: C.successLight, paddingHorizontal: S(9), paddingVertical: H(4), borderRadius: W(10) },
    liveDot: { width: W(7), height: W(7), borderRadius: W(4), backgroundColor: C.success },
    liveBadgeText: { fontSize: RF(10), fontWeight: '800', color: C.success, letterSpacing: 0.5 },
    liveTrackingRow: { flexDirection: 'row', alignItems: 'center', gap: S(12) },
    liveTrackingEmoji: {},
    liveTrackingMain: { fontSize: RF(14), fontWeight: '700', color: C.text },
    liveTrackingSub: { fontSize: RF(12), color: C.textMid, marginTop: H(2) },

    // ── Timeline
    timeline: { paddingLeft: S(4) },
    timelineRow: { flexDirection: 'row' },
    timelineLeft: { alignItems: 'center', width: W(36), marginRight: S(12) },
    tlDot: { width: W(32), height: W(32), borderRadius: W(16), backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: C.border },
    tlDotDone: { backgroundColor: C.primaryLight, borderColor: C.primary },
    tlDotActive: { width: W(36), height: W(36), borderRadius: W(18), backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
    tlLine: { width: 2, flex: 1, backgroundColor: C.border, marginVertical: H(3), minHeight: H(18) },
    tlLineDone: { backgroundColor: C.primary },
    tlContent: { flex: 1, paddingTop: H(6) },
    tlLabel: { fontSize: RF(13), color: C.textLight, fontWeight: '600' },
    tlActivePill: { marginTop: H(4), alignSelf: 'flex-start', backgroundColor: C.primaryLight, borderRadius: W(8), paddingHorizontal: S(8), paddingVertical: H(3) },
    tlActivePillText: { color: C.primary, fontSize: RF(10), fontWeight: '700' },

    // ── Route
    routeWrap: { gap: H(4) },
    routeNode: { flexDirection: 'row', alignItems: 'flex-start', gap: S(12) },
    routeDot: { width: W(36), height: W(36), borderRadius: W(18), alignItems: 'center', justifyContent: 'center', marginTop: H(2) },
    routeInfo: { flex: 1 },
    routeRole: { fontSize: RF(10), fontWeight: '800', color: C.primary, letterSpacing: 1, marginBottom: H(2) },
    routeName: { fontSize: RF(14), fontWeight: '800', color: C.text },
    routeAddr: { fontSize: RF(12), color: C.textMid, marginTop: H(2), lineHeight: 17 },
    routePhone: { fontSize: RF(12), color: C.primary, marginTop: H(3), fontWeight: '600' },
    routeConnector: { flexDirection: 'row', alignItems: 'center', paddingVertical: H(10), paddingLeft: W(18) },
    routeConnLine: { flex: 1, height: 1.5, backgroundColor: C.border },
    routeArrowBadge: { paddingHorizontal: S(12), paddingVertical: H(6), borderRadius: W(12), marginHorizontal: S(10) },
    routeArrowBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    routeArrowText: { color: '#fff', fontSize: RF(11), fontWeight: '700' },

    // ── Package
    packageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: S(10) },
    packageItem: { width: '47%', backgroundColor: C.bg, borderRadius: W(14), padding: S(14), borderWidth: 1, borderColor: C.border },
    pkgEmoji: { marginBottom: H(6) },
    pkgLabel: { fontSize: RF(10), color: C.textLight, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
    pkgValue: { fontSize: RF(14), color: C.text, fontWeight: '800', marginTop: H(2) },

    // ── Payment
    payRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: H(9) },
    payLabel: { fontSize: RF(13), color: C.textMid, fontWeight: '500' },
    payValue: { fontSize: RF(13), color: C.text, fontWeight: '600' },
    payDivider: { height: 1.5, backgroundColor: C.border, marginVertical: H(6) },
    payTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: H(4) },
    payTotalLabel: { fontSize: RF(15), color: C.text, fontWeight: '800' },
    payTotalValue: { fontSize: RF(18), color: C.primary, fontWeight: '900' },
    payMethodPill: { backgroundColor: C.primaryLight, borderRadius: W(10), paddingHorizontal: S(10), paddingVertical: H(4) },
    payMethodText: { color: C.primary, fontSize: RF(11), fontWeight: '700' },

    // ── Actions
    actionsGrid: { flexDirection: 'row', padding: S(16), gap: S(10) },
    actionBtn: { flex: 1, alignItems: 'center', gap: H(8) },
    actionBtnGrad: { width: W(52), height: W(52), borderRadius: W(16), alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
    actionBtnLabel: { fontSize: RF(10), color: C.textMid, fontWeight: '700', textAlign: 'center' },
});