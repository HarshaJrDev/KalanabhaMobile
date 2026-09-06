import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Dimensions,
    TouchableOpacity,
    Linking,
    Share,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Animated, {
    FadeInUp,
    ZoomIn,
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';
import { openGoogleMapsDirections } from '@utils/navigation';
import {
    Check,
    Circle,
    Clock,
    MapPin,
    MessageCircle,
    Navigation,
    Phone,
    Route,
    Share2,
    X,
    User,
    Truck,
    Zap,
} from 'lucide-react-native';
import { ScrollView, TextInput } from 'react-native-gesture-handler';
import { useAuthStore } from '@features/store/authStore';
import {
    acceptShipment as acceptShipmentRequest,
    cancelShipment as cancelShipmentRequest,
    startDelivery as startDeliveryRequest,
    uploadPickupProof,
    arriveAtShipment,
} from '@features/shipments/api/shipments.api';
import { launchCamera } from 'react-native-image-picker';
import Geolocation from 'react-native-geolocation-service';
import { useChatMessages, useChatSocket, useSendMessage } from '@features/chat/hooks';
import { normalizeError } from '@utils/error';
import { useTabBarContentPadding } from '../screens/navigation/useTabBarStyle';
import { showToast } from '@ui/alert/toastStore';
import { requestCompleteDelivery } from '@ui/alert/deliveryCompletionStore';
import { requestOtp } from '@ui/alert/deliveryOtpStore';
import FONTS from '@utils/fonts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type LogisticsStatus = 'searching' | 'accepted' | 'in_transit' | 'delivered' | 'cancelled';
type UserRole = 'customer' | 'driver';

interface Location {
    address: string;
    lat: number;
    lng: number;
}

export interface LogisticsItem {
    id: string;
    goodsType: string;
    weightKg?: number;
    pickup: Location;
    drop: Location;
    price: number;
    distanceKm: number;
    status: LogisticsStatus;
    createdAt: string;
    driverName?: string;
    driverRating?: number;
    driverId: string;
    driverPhone?: string;
    etaMinutes?: number;
    expiresAt?: string;
    customerName?: string;
    customerPhone?: string;
    // 'PARCEL' (default) | 'HOUSE_SHIFTING' — Porter-style movers booking.
    category?: string;
    helpersCount?: number;
    // Real driver arrival sub-state (kalanabhaBackend 7708464) — drives
    // the arrival-aware CTA below.
    arrivalState?: 'NONE' | 'EN_ROUTE_TO_PICKUP' | 'ARRIVED_AT_PICKUP' | 'EN_ROUTE_TO_DROP' | 'ARRIVED_AT_DROP';
}

// Role now comes from the backend-authenticated user (features/store/authStore),
// not "is Firebase signed in" — every user is signed in via the backend now.
const useUserRole = (): UserRole => {
    const role = useAuthStore((s) => s.user?.role);
    return role === 'DRIVER' ? 'driver' : 'customer';
};



const ActionButton: React.FC<{
    icon: React.ReactNode;
    label: string;
    onPress: () => void;
    primary?: boolean;
}> = memo(({ icon, label, onPress, primary }) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Animated.View style={animatedStyle}>
            <Pressable
                style={[styles.actionBtn, primary && styles.actionPrimary]}
                onPress={onPress}
                onPressIn={() => (scale.value = withSpring(0.92))}
                onPressOut={() => (scale.value = withSpring(1))}
            >
                {icon}
                <Text style={[styles.actionText, primary && styles.actionTextPrimary]}>
                    {label}
                </Text>
            </Pressable>
        </Animated.View>
    );
});

// POST /shipments/:id/cancel — kalanabhaBackend allows either the owning
// customer or an admin/dispatcher; the guard is enforced server-side.
// Feedback goes through the global toast (ui/alert/toastStore), same
// surface every other feature uses, instead of a one-off native Alert.
const useCustomerActions = () => {
    const onCancel = useCallback(async (id: string) => {
        try {
            await cancelShipmentRequest(id);
            showToast('Order cancelled successfully', 'success');
        } catch (err) {
            showToast(normalizeError(err), 'error');
        }
    }, []);

    return { onCancel };
};

