// ShipmentDetailsScreen.tsx — customer
//
// Was falling back to a hardcoded DEMO object for two whole sections
// *even when a real shipment had loaded* — the real Shipment type has no
// `.payment` (courierCharge/delivery/vat/coupon) or `.timeline` field at
// all, so `data?.payment || DEMO.payment` and `data?.timeline ||
// DEMO.timeline` were always the fake fallback for every real shipment,
// not just a no-id preview state. Payment Summary now shows only real
// fields (distance, vehicle, helpers if House Shifting, the real total
// price) instead of an invented VAT/delivery/coupon breakdown the backend
// has no concept of (Shipment only ever stores one `price` total). The
// Tracking Timeline now reads GET /shipments/:id/history (real status
// transitions with real timestamps) instead of a static
// 'placed'/'picked-up'/'in-transit' guess — mapped to this app's real
// 4-state machine (searching/accepted/in_transit/delivered), not the
// mockup's 5 invented steps ("Picked Up" and "Out for Delivery" don't
// exist as distinct backend states here). The header's "Estimated
// Delivery" line is gone too — Shipment.etaMinutes is never set anywhere
// on the backend, so that was always a fabricated date.
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
    Clipboard,
    Linking,
    Share,
    Modal,
    Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useShipment, useShipmentHistory } from '@features/shipments/hooks';
import { useLiveDriverLocation } from '@location/useLiveDriverLocation';
import { haversineDistanceKm } from '@utils/geo';
import { openGoogleMapsDirections } from '@utils/navigation';
import { showToast } from '@ui/alert/toastStore';
import { API_BASE_URL } from '@config/env';
import { getToken } from '@services/storage';
import { useAuthStore } from '@features/store/authStore';
import {
    CheckCircle2,
    Truck,
    Package,
    XCircle,
    Search,
    Bike,
    Check,
    Copy,
    MapPin,
    Home,
    Folder,
    Weight,
    Users,
    Map as MapIcon,
    Phone,
    MessageCircle,
    FileText,
    Star,
    X,
    type LucideIcon,
} from 'lucide-react-native';
import { useAppTheme } from '@theme/ThemeContext';
import FONTS from '@utils/fonts';

const makeC = (BRAND: ReturnType<typeof useAppTheme>['colors']) => ({
    primary: BRAND.PRIMARY,
    primaryDark: BRAND.PRIMARY_DARK,
    primaryLight: BRAND.PRIMARY_LIGHT,
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
});
type DetailColors = ReturnType<typeof makeC>;

const STATUS_CONFIG: Record<string, { label: string; color: keyof DetailColors; icon: LucideIcon }> = {
    delivered: { label: 'Delivered', color: 'success', icon: CheckCircle2 },
    in_transit: { label: 'In Transit', color: 'primary', icon: Truck },
    accepted: { label: 'Driver Assigned', color: 'primary', icon: Truck },
    searching: { label: 'Finding a Pilot', color: 'warning', icon: Search },
    cancelled: { label: 'Cancelled', color: 'danger', icon: XCircle },
};

// The app's real 4-state machine — "Picked Up" and "Out for Delivery"
// (the mockup's 5-step version) aren't real distinct backend states here,
// so they're not shown as if they were.
const TIMELINE_STEPS: { status: string; label: string; icon: LucideIcon }[] = [
    { status: 'SEARCHING', label: 'Order Placed', icon: Package },
    { status: 'ACCEPTED', label: 'Driver Assigned', icon: Truck },
    { status: 'IN_TRANSIT', label: 'In Transit', icon: Bike },
    { status: 'DELIVERED', label: 'Delivered', icon: CheckCircle2 },
];

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

const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

