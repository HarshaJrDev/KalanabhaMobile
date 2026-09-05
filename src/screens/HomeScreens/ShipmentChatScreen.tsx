import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Pressable,
    FlatList,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Linking,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    ArrowLeft,
    Send,
    Phone,
    Info,
    Navigation,
    CheckCircle2,
    Camera,
    MapPin,
} from 'lucide-react-native';
import { useChatMessages, useChatSocket, useSendMessage } from '@features/chat/hooks';
import { useShipment } from '@features/shipments/hooks';
import { useLiveDriverLocation } from '@location/useLiveDriverLocation';
import { haversineDistanceKm } from '@utils/geo';
import { useAuthStore } from '@features/store/authStore';
import { AsyncState } from '@components/AsyncState';
import { useAppTheme } from '@theme/ThemeContext';
import { showToast } from '@ui/alert/toastStore';
import type { RootStackParamList } from '../navigation/types';

// Was rendering "8148m ago" for anything older than an hour — never
// rolled minutes over into hours/days, so a stale/test location ping
// produced an absurd-looking number instead of a sane relative time.
const formatTimeAgo = (date: Date | null): string => {
    if (!date) return 'just now';
    const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
    if (seconds < 10) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    return `${days}d ago`;
};

const formatClock = (iso: string) =>
    new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

const dayLabel = (date: Date) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (isSameDay(date, today)) return 'Today';
    if (isSameDay(date, yesterday)) return 'Yesterday';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

// Canned quick-replies — just prefill/send real text through the same
// sendMessage mutation every other bubble uses, not a separate mechanism.
const QUICK_REPLIES = ['Where are you now?', 'Call when outside', 'Leave at the door'];