// POST /shipments/:id/{accept,start,complete} — kalanabhaBackend's
// DispatchService does the same atomic "status must still be X" guard
// server-side that the old Firestore transaction did client-side, so a
// driver can no longer race or spoof an accept.
// Exported so the driver Home screen's Active Delivery card (the one
// place a driver actually manages their current shipment, as opposed to
// this file's searching-pool list) can drive the same real
// arrive/start/complete actions instead of duplicating them.
export const useDriverActions = () => {
    const onAccept = useCallback(async (id: string) => {
        try {
            await acceptShipmentRequest(id);
            showToast('Order accepted! Start delivery.', 'success');
        } catch (err) {
            showToast(normalizeError(err) || 'Order already taken', 'error');
        }
    }, []);

    // Real, geofence-validated arrival (kalanabhaBackend 7708464) — the
    // backend decides whether this is pickup or drop arrival from the
    // shipment's own current arrivalState, and rejects with the real
    // distance if the driver isn't actually there yet. `coords` is only
    // ever passed by the DEV-only "Simulate Arrival" button (real
    // pickup/drop coordinates from the shipment itself, run through this
    // exact same endpoint — not a bypass of the geofence check, just a
    // convenient way to be "at" the location without physically
    // travelling there on an emulator); every other caller uses the
    // device's real GPS fix.
    const onArrive = useCallback((id: string, coords?: { latitude: number; longitude: number }) => {
        const submit = (latitude: number, longitude: number) => {
            arriveAtShipment(id, latitude, longitude)
                .then(() => showToast('Arrival recorded', 'success'))
                .catch((err) => showToast(normalizeError(err) || 'Could not record arrival', 'error'));
        };

        if (coords) {
            submit(coords.latitude, coords.longitude);
            return;
        }

        Geolocation.getCurrentPosition(
            (position) => submit(position.coords.latitude, position.coords.longitude),
            () => showToast('Could not get your location — check location permissions', 'error'),
            { enableHighAccuracy: true, timeout: 15000 },
        );
    }, []);

    // Real pickup OTP + pickup photo (kalanabhaBackend 63a33d4,
    // Shipment.pickupOtp / POST /shipments/:id/pickup-proof) — symmetric
    // to the delivery-side verification below. A driver needs the code
    // the customer reads out at hand-off AND a photo to actually start
    // the trip, instead of the previous single tap trusting the driver's
    // own say-so entirely.
    const onStartDelivery = useCallback((id: string) => {
        (async () => {
            const otp = await requestOtp('pickup');
            if (!otp) return;

            launchCamera({ mediaType: 'photo', quality: 0.8, saveToPhotos: false }, async (response) => {
                if (response.didCancel) return;
                const asset = response.assets?.[0];
                if (response.errorCode || !asset?.uri) {
                    // Surface the real reason — see GlobalDeliveryCompletionSheet's
                    // identical fix for why (camera_unavailable/permission/others
                    // was previously hidden behind a generic message).
                    if (__DEV__) console.warn('[onStartDelivery] camera error', response.errorCode, response.errorMessage);
                    showToast(
                        response.errorCode ? `Could not capture a photo — ${response.errorMessage ?? response.errorCode}` : 'Could not capture a photo — try again',
                        'error',
                    );
                    return;
                }

                try {
                    await uploadPickupProof(id, asset.uri, asset.fileName ?? 'pickup-proof.jpg', asset.type ?? 'image/jpeg');
                } catch (err) {
                    showToast(normalizeError(err) || 'Pickup-proof upload failed — try again', 'error');
                    return;
                }

                try {
                    await startDeliveryRequest(id, otp);
                    showToast('Delivery in progress', 'success');
                } catch (err) {
                    showToast(normalizeError(err) || 'Incorrect OTP or failed to start delivery', 'error');
                }
            });
        })();
    }, []);

    // Complete Delivery is visible immediately after Accept — no GPS/
    // arrival prerequisite (product decision, kalanabhaBackend 81263b1).
    // Opens the real Delivery Completion Sheet (OTP + photos + optional
    // signature, each step independently verified server-side) instead
    // of the previous single OTP-prompt-then-camera sequence.
    const onCompleteDelivery = useCallback((id: string) => {
        requestCompleteDelivery(id).then((completed) => {
            if (completed) showToast('Delivery completed!', 'success');
        });
    }, []);

    return { onAccept, onArrive, onStartDelivery, onCompleteDelivery };
};

