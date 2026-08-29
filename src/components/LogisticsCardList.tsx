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
    completeDelivery as completeDeliveryRequest,
    startDelivery as startDeliveryRequest,
} from '@features/shipments/api/shipments.api';
import { useChatMessages, useChatSocket, useSendMessage } from '@features/chat/hooks';
import { normalizeError } from '@utils/error';
import { showToast } from '@ui/alert/toastStore';

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
const useDriverActions = () => {
    const onAccept = useCallback(async (id: string) => {
        try {
            await acceptShipmentRequest(id);
            showToast('Order accepted! Start delivery.', 'success');
        } catch (err) {
            showToast(normalizeError(err) || 'Order already taken', 'error');
        }
    }, []);

    const onStartDelivery = useCallback(async (id: string) => {
        try {
            await startDeliveryRequest(id);
            showToast('Delivery in progress', 'success');
        } catch (err) {
            showToast(normalizeError(err) || 'Failed to start delivery', 'error');
        }
    }, []);

    const onCompleteDelivery = useCallback(async (id: string) => {
        try {
            await completeDeliveryRequest(id);
            showToast('Delivery completed!', 'success');
        } catch (err) {
            showToast(normalizeError(err) || 'Failed to complete delivery', 'error');
        }
    }, []);

    return { onAccept, onStartDelivery, onCompleteDelivery };
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
                                {item.goodsType} • {item.weightKg?.toFixed(1) ?? '0'}kg
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

                    {/* {isDriver && item.status === 'pending' && (
                        <ActionButton
                            icon={<Check size={16} color="#FFF" />}
                            label="Accept"
                            primary
                            onPress={() => driverActions.onAccept(item.id)}
                        />
                    )} */}

                    {isDriver && item.status === 'accepted' && (
                        <ActionButton
                            icon={<Truck size={16} color="#FFF" />}
                            label="Start"
                            primary
                            onPress={() => driverActions.onStartDelivery(item.id)}
                        />
                    )}


                    {/* ACCEPT (only unassigned jobs) */}
                    {isDriver && item.status === 'searching' && !item.driverId && (
                        <ActionButton
                            icon={<Check size={16} color="#FFF" />}
                            label="Accept"
                            primary
                            onPress={() => driverActions.onAccept(item.id)}
                        />
                    )}

                    {/* START (only if assigned to me) */}
                    {isDriver && item.status === 'accepted' && isAssignedToMe && (
                        <ActionButton
                            icon={<Truck size={16} color="#FFF" />}
                            label="Start"
                            primary
                            onPress={() => driverActions.onStartDelivery(item.id)}
                        />
                    )}

                    {/* COMPLETE (only if assigned to me) */}
                    {isDriver && item.status === 'in_transit' && isAssignedToMe && (
                        <ActionButton
                            icon={<Check size={16} color="#FFF" />}
                            label="Complete"
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
                    <Text style={{ color: '#2563EB', fontSize: 12, fontWeight: '600' }}>
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
                                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>Send</Text>
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

        return (
            <FlashList
                data={Array.isArray(data) ? data : []}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                // estimatedItemSize={240}
                showsVerticalScrollIndicator={false}
                refreshControl={refreshControl}
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
        fontWeight: '700',
        color: '#1F2937',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    price: {
        fontSize: 18,
        fontWeight: '800',
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
        fontWeight: '500',
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
        fontWeight: '500',
    },
    statusPill: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 16,
    },
    statusText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '700',
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
        fontWeight: '600',
        color: '#000',
    },
    actionTextPrimary: {
        color: '#FFF',
    },
});