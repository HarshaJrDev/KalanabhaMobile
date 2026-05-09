import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Alert,
    Dimensions,
    TouchableOpacity,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Animated, {
    FadeInUp,
    ZoomIn,
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';
import { openGoogleMapsDirections } from '../utils/navigation';
import {
    Check,
    Circle,
    Clock,
    MapPin,
    Navigation,
    Phone,
    Route,
    Share2,
    X,
    User,
    Truck,
    Zap,
} from 'lucide-react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { ScrollView, TextInput } from 'react-native-gesture-handler';

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

const useUserRole = (): UserRole => {
    const user = auth().currentUser;
    return user ? 'driver' : 'customer';
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

const useCustomerActions = () => {
    const onCancel = useCallback(async (id: string) => {
        try {
            await firestore().collection('shipments').doc(id).update({
                status: 'cancelled',
                updatedAt: firestore.FieldValue.serverTimestamp(),
            });
            Alert.alert('✅ Cancelled', 'Order cancelled successfully');
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to cancel order');
        }
    }, []);

    return { onCancel };
};

const useDriverActions = () => {
    const onAccept = useCallback(async (id: string) => {
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('Not authenticated');

            const ref = firestore().collection('shipments').doc(id);

            await firestore().runTransaction(async (tx) => {
                const doc = await tx.get(ref);
                if (!doc.exists) throw new Error('Shipment not found');

                const data = doc.data();
                if (data?.status !== 'searching') {
                    throw new Error('Already taken by another driver');
                }

                tx.update(ref, {
                    status: 'accepted',
                    'dispatch.driverId': user.uid,
                    'dispatch.driverName': user.displayName || 'Driver',
                    'dispatch.acceptedAt': firestore.FieldValue.serverTimestamp(),
                });
            });

            Alert.alert('✅ Accepted', 'Order accepted! Start delivery.');
        } catch (err: any) {
            Alert.alert('Failed', err.message || 'Order already taken');
        }
    }, []);

    const onStartDelivery = useCallback(async (id: string) => {
        try {
            await firestore().collection('shipments').doc(id).update({
                status: 'in_transit',
                'dispatch.startedAt': firestore.FieldValue.serverTimestamp(),
            });
            Alert.alert('🚚 Started', 'Delivery in progress');
        } catch (err) {
            Alert.alert('Error', 'Failed to start delivery');
        }
    }, []);

    const onCompleteDelivery = useCallback(async (id: string) => {
        try {
            await firestore().collection('shipments').doc(id).update({
                status: 'delivered',
                'dispatch.completedAt': firestore.FieldValue.serverTimestamp(),
            });
            Alert.alert('✅ Delivered', 'Delivery completed!');
        } catch (err) {
            Alert.alert('Error', 'Failed to complete delivery');
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
    const [msgs, setMsgs] = useState<any[]>([]);





    const currentUserId = auth().currentUser?.uid;

    const isAssignedToMe =
        item.driverId === currentUserId;


    useEffect(() => {
        if (!chatOpen) return;
        const unsub = firestore()
            .collection('shipments')
            .doc(item.id)
            .collection('messages')
            .orderBy('createdAt', 'asc')
            .onSnapshot(snap => {
                setMsgs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            });
        return () => unsub();
    }, [chatOpen, item.id]);


    const sendMsg = async () => {
        if (!chatMsg.trim()) return;
        const user = auth().currentUser;
        await firestore()
            .collection('shipments')
            .doc(item.id)
            .collection('messages')
            .add({
                text: chatMsg.trim(),
                senderId: user?.uid,
                senderName: user?.displayName ?? 'Driver',
                createdAt: firestore.FieldValue.serverTimestamp(),
                shipmentId: item.id,
            });
        setChatMsg('');
    };

    // Add this JSX after the action bar:
    {
        chatOpen && (
            <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 10 }}>
                <ScrollView style={{ maxHeight: 150 }} showsVerticalScrollIndicator={false}>
                    {msgs.map(m => (
                        <View key={m.id} style={{
                            alignSelf: m.senderName === 'Driver' ? 'flex-end' : 'flex-start',
                            backgroundColor: m.senderName === 'Driver' ? '#2563EB' : '#F3F4F6',
                            borderRadius: 8, padding: 8, marginBottom: 6, maxWidth: '75%',
                        }}>
                            <Text style={{ color: m.senderName === 'Driver' ? '#fff' : '#1F2937', fontSize: 12 }}>
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
                    <TouchableOpacity onPress={sendMsg} style={{
                        backgroundColor: '#2563EB', borderRadius: 8,
                        paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>Send</Text>
                    </TouchableOpacity>
                </View>
            </View>
        )
    }
    <TouchableOpacity onPress={() => setChatOpen(o => !o)} style={{ marginTop: 8 }}>
        <Text style={{ color: '#2563EB', fontSize: 12, fontWeight: '600' }}>
            {chatOpen ? 'Close chat ↑' : '💬 Chat with customer / admin'}
        </Text>
    </TouchableOpacity>

    const onNavigate = useCallback(() => {
        openGoogleMapsDirections(item.pickup, item.drop).catch(console.error);
    }, [item.pickup, item.drop]);



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
                        onPress={() => console.log('Call')}
                    />
                    <ActionButton
                        icon={<Share2 size={16} color="#000" />}
                        label="Share"
                        onPress={() => console.log('Share')}
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


        const [chatOpen, setChatOpen] = useState(false);
        const [chatMsg, setChatMsg] = useState('');
        const [msgs, setMsgs] = useState<any[]>([]);










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