// Screen -> useChatMessages/useSendMessage/useChatSocket -> chat.api ->
// GET/POST /shipments/:id/messages (+ live via ChatGateway) -> UI.
// "Chat Support" on ShipmentDetailsScreen opens this — the same shipment
// chat backend LogisticsCardList's inline driver panel already uses.
//
// The header's live-tracking strip, distance, and "dispatched" banner are
// all derived from real data already fetched elsewhere in this app
// (useShipment's dispatch/drop fields, useLiveDriverLocation) — no speed/
// ETA is shown since neither exists anywhere in the backend (DriverLocation
// only ever carries lat/lng/updatedAt) and no read-receipts/image messages
// since ChatMessage has no read-status or attachment field to back them.
const ShipmentChatScreen = () => {
    const navigation = useNavigation();
    const { colors, isDark } = useAppTheme();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => makeStyles(colors, insets), [colors, insets]);
    const route = useRoute<RouteProp<RootStackParamList, 'ShipmentChat'>>();
    const shipmentId = route.params?.shipmentId;
    const currentUserId = useAuthStore((s) => s.user?.id);

    const { data: messages, isLoading, error, refetch } = useChatMessages(shipmentId);
    useChatSocket(shipmentId);
    const { mutate: sendMessage, isPending: sending } = useSendMessage(shipmentId ?? '');
    const { data: shipment } = useShipment(shipmentId);

    const isDriverEnRoute = shipment?.status === 'accepted' || shipment?.status === 'in_transit';
    const liveDriverLocation = useLiveDriverLocation(isDriverEnRoute ? shipmentId : null);
    const distanceToDropKm =
        liveDriverLocation && shipment?.drop
            ? haversineDistanceKm({ lat: shipment.drop.lat, lng: shipment.drop.lng }, liveDriverLocation)
            : null;

    const [text, setText] = useState('');

    const handleSend = (value?: string) => {
        const trimmed = (value ?? text).trim();
        if (!trimmed || !shipmentId) return;
        sendMessage(trimmed);
        setText('');
    };

    const driverName = shipment?.dispatch?.driverName;
    const driverInitials = (driverName ?? '')
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.select({ ios: 'padding' })}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
                        <ArrowLeft color={colors.TEXT_PRIMARY} size={22} />
                    </TouchableOpacity>
                    <View style={styles.headerAvatarWrap}>
                        <View style={styles.headerAvatar}>
                            <Text style={styles.headerAvatarText}>{driverInitials || '?'}</Text>
                        </View>
                        {isDriverEnRoute && <View style={styles.onlineDot} />}
                    </View>
                    <View>
                        <View style={styles.headerNameRow}>
                            <Text style={styles.headerName} numberOfLines={1}>{driverName ?? 'Pilot'}</Text>
                            <View style={styles.pilotBadge}>
                                <Text style={styles.pilotBadgeText}>PILOT</Text>
                            </View>
                        </View>
                        <Text style={styles.headerStatus} numberOfLines={1}>
                            {isDriverEnRoute ? 'On route' : shipment?.status === 'searching' ? 'Finding a pilot…' : 'Delivered'}
                        </Text>
                    </View>
                </View>
                <View style={styles.headerRight}>
                    <Pressable
                        style={styles.headerIconBtn}
                        onPress={() => {
                            const phone = shipment?.dispatch?.driverPhone;
                            if (!phone) {
                                showToast('No driver phone number on file', 'info');
                                return;
                            }
                            Linking.openURL(`tel:${phone}`).catch(() => showToast('Unable to open the dialer', 'error'));
                        }}
                    >
                        <Phone color={colors.TEXT_SECONDARY} size={16} />
                    </Pressable>
                    {shipment?.trackingId && (
                        <View style={styles.trackingPill}>
                            <Text style={styles.trackingPillText} numberOfLines={1} ellipsizeMode="tail">
                                #{shipment.trackingId}
                            </Text>
                        </View>
                    )}
                    <Pressable
                        style={styles.headerIconBtn}
                        onPress={() => shipmentId && (navigation as any).navigate('ShipmentDetailsScreen', { id: shipmentId })}
                    >
                        <Info color={colors.TEXT_SECONDARY} size={16} />
                    </Pressable>
                </View>
            </View>

            {/* Destination / live-tracking strip */}
            {isDriverEnRoute && shipment && (
                <>
                    <Pressable
                        style={styles.destCard}
                        onPress={() => (navigation as any).navigate('ShipmentDetailsScreen', { id: shipmentId })}
                    >
                        <MapPin size={16} color={colors.PRIMARY} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.destTitle} numberOfLines={1}>{shipment.drop.address}</Text>
                            <Text style={styles.destSub} numberOfLines={1}>
                                {distanceToDropKm != null ? `${distanceToDropKm.toFixed(1)} km away · ` : ''}
                                {shipment.vehicleType}
                            </Text>
                        </View>
                        <View style={styles.trackLink}>
                            <Navigation size={12} color={colors.PRIMARY} />
                            <Text style={styles.trackLinkText}>Track</Text>
                        </View>
                    </Pressable>
                    {liveDriverLocation && (
                        <View style={styles.liveRow}>
                            <View style={styles.liveDot} />
                            <Text style={styles.liveText}>Live tracking synced {formatTimeAgo(liveDriverLocation.updatedAt)}</Text>
                        </View>
                    )}
                </>
            )}

            <AsyncState
                isLoading={isLoading}
                error={error}
                onRetry={refetch}
                isEmpty={!messages?.length}
                emptyTitle="No messages yet"
                emptyMessage="Send a message to the driver or admin about this shipment."
            >
                <FlatList
                    data={messages ?? []}
                    keyExtractor={(m) => m.id}
                    contentContainerStyle={styles.list}
                    ListHeaderComponent={
                        shipment?.dispatch?.acceptedAt ? (
                            <View style={styles.systemCard}>
                                <View style={styles.systemTitleRow}>
                                    <CheckCircle2 size={13} color={colors.PRIMARY} />
                                    <Text style={styles.systemTitle}>ORDER DISPATCHED</Text>
                                </View>
                                <Text style={styles.systemText}>
                                    Order #{shipment.trackingId} confirmed. Pilot {shipment.dispatch.driverName} has accepted and is heading to the pickup hub.
                                </Text>
                                <Text style={styles.systemTime}>{formatClock(shipment.dispatch.acceptedAt)}</Text>
                            </View>
                        ) : null
                    }
                    renderItem={({ item, index }) => {
                        const mine = item.senderId === currentUserId;
                        const created = new Date(item.createdAt);
                        const prev = index > 0 ? messages?.[index - 1] : null;
                        const showDayDivider = !prev || !isSameDay(created, new Date(prev.createdAt));
                        return (
                            <>
                                {showDayDivider && (
                                    <View style={styles.dayDivider}>
                                        <Text style={styles.dayDividerText}>{dayLabel(created)}</Text>
                                    </View>
                                )}
                                <View style={[styles.bubbleRow, mine && styles.bubbleRowMine]}>
                                    <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
                                        {!mine && <Text style={styles.senderName}>{item.senderName}</Text>}
                                        <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{item.text}</Text>
                                    </View>
                                </View>
                                <Text style={[styles.bubbleTime, mine && styles.bubbleTimeMine]}>{formatClock(item.createdAt)}</Text>
                            </>
                        );
                    }}
                />
            </AsyncState>

            {/* Quick replies — was stretching to fill all the leftover
                vertical space above the input bar (each chip rendered as a
                tall column instead of a small pill) since neither the
                FlatList nor its row container capped a height; both now
                do. */}
            <FlatList
                horizontal
                style={styles.quickRepliesList}
                data={QUICK_REPLIES}
                keyExtractor={(q) => q}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickRepliesRow}
                renderItem={({ item }) => (
                    <Pressable style={styles.quickReplyChip} onPress={() => handleSend(item)} disabled={sending}>
                        <Text style={styles.quickReplyText}>{item}</Text>
                    </Pressable>
                )}
            />

            <View style={styles.inputRow}>
                <Pressable
                    style={styles.attachBtn}
                    onPress={() => showToast('Photo sharing is not available yet', 'info')}
                >
                    <Camera color={colors.TEXT_SECONDARY} size={18} />
                </Pressable>
                <TextInput
                    style={styles.input}
                    value={text}
                    onChangeText={setText}
                    placeholder="Type a message to pilot…"
                    placeholderTextColor={colors.PLACEHOLDER}
                    onSubmitEditing={() => handleSend()}
                    returnKeyType="send"
                />
                <TouchableOpacity
                    style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
                    onPress={() => handleSend()}
                    disabled={!text.trim() || sending}
                >
                    <Send color="#fff" size={18} />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