const getStatusColor = (status: LogisticsStatus): string => {
    const colors: Record<LogisticsStatus, string> = {
        searching: '#F59E0B',
        accepted: '#3B82F6',
        in_transit: '#8B5CF6',
        delivered: '#10B981',
        cancelled: '#EF4444',
    };
    return colors[status] || '#6B7280';
};

const getStatusLabel = (status: LogisticsStatus): string => {
    const labels: Record<LogisticsStatus, string> = {

        searching: 'Searching',
        accepted: 'Accepted',
        in_transit: 'In Transit',
        delivered: 'Delivered',
        cancelled: 'Cancelled',
    };
    return labels[status] || status;
};

const LogisticsCard: React.FC<{
    item: LogisticsItem;
    index: number;
    isDriver: boolean;
    customerActions: ReturnType<typeof useCustomerActions>;
    driverActions: ReturnType<typeof useDriverActions>;
}> = memo(({ item, index, isDriver, customerActions, driverActions }) => {
    const statusColor = useMemo(() => getStatusColor(item.status), [item.status]);
    const price = useMemo(() => `₹${item.price.toFixed(0)}`, [item.price]);
    const [chatOpen, setChatOpen] = useState(false);
    const [chatMsg, setChatMsg] = useState('');


    const currentUserId = useAuthStore((s) => s.user?.id);

    const isAssignedToMe =
        item.driverId === currentUserId;


    // Backend-wired shipment chat (GET/POST /shipments/:id/messages +
    // ChatGateway socket for live delivery). This panel previously had a
    // working Firestore listener/send but was never actually mounted in the
    // JSX below (dead code, unreachable) — now wired to the real backend
    // AND rendered in the action area.
    const { data: msgs = [] } = useChatMessages(chatOpen ? item.id : undefined);
    useChatSocket(chatOpen ? item.id : undefined);
    const { mutate: sendMessage, isPending: sending } = useSendMessage(item.id);

    const sendMsg = () => {
        const text = chatMsg.trim();
        if (!text) return;
        sendMessage(text);
        setChatMsg('');
    };

    const onNavigate = useCallback(() => {
        openGoogleMapsDirections(item.pickup, item.drop).catch(console.error);
    }, [item.pickup, item.drop]);

    // Call the other party on this shipment — driver calls the customer,
    // customer calls the assigned driver. No backend involved; phone
    // numbers already come down with the shipment (sender/dispatch).
    const onCall = useCallback(() => {
        const phone = isDriver ? item.customerPhone : item.driverPhone;
        if (!phone) {
            showToast(isDriver ? 'Customer phone not available' : 'Driver not assigned yet', 'info');
            return;
        }
        Linking.openURL(`tel:${phone}`).catch(() =>
            showToast('Unable to open the dialer', 'error'),
        );
    }, [isDriver, item.customerPhone, item.driverPhone]);

    const onShare = useCallback(() => {
        Share.share({
            message: `Track my Kalanabha shipment: ${item.goodsType} from ${item.pickup?.address} to ${item.drop?.address}. Status: ${getStatusLabel(item.status)}.`,
        }).catch(() => showToast('Unable to share', 'error'));
    }, [item.goodsType, item.pickup, item.drop, item.status]);



    return (
        <Animated.View entering={FadeInUp.delay(index * 50)}>
            <View style={styles.card}>
                {/* Header */}
                <View style={styles.cardHeader}>
                    <View style={styles.headerLeft}>
                        <View style={styles.avatar}>
                            {isDriver ? <User size={20} color="#2563EB" /> : <Truck size={20} color="#2563EB" />}
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.headerTitle} numberOfLines={1}>
                                {/* House Shifting has no real weight (never
                                    measured) — showing "0.0kg" there would
                                    read as a bug, not "not applicable". */}
                                {item.category === 'HOUSE_SHIFTING'
                                    ? `${item.goodsType} • ${item.helpersCount ?? 0} helper${item.helpersCount === 1 ? '' : 's'}`
                                    : `${item.goodsType} • ${item.weightKg?.toFixed(1) ?? '0'}kg`}
                            </Text>
                            <Text style={styles.headerSubtitle} numberOfLines={1}>
                                {isDriver ? item.customerName : item.driverName}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.price}>{price}</Text>
                </View>

                {/* Route */}
                <View style={styles.route}>
                    <View style={styles.routeIcons}>
                        <Circle size={10} color="#10B981" />
                        <View style={styles.line} />
                        <MapPin size={16} color="#EF4444" />
                    </View>
                    <View style={styles.routeText}>
                        <Text numberOfLines={1} style={styles.location}>
                            {item.pickup?.address}
                        </Text>
                        <Text numberOfLines={1} style={styles.location}>
                            {item.drop?.address}
                        </Text>
                    </View>
                </View>

                {/* Meta */}
                <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                        <Route size={14} color="#6B7280" />
                        <Text style={styles.metaText}>{item.distanceKm.toFixed(1)} km</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Clock size={14} color="#6B7280" />
                        <Text style={styles.metaText}>{item.etaMinutes?.toFixed(0) ?? '--'} min</Text>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: statusColor }]}>
                        <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
                    </View>
                </View>

                {/* Actions */}
                <View style={styles.actionBar}>
                    <ActionButton
                        icon={<Navigation size={16} color="#000" />}
                        label="Route"
                        onPress={onNavigate}
                    />
                    <ActionButton
                        icon={<Phone size={16} color="#000" />}
                        label="Call"
                        onPress={onCall}
                    />
                    <ActionButton
                        icon={<Share2 size={16} color="#000" />}
                        label="Share"
                        onPress={onShare}
                    />

                    {/* ACCEPT (only unassigned jobs) */}
                    {isDriver && item.status === 'searching' && !item.driverId && (
                        <ActionButton
                            icon={<Check size={16} color="#FFF" />}
                            label="Accept"
                            primary
                            onPress={() => driverActions.onAccept(item.id)}
                        />
                    )}

                    {/* Status-driven CTA — visible immediately after the
                        relevant transition, no GPS/arrival prerequisite
                        (product decision, kalanabhaBackend 81263b1).
                        "Complete" opens the real Delivery Completion
                        Sheet (OTP + photos + optional signature) instead
                        of completing on a single tap. */}
                    {isDriver && isAssignedToMe && item.status === 'accepted' && (
                        <ActionButton
                            icon={<Truck size={16} color="#FFF" />}
                            label="Verify Pickup"
                            primary
                            onPress={() => driverActions.onStartDelivery(item.id)}
                        />
                    )}

                    {isDriver && isAssignedToMe && item.status === 'in_transit' && (
                        <ActionButton
                            icon={<Check size={16} color="#FFF" />}
                            label="Complete Delivery"
                            primary
                            onPress={() => driverActions.onCompleteDelivery(item.id)}
                        />
                    )}
                </View>

                {/* Shipment chat — GET/POST /shipments/:id/messages, live via ChatGateway */}
                <TouchableOpacity
                    onPress={() => setChatOpen(o => !o)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}
                >
                    <MessageCircle size={14} color="#2563EB" />
                    <Text style={{ color: '#2563EB', fontSize: 12, fontFamily: FONTS.SEMI_BOLD_PRIMARY }}>
                        {chatOpen ? 'Close chat' : 'Chat with customer / admin'}
                    </Text>
                </TouchableOpacity>

                {chatOpen && (
                    <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 10 }}>
                        <ScrollView style={{ maxHeight: 150 }} showsVerticalScrollIndicator={false}>
                            {msgs.map(m => (
                                <View key={m.id} style={{
                                    alignSelf: m.senderId === currentUserId ? 'flex-end' : 'flex-start',
                                    backgroundColor: m.senderId === currentUserId ? '#2563EB' : '#F3F4F6',
                                    borderRadius: 8, padding: 8, marginBottom: 6, maxWidth: '75%',
                                }}>
                                    <Text style={{ color: m.senderId === currentUserId ? '#fff' : '#1F2937', fontSize: 12 }}>
                                        {m.text}
                                    </Text>
                                </View>
                            ))}
                        </ScrollView>
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                            <TextInput
                                value={chatMsg}
                                onChangeText={setChatMsg}
                                placeholder="Message..."
                                placeholderTextColor="#9CA3AF"
                                style={{
                                    flex: 1, borderWidth: 1, borderColor: '#E5E7EB',
                                    borderRadius: 8, paddingHorizontal: 10, height: 36, fontSize: 13,
                                }}
                            />
                            <TouchableOpacity onPress={sendMsg} disabled={sending} style={{
                                backgroundColor: '#2563EB', borderRadius: 8, opacity: sending ? 0.6 : 1,
                                paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Text style={{ color: '#fff', fontFamily: FONTS.BOLD_PRIMARY, fontSize: 12 }}>Send</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        </Animated.View>
    );
});