const ShipmentDetailsScreen = () => {
    const { colors: BRAND } = useAppTheme();
    const C = useMemo(() => makeC(BRAND), [BRAND]);
    const styles = useMemo(() => makeStyles(C), [C]);
    const navigation = useNavigation();
    const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
    const shipmentId = route?.params?.id;

    const { data: shipment, isLoading: shipmentLoading, error } = useShipment(shipmentId);
    const { data: historyEntries } = useShipmentHistory(shipmentId);
    const [copied, setCopied] = useState(false);
    const [podViewerOpen, setPodViewerOpen] = useState(false);

    const isDriverEnRoute = shipment?.status === 'accepted' || shipment?.status === 'in_transit';
    // Real pickup/delivery OTPs (kalanabhaBackend d17a770, 63a33d4) — only
    // the customer should ever see either; the driver has to ask for it,
    // not read it off their own screen. Pickup OTP matters while the
    // driver is still coming to collect the package (accepted, before
    // pickup); delivery OTP matters once it's actually in transit — shown
    // one at a time so the customer isn't asked to juggle two codes.
    const role = useAuthStore((s) => s.user?.role);
    const showPickupOtp = role === 'CUSTOMER' && shipment?.status === 'accepted' && !!shipment?.pickupOtp;
    const showDeliveryOtp = role === 'CUSTOMER' && shipment?.status === 'in_transit' && !!shipment?.deliveryOtp;
    const liveDriverLocation = useLiveDriverLocation(isDriverEnRoute ? shipmentId : null);
    const distanceToDriverKm =
        liveDriverLocation && shipment?.pickup?.lat != null
            ? haversineDistanceKm(
                { lat: shipment.pickup.lat, lng: shipment.pickup.lng },
                { lat: liveDriverLocation.lat, lng: liveDriverLocation.lng },
            )
            : null;

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const headerScale = useRef(new Animated.Value(0.95)).current;
    const cardAnims = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(24))).current;
    const cardFades = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(0))).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.15, duration: 700, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
            ]),
        ).start();
    }, [pulseAnim]);

    useEffect(() => {
        if (shipment) {
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
                Animated.spring(headerScale, { toValue: 1, tension: 60, friction: 9, useNativeDriver: true }),
                ...cardAnims.map((a, i) =>
                    Animated.spring(a, { toValue: 0, tension: 60, friction: 9, delay: 60 + i * 60, useNativeDriver: true }),
                ),
                ...cardFades.map((a, i) =>
                    Animated.timing(a, { toValue: 1, duration: 320, delay: 60 + i * 60, useNativeDriver: true }),
                ),
            ]).start();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shipment?.id]);

    const copyToClipboard = (text: string) => {
        Clipboard.setString(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!shipmentId || (shipmentLoading && !shipment)) {
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

    if (error || !shipment) {
        return (
            <View style={styles.center}>
                <XCircle color={C.danger} size={32} />
                <Text style={styles.errorText}>Couldn't load this shipment</Text>
                <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
                    <Text style={styles.backLinkText}>Go back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const statusCfg = STATUS_CONFIG[shipment.status] ?? STATUS_CONFIG.searching;
    const isHouseShifting = shipment.category === 'HOUSE_SHIFTING';

    // Real history rows keyed by status — a step is "done" once its real
    // history row exists, "active" if it's the shipment's current status.
    const historyByStatus = new Map((historyEntries ?? []).map((h) => [h.status, h]));
    const currentStatusUpper = shipment.status.toUpperCase();

    const renderHeader = () => (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: headerScale }] }}>
            <LinearGradient colors={[C.primary, C.primaryDark]} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={styles.blob1} />
                <View style={styles.blob2} />

                <View style={styles.headerTop}>
                    <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
                        <Text style={styles.backArrow}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Shipment Details</Text>
                    <TouchableOpacity
                        style={styles.iconBtn}
                        activeOpacity={0.8}
                        onPress={() => {
                            Share.share({ message: `Track my Kalanabha shipment #${shipment.trackingId}` }).catch(() =>
                                showToast('Unable to share', 'error'),
                            );
                        }}
                    >
                        <Text style={styles.shareArrow}>↗</Text>
                    </TouchableOpacity>
                </View>

                <Pressable style={styles.idPill} onPress={() => copyToClipboard(shipment.trackingId)}>
                    <Text style={styles.idLabel}>TRACKING ID</Text>
                    <View style={styles.idRow}>
                        <Text style={styles.idValue}>{shipment.trackingId}</Text>
                        <View style={[styles.copyBtn, copied && styles.copyBtnDone]}>
                            {copied ? <Check color={C.success} size={12} strokeWidth={3} /> : <Copy color="#fff" size={12} />}
                        </View>
                    </View>
                </Pressable>

                <View style={styles.statusRow}>
                    <View style={styles.statusPill}>
                        <statusCfg.icon color="#fff" size={14} />
                        <Text style={styles.statusLabel}>{statusCfg.label}</Text>
                    </View>
                    <View>
                        <Text style={styles.bookedLabel}>Booked</Text>
                        <Text style={styles.bookedDate}>{formatDateTime(shipment.createdAt)}</Text>
                    </View>
                </View>
            </LinearGradient>
        </Animated.View>
    );

    const renderTimeline = () => (
        <AnimatedCard anim={cardAnims[0]} fade={cardFades[0]} cardStyle={styles.card}>
            <Text style={styles.cardTitle}>Tracking Timeline</Text>
            {shipment.status === 'cancelled' ? (
                <View style={styles.cancelledBox}>
                    <XCircle color={C.danger} size={18} />
                    <Text style={styles.cancelledText}>This shipment was cancelled.</Text>
                </View>
            ) : (
                <View style={styles.timeline}>
                    {TIMELINE_STEPS.map((step, i) => {
                        const entry = historyByStatus.get(step.status);
                        const isDone = !!entry;
                        const isActive = step.status === currentStatusUpper;
                        const isLast = i === TIMELINE_STEPS.length - 1;
                        return (
                            <View key={step.status} style={styles.timelineRow}>
                                <View style={styles.timelineLeft}>
                                    {isActive ? (
                                        <Animated.View style={[styles.tlDotActive, { transform: [{ scale: pulseAnim }] }]}>
                                            <step.icon color="#fff" size={12} />
                                        </Animated.View>
                                    ) : (
                                        <View style={[styles.tlDot, isDone && styles.tlDotDone]}>
                                            <step.icon color={isDone ? C.primary : C.textLight} size={12} />
                                        </View>
                                    )}
                                    {!isLast && <View style={[styles.tlLine, isDone && styles.tlLineDone]} />}
                                </View>
                                <View style={[styles.tlContent, !isLast && styles.tlContentSpaced]}>
                                    <Text style={[styles.tlLabel, isDone && styles.tlLabelDone]}>{step.label}</Text>
                                    {entry && <Text style={styles.tlTime}>{formatDateTime(entry.createdAt)}</Text>}
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
            )}
        </AnimatedCard>
    );

    const renderRoute = () => (
        <AnimatedCard anim={cardAnims[1]} fade={cardFades[1]} cardStyle={styles.card}>
            <Text style={styles.cardTitle}>Route</Text>
            <View style={styles.routeWrap}>
                <View style={styles.routeNode}>
                    <View style={[styles.routeDot, { backgroundColor: C.primary }]}>
                        <MapPin color="#fff" size={12} />
                    </View>
                    <View style={styles.routeInfo}>
                        <Text style={styles.routeRole}>SENDER</Text>
                        <Text style={styles.routeName}>{shipment.sender.name ?? '—'}</Text>
                        <Text style={styles.routeAddr}>{shipment.sender.address}</Text>
                        {!!shipment.sender.phone && <Text style={styles.routePhone}>{shipment.sender.phone}</Text>}
                    </View>
                </View>

                <View style={styles.routeConnector}>
                    <View style={styles.routeConnLine} />
                    <View style={styles.routeArrowBadge}>
                        <Truck color={C.primary} size={12} />
                        <Text style={styles.routeArrowText}>{shipment.distanceKm} km</Text>
                    </View>
                    <View style={styles.routeConnLine} />
                </View>

                <View style={styles.routeNode}>
                    <View style={[styles.routeDot, { backgroundColor: C.success }]}>
                        <Home color="#fff" size={12} />
                    </View>
                    <View style={styles.routeInfo}>
                        <Text style={[styles.routeRole, { color: C.success }]}>RECEIVER</Text>
                        <Text style={styles.routeName}>{shipment.receiver.name ?? '—'}</Text>
                        <Text style={styles.routeAddr}>{shipment.receiver.address}</Text>
                        {!!shipment.receiver.phone && <Text style={styles.routePhone}>{shipment.receiver.phone}</Text>}
                    </View>
                </View>
            </View>
        </AnimatedCard>
    );

    const renderLiveTracking = () => {
        if (!liveDriverLocation) return null;
        return (
            <AnimatedCard anim={cardAnims[1]} fade={cardFades[1]} cardStyle={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Live Tracking</Text>
                    <View style={styles.liveBadge}>
                        <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
                        <Text style={styles.liveBadgeText}>LIVE</Text>
                    </View>
                </View>
                <View style={styles.liveTrackingRow}>
                    <Bike color={C.primary} size={26} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.liveTrackingMain}>
                            {/* Real driver arrival sub-state
                                (kalanabhaBackend 7708464) — was only ever a
                                distance estimate before, no "arrived" signal
                                at all even once the driver had actually
                                reached the location. */}
                            {shipment.arrivalState === 'ARRIVED_AT_PICKUP'
                                ? 'Driver has arrived at pickup'
                                : shipment.arrivalState === 'ARRIVED_AT_DROP'
                                ? 'Driver has arrived at your location'
                                : distanceToDriverKm != null
                                ? `Driver is ${distanceToDriverKm.toFixed(1)} km away`
                                : 'Driver location received'}
                        </Text>
                        <Text style={styles.liveTrackingSub}>Updated {formatTimeAgo(liveDriverLocation.updatedAt)}</Text>
                    </View>
                </View>
            </AnimatedCard>
        );
    };

    // Real pickup/delivery OTP card, shown only to the customer at the
    // relevant stage — share it with the driver in person to start/
    // complete the trip; both codes are generated server-side on
    // assignment (kalanabhaBackend d17a770, 63a33d4) and required back at
    // POST /shipments/:id/start and /complete respectively.
    const renderOtpCard = (title: string, subtitle: string, code: string, animIdx: number) => (
        <AnimatedCard anim={cardAnims[animIdx]} fade={cardFades[animIdx]} cardStyle={styles.card}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={{ color: C.textMid, fontSize: 12, marginBottom: 10 }}>{subtitle}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
                {code.split('').map((digit, idx) => (
                    <View
                        key={idx}
                        style={{
                            width: 44,
                            height: 52,
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: C.border,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Text style={{ fontSize: 22, fontWeight: '700', color: C.text }}>{digit}</Text>
                    </View>
                ))}
            </View>
        </AnimatedCard>
    );

    const renderPickupOtp = () => {
        if (!showPickupOtp) return null;
        return renderOtpCard(
            'Pickup OTP',
            "Share this code with your driver only once they've collected your package",
            shipment.pickupOtp!,
            1,
        );
    };

    const renderDeliveryOtp = () => {
        if (!showDeliveryOtp) return null;
        return renderOtpCard(
            'Delivery OTP',
            "Share this code with your driver only once you've received your delivery",
            shipment.deliveryOtp!,
            1,
        );
    };

    const renderPackage = () => {
        const items = [
            { icon: Folder, label: 'Category', value: shipment.package.category ?? shipment.goodsType },
            isHouseShifting
                ? { icon: Users, label: 'Helpers', value: `${shipment.helpersCount}` }
                : { icon: Weight, label: 'Weight', value: `${shipment.weightKg} kg` },
        ];
        return (
            <AnimatedCard anim={cardAnims[2]} fade={cardFades[2]} cardStyle={styles.card}>
                <Text style={styles.cardTitle}>{isHouseShifting ? 'Move Details' : 'Package Details'}</Text>
                <View style={styles.packageGrid}>
                    {items.map((item) => (
                        <View key={item.label} style={styles.packageItem}>
                            <item.icon color={C.primary} size={18} />
                            <Text style={styles.pkgLabel}>{item.label}</Text>
                            <Text style={styles.pkgValue}>{item.value}</Text>
                        </View>
                    ))}
                    {shipment.fragile && (
                        <View style={styles.packageItem}>
                            <Package color={C.warning} size={18} />
                            <Text style={styles.pkgLabel}>Handling</Text>
                            <Text style={[styles.pkgValue, { color: C.warning }]}>Fragile</Text>
                        </View>
                    )}
                </View>
            </AnimatedCard>
        );
    };

    // Real fields only — Shipment stores one `price` total, no persisted
    // itemized breakdown (courier charge/delivery/VAT/coupon aren't real
    // concepts on this backend).
    const renderPayment = () => (
        <AnimatedCard anim={cardAnims[3]} fade={cardFades[3]} cardStyle={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Payment Summary</Text>
                <View style={styles.payMethodPill}>
                    <Text style={styles.payMethodText}>
                        {shipment.paymentMode === 'cod' ? 'Cash on Delivery' : shipment.paymentMode === 'prepaid' ? 'UPI' : 'Credit'}
                    </Text>
                </View>
            </View>
            <View style={styles.payRow}>
                <Text style={styles.payLabel}>Distance</Text>
                <Text style={styles.payValue}>{shipment.distanceKm} km</Text>
            </View>
            <View style={styles.payRow}>
                <Text style={styles.payLabel}>Vehicle</Text>
                <Text style={styles.payValue}>{shipment.vehicleType}</Text>
            </View>
            {isHouseShifting && (
                <View style={styles.payRow}>
                    <Text style={styles.payLabel}>Helpers</Text>
                    <Text style={styles.payValue}>{shipment.helpersCount}</Text>
                </View>
            )}
            <View style={styles.payDivider} />
            <View style={styles.payTotalRow}>
                <Text style={styles.payTotalLabel}>Total</Text>
                <Text style={styles.payTotalValue}>₹{shipment.price}</Text>
            </View>
        </AnimatedCard>
    );

    const handleLiveMap = () => {
        openGoogleMapsDirections(shipment.pickup, shipment.drop).catch(() => showToast('Unable to open maps', 'error'));
    };

    const handleCallDriver = () => {
        const phone = shipment.dispatch?.driverPhone;
        if (!phone) {
            showToast('No driver assigned yet', 'info');
            return;
        }
        Linking.openURL(`tel:${phone}`).catch(() => showToast('Unable to open the dialer', 'error'));
    };

    const handleChatSupport = () => {
        (navigation as any).navigate('ShipmentChat', { shipmentId });
    };

    // Real now (kalanabhaBackend 03b5839, GET /shipments/:id/pod) — still
    // honest when there genuinely isn't one: podUploadedAt is only set
    // once a driver actually uploads a photo on completing delivery.
    const handleDownloadPod = () => {
        if (!shipment.podUploadedAt) {
            showToast('No proof of delivery has been uploaded for this shipment yet', 'info');
            return;
        }
        setPodViewerOpen(true);
    };

    const renderActions = () => (
        <AnimatedCard anim={cardAnims[4]} fade={cardFades[4]} noPad cardStyle={styles.card}>
            <View style={styles.actionsGrid}>
                {[
                    shipment.status === 'delivered'
                        ? { icon: Star, label: 'Rate Delivery', color: [C.primary, C.primaryDark] as const, onPress: () => (navigation as any).navigate('Rating', { shipmentId }) }
                        : { icon: MapIcon, label: 'Live Map', color: [C.primary, '#6366F1'] as const, onPress: handleLiveMap },
                    { icon: Phone, label: 'Call Driver', color: ['#10B981', '#059669'] as const, onPress: handleCallDriver },
                    { icon: MessageCircle, label: 'Chat Support', color: ['#F59E0B', '#D97706'] as const, onPress: handleChatSupport },
                    { icon: FileText, label: 'View POD', color: ['#EF4444', '#DC2626'] as const, onPress: handleDownloadPod },
                ].map((btn) => (
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
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {renderHeader()}
                <View style={styles.body}>
                    {renderTimeline()}
                    {renderRoute()}
                    {renderLiveTracking()}
                    {renderPickupOtp()}
                    {renderDeliveryOtp()}
                    {renderPackage()}
                    {renderPayment()}
                    {renderActions()}
                </View>
            </ScrollView>

            {/* Real photo, fetched through the same JWT auth every other
                API call uses (GET /shipments/:id/pod is not a plain
                static-file URL) — RN's Image source accepts a headers
                object for exactly this. */}
            <Modal visible={podViewerOpen} transparent animationType="fade" onRequestClose={() => setPodViewerOpen(false)}>
                <View style={styles.podOverlay}>
                    <Pressable style={styles.podCloseBtn} onPress={() => setPodViewerOpen(false)} hitSlop={12}>
                        <X color="#fff" size={22} />
                    </Pressable>
                    {shipmentId && (
                        <Image
                            source={{
                                uri: `${API_BASE_URL}/shipments/${shipmentId}/pod`,
                                headers: { Authorization: `Bearer ${getToken() ?? ''}` },
                            }}
                            style={styles.podImage}
                            resizeMode="contain"
                        />
                    )}
                </View>
            </Modal>
        </View>
    );
};

const AnimatedCard = ({ children, anim, fade, noPad, cardStyle }: {
    children: React.ReactNode;
    anim: Animated.Value;
    fade: Animated.Value;
    noPad?: boolean;
    cardStyle: ReturnType<typeof makeStyles>['card'];
}) => (
    <Animated.View style={[cardStyle, noPad && styles_noPad, { opacity: fade, transform: [{ translateY: anim }] }]}>
        {children}
    </Animated.View>
);
const styles_noPad = { padding: 0, overflow: 'hidden' as const };

export default ShipmentDetailsScreen;

const makeStyles = (C: DetailColors) => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    scrollContent: { paddingBottom: 40 },
    loadingWrap: { flex: 1 },
    loadingGrad: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
    loadingText: { color: '#fff', fontSize: 15, fontFamily: FONTS.SEMI_BOLD_PRIMARY },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: C.bg, padding: 24 },
    errorText: { fontSize: 15, fontFamily: FONTS.SEMI_BOLD_PRIMARY, color: C.text },
    backLink: { marginTop: 6, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: C.primary, borderRadius: 10 },
    backLinkText: { color: '#fff', fontFamily: FONTS.BOLD_PRIMARY },

    header: {
        paddingTop: Platform.OS === 'ios' ? 58 : 38,
        paddingHorizontal: 20,
        paddingBottom: 26,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        overflow: 'hidden',
    },
    blob1: { position: 'absolute', top: -50, right: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.05)' },
    blob2: { position: 'absolute', bottom: -30, left: -30, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.04)' },

    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    iconBtn: { width: 38, height: 38, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    backArrow: { color: '#fff', fontSize: 18, fontFamily: FONTS.BOLD_PRIMARY },
    shareArrow: { color: '#fff', fontSize: 18 },
    headerTitle: { color: '#fff', fontSize: 17, fontFamily: FONTS.BOLD_PRIMARY, letterSpacing: 0.3 },

    idPill: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    idLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 10, fontFamily: FONTS.BOLD_PRIMARY, letterSpacing: 1, marginBottom: 4 },
    idRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    idValue: { color: '#fff', fontSize: 15, fontFamily: FONTS.BOLD_PRIMARY, letterSpacing: 0.3 },
    copyBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
    copyBtnDone: { backgroundColor: '#fff' },

    statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    statusPill: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: 'rgba(255,255,255,0.18)' },
    statusLabel: { color: '#fff', fontSize: 13, fontFamily: FONTS.BOLD_PRIMARY },
    bookedLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontFamily: FONTS.SEMI_BOLD_PRIMARY, textAlign: 'right' },
    bookedDate: { color: '#fff', fontSize: 12, fontFamily: FONTS.BOLD_PRIMARY, textAlign: 'right', marginTop: 2 },

    body: { padding: 16, gap: 14 },
    card: {
        backgroundColor: C.card, borderRadius: 20, padding: 18,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 3,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    cardTitle: { fontSize: 15, fontFamily: FONTS.BOLD_PRIMARY, color: C.text, marginBottom: 14, letterSpacing: 0.2 },

    cancelledBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.dangerLight, borderRadius: 14, padding: 14 },
    cancelledText: { flex: 1, fontSize: 13, color: C.danger, fontFamily: FONTS.SEMI_BOLD_PRIMARY },

    liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.successLight, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10 },
    liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.success },
    liveBadgeText: { fontSize: 10, fontFamily: FONTS.BOLD_PRIMARY, color: C.success, letterSpacing: 0.5 },
    liveTrackingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    liveTrackingMain: { fontSize: 14, fontFamily: FONTS.BOLD_PRIMARY, color: C.text },
    liveTrackingSub: { fontSize: 12, color: C.textMid, marginTop: 2 },

    timeline: { paddingLeft: 4 },
    timelineRow: { flexDirection: 'row' },
    timelineLeft: { alignItems: 'center', width: 36, marginRight: 12 },
    tlDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: C.border },
    tlDotDone: { backgroundColor: C.primaryLight, borderColor: C.primary },
    tlDotActive: {
        width: 36, height: 36, borderRadius: 18, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
        shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
    },
    tlLine: { width: 2, flex: 1, backgroundColor: C.border, marginVertical: 3, minHeight: 22 },
    tlLineDone: { backgroundColor: C.primary },
    tlContent: { flex: 1, paddingTop: 6 },
    tlContentSpaced: { marginBottom: 18 },
    tlLabel: { fontSize: 13, color: C.textLight, fontFamily: FONTS.SEMI_BOLD_PRIMARY },
    tlLabelDone: { color: C.text, fontFamily: FONTS.BOLD_PRIMARY },
    tlTime: { fontSize: 11, color: C.textMid, marginTop: 2 },
    tlActivePill: { marginTop: 5, alignSelf: 'flex-start', backgroundColor: C.primaryLight, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    tlActivePillText: { color: C.primary, fontSize: 10, fontFamily: FONTS.BOLD_PRIMARY },

    routeWrap: { gap: 4 },
    routeNode: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    routeDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
    routeInfo: { flex: 1 },
    routeRole: { fontSize: 10, fontFamily: FONTS.BOLD_PRIMARY, color: C.primary, letterSpacing: 1, marginBottom: 2 },
    routeName: { fontSize: 14, fontFamily: FONTS.BOLD_PRIMARY, color: C.text },
    routeAddr: { fontSize: 12, color: C.textMid, marginTop: 2, lineHeight: 17 },
    routePhone: { fontSize: 12, color: C.primary, marginTop: 3, fontFamily: FONTS.SEMI_BOLD_PRIMARY },
    routeConnector: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingLeft: 16 },
    routeConnLine: { flex: 1, height: 1.5, backgroundColor: C.border },
    routeArrowBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: C.primaryLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, marginHorizontal: 10,
    },
    routeArrowText: { color: C.primary, fontSize: 11, fontFamily: FONTS.BOLD_PRIMARY },

    packageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    packageItem: { width: '47%', backgroundColor: C.bg, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, gap: 4 },
    pkgLabel: { fontSize: 10, color: C.textLight, fontFamily: FONTS.BOLD_PRIMARY, letterSpacing: 0.5, textTransform: 'uppercase' },
    pkgValue: { fontSize: 14, color: C.text, fontFamily: FONTS.BOLD_PRIMARY, textTransform: 'capitalize' },

    payRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9 },
    payLabel: { fontSize: 13, color: C.textMid, fontFamily: FONTS.MEDIUM_PRIMARY },
    payValue: { fontSize: 13, color: C.text, fontFamily: FONTS.SEMI_BOLD_PRIMARY, textTransform: 'capitalize' },
    payDivider: { height: 1.5, backgroundColor: C.border, marginVertical: 6 },
    payTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 },
    payTotalLabel: { fontSize: 15, color: C.text, fontFamily: FONTS.BOLD_PRIMARY },
    payTotalValue: { fontSize: 18, color: C.primary, fontFamily: FONTS.BOLD_PRIMARY },
    payMethodPill: { backgroundColor: C.primaryLight, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
    payMethodText: { color: C.primary, fontSize: 11, fontFamily: FONTS.BOLD_PRIMARY },

    actionsGrid: { flexDirection: 'row', padding: 16, gap: 10 },
    actionBtn: { flex: 1, alignItems: 'center', gap: 8 },
    actionBtnGrad: {
        width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
    },
    actionBtnLabel: { fontSize: 10, color: C.textMid, fontFamily: FONTS.BOLD_PRIMARY, textAlign: 'center' },

    podOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' },
    podImage: { width: '100%', height: '80%' },
    podCloseBtn: {
        position: 'absolute', top: Platform.OS === 'ios' ? 56 : 24, right: 20, zIndex: 1,
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
    },
});