export default ShipmentChatScreen;

// Computed from useAppTheme() so this screen repaints correctly in dark
// mode instead of staying pinned to the light palette baked at import.
// Real device safe-area insets, not a bare paddingVertical/padding guess —
// without them the header sat under the status bar/camera cutout and the
// input row sat flush against the device's home indicator/gesture bar,
// same class of overlap bug already fixed elsewhere (onboarding,
// SelectAccount, the tab bars) but missed on this screen.
const makeStyles = (colors: ReturnType<typeof useAppTheme>['colors'], insets: { top: number; bottom: number }) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.BACKGROUND },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingTop: insets.top + 10,
        paddingBottom: 12,
        backgroundColor: colors.SURFACE,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.BORDER,
        gap: 8,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    headerAvatarWrap: { position: 'relative' },
    headerAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.PRIMARY_LIGHT,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerAvatarText: { fontSize: 13, fontWeight: '700', color: colors.PRIMARY },
    onlineDot: {
        position: 'absolute',
        bottom: -1,
        right: -1,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.WARNING,
        borderWidth: 2,
        borderColor: colors.SURFACE,
    },
    headerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    headerName: { fontSize: 14, fontWeight: '700', color: colors.TEXT_PRIMARY, maxWidth: 90 },
    pilotBadge: { backgroundColor: colors.PRIMARY_LIGHT, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 },
    pilotBadgeText: { fontSize: 9, fontWeight: '700', color: colors.PRIMARY },
    headerStatus: { fontSize: 11, color: colors.WARNING, marginTop: 1, fontWeight: '600' },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
    headerIconBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.BACKGROUND,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Was overflowing/overlapping itself for a long tracking id — no width
    // cap and no line-clamp, so the text just kept laying out past the
    // pill's edge instead of shrinking to fit.
    trackingPill: {
        backgroundColor: colors.BACKGROUND,
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 5,
        maxWidth: 96,
    },
    trackingPillText: { fontSize: 10, fontWeight: '700', color: colors.TEXT_SECONDARY },

    destCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: colors.SURFACE,
        padding: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.BORDER,
    },
    destTitle: { fontSize: 13, fontWeight: '700', color: colors.TEXT_PRIMARY },
    destSub: { fontSize: 11, color: colors.TEXT_SECONDARY, marginTop: 1 },
    trackLink: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    trackLinkText: { fontSize: 12, fontWeight: '700', color: colors.PRIMARY },

    liveRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 6,
        backgroundColor: colors.BACKGROUND,
    },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.PRIMARY },
    liveText: { fontSize: 11, color: colors.TEXT_SECONDARY },

    list: { padding: 16, gap: 4 },

    systemCard: {
        backgroundColor: colors.PRIMARY_LIGHT,
        borderRadius: 14,
        padding: 12,
        marginBottom: 14,
    },
    systemTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    systemTitle: { fontSize: 11, fontWeight: '800', color: colors.PRIMARY, letterSpacing: 0.3 },
    systemText: { fontSize: 12, color: colors.TEXT_SECONDARY, lineHeight: 17 },
    systemTime: { fontSize: 10, color: colors.GRAY, marginTop: 6 },

    dayDivider: { alignItems: 'center', marginVertical: 10 },
    dayDividerText: {
        fontSize: 11,
        color: colors.TEXT_SECONDARY,
        backgroundColor: colors.SURFACE,
        borderWidth: 1,
        borderColor: colors.BORDER,
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 3,
    },

    bubbleRow: { flexDirection: 'row' },
    bubbleRowMine: { justifyContent: 'flex-end' },
    bubble: { maxWidth: '78%', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
    bubbleOther: { backgroundColor: colors.SURFACE, borderWidth: 1, borderColor: colors.BORDER },
    bubbleMine: { backgroundColor: colors.PRIMARY },
    senderName: { fontSize: 11, fontWeight: '700', color: colors.TEXT_SECONDARY, marginBottom: 2 },
    bubbleText: { fontSize: 14, color: colors.TEXT_PRIMARY },
    bubbleTextMine: { color: '#fff' },
    bubbleTime: { fontSize: 10, color: colors.GRAY, marginTop: 2, marginBottom: 8, marginLeft: 4 },
    bubbleTimeMine: { alignSelf: 'flex-end', marginRight: 4 },

    quickRepliesList: { flexGrow: 0, flexShrink: 0, maxHeight: 48 },
    quickRepliesRow: { paddingHorizontal: 12, paddingBottom: 8, gap: 8, alignItems: 'flex-start' },
    quickReplyChip: {
        alignSelf: 'flex-start',
        backgroundColor: colors.SURFACE,
        borderWidth: 1,
        borderColor: colors.BORDER,
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 7,
    },
    quickReplyText: { fontSize: 12, color: colors.TEXT_SECONDARY },

    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: Math.max(insets.bottom, 12),
        backgroundColor: colors.SURFACE,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.BORDER,
    },
    attachBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: colors.BORDER,
        borderRadius: 20,
        paddingHorizontal: 16,
        height: 40,
        fontSize: 14,
        color: colors.TEXT_PRIMARY,
    },
    sendBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.PRIMARY,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendBtnDisabled: { opacity: 0.5 },
});