export const LogisticsCardList: React.FC<{ data: LogisticsItem[]; refreshControl?: any }>
    = ({
        data,
        refreshControl,
    }) => {
        const isDriver = useUserRole() === 'driver';
        const customerActions = useCustomerActions();
        const driverActions = useDriverActions();

        const renderItem = useCallback(

            ({ item, index }: { item: LogisticsItem; index: number }) => (

                <LogisticsCard
                    item={item}
                    index={index}
                    isDriver={isDriver}
                    customerActions={customerActions}
                    driverActions={driverActions}
                />
            ),
            [isDriver, customerActions, driverActions]
        );

        // Had no bottom padding at all — the last card in this list (used
        // on every tab-hosted "Nearby Orders"/"My Orders" screen) sat
        // right behind the bottom tab bar instead of scrolling clear of it.
        const bottomPadding = useTabBarContentPadding();

        return (
            <FlashList
                data={Array.isArray(data) ? data : []}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                // estimatedItemSize={240}
                showsVerticalScrollIndicator={false}
                refreshControl={refreshControl}
                contentContainerStyle={{ paddingBottom: bottomPadding }}
            />
        );
    };

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFF',
        margin: 12,
        padding: 16,
        borderRadius: 16,
        elevation: 3,
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 10,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 15,
        fontFamily: FONTS.BOLD_PRIMARY,
        color: '#1F2937',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    price: {
        fontSize: 18,
        fontFamily: FONTS.BOLD_PRIMARY,
        color: '#000',
    },
    route: {
        flexDirection: 'row',
        marginBottom: 12,
        gap: 10,
    },
    routeIcons: {
        alignItems: 'center',
        width: 24,
    },
    line: {
        width: 2,
        flex: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 4,
    },
    routeText: {
        flex: 1,
        gap: 2,
    },
    location: {
        fontSize: 13,
        color: '#374151',
        fontFamily: FONTS.MEDIUM_PRIMARY,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        marginBottom: 12,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        color: '#6B7280',
        fontFamily: FONTS.MEDIUM_PRIMARY,
    },
    statusPill: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 16,
    },
    statusText: {
        color: '#FFF',
        fontSize: 11,
        fontFamily: FONTS.BOLD_PRIMARY,
    },
    actionBar: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    actionBtn: {
        flex: 1,
        minWidth: 60,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    actionPrimary: {
        backgroundColor: '#2563EB',
        borderColor: '#2563EB',
    },
    actionText: {
        fontSize: 11,
        marginTop: 4,
        fontFamily: FONTS.SEMI_BOLD_PRIMARY,
        color: '#000',
    },
    actionTextPrimary: {
        color: '#FFF',
    },
});