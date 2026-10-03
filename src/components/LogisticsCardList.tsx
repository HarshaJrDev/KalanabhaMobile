import React, { memo, useCallback, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    TouchableOpacity,
    Linking,
    Share,
    Modal,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Animated, {
    FadeInUp,
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
    User,
    Truck,
    XCircle,
} from 'lucide-react-native';
import { ScrollView, TextInput } from 'react-native-gesture-handler';
import { useAuthStore } from '@features/store/authStore';
import {
    useDriverShipmentActions,
    useUserRole,
    type LogisticsItem,
} from '@features/shipments/logistics';
import { useChatMessages, useChatSocket, useSendMessage } from '@features/chat/hooks';
import { useTabBarContentPadding } from '../screens/navigation/useTabBarStyle';
import { showToast } from '@ui/alert/toastStore';
import { WEBSITE_URL } from '@config/env';
import { useTranslation } from 'react-i18next';
import FONTS from '@utils/fonts';

type LogisticsStatus = 'scheduled' | 'searching' | 'accepted' | 'in_transit' | 'delivered' | 'cancelled' | 'failed';



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





const getStatusColor = (status: LogisticsStatus): string => {
    const colors: Record<LogisticsStatus, string> = {
        scheduled: '#8B5CF6',
        searching: '#F59E0B',
        accepted: '#3B82F6',
        in_transit: '#8B5CF6',
        delivered: '#10B981',
        cancelled: '#EF4444',
        failed: '#DC2626',
    };
    return colors[status] || '#6B7280';
};

const makeStatusLabel = (t: (key: string) => string) => (status: LogisticsStatus): string => {
    const labels: Record<LogisticsStatus, string> = {
        scheduled: t('logisticsCard.statusScheduled'),
        searching: t('logisticsCard.statusSearching'),
        accepted: t('logisticsCard.statusAccepted'),
        in_transit: t('logisticsCard.statusInTransit'),
        delivered: t('logisticsCard.statusDelivered'),
        cancelled: t('logisticsCard.statusCancelled'),
        failed: t('logisticsCard.statusFailed'),
    };
    return labels[status] || status;
};

const LogisticsCard: React.FC<{
    item: LogisticsItem;
    index: number;
    isDriver: boolean;
    driverActions: ReturnType<typeof useDriverShipmentActions>;
}> = memo(({ item, index, isDriver, driverActions }) => {
    const { t } = useTranslation();
    const getStatusLabel = useMemo(() => makeStatusLabel(t), [t]);
    const statusColor = useMemo(() => getStatusColor(item.status), [item.status]);
    const price = useMemo(() => `₹${item.price.toFixed(0)}`, [item.price]);
    const [chatOpen, setChatOpen] = useState(false);
    const [failModalOpen, setFailModalOpen] = useState(false);
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
            showToast(isDriver ? t('logisticsCard.customerPhoneNotAvailable') : t('logisticsCard.driverNotAssignedYet'), 'info');
            return;
        }
        Linking.openURL(`tel:${phone}`).catch(() =>
            showToast(t('logisticsCard.unableToOpenDialer'), 'error'),
        );
    }, [isDriver, item.customerPhone, item.driverPhone, t]);

    
    
    
    
    const onShare = useCallback(() => {
        const trackingUrl = `${WEBSITE_URL}/track/${item.trackingId}`;
        Share.share({
            message: t('logisticsCard.trackShipmentMessage', {
                goodsType: item.goodsType,
                pickup: item.pickup?.address,
                drop: item.drop?.address,
                status: getStatusLabel(item.status),
            }) + `\n${trackingUrl}`,
            url: trackingUrl,
        }).catch(() => showToast(t('logisticsCard.unableToShare'), 'error'));
    }, [item.goodsType, item.pickup, item.drop, item.status, item.trackingId, t, getStatusLabel]);



    return (
        <Animated.View entering={FadeInUp.delay(index * 50)}>
            <View style={styles.card}>
                {}
                <View style={styles.cardHeader}>
                    <View style={styles.headerLeft}>
                        <View style={styles.avatar}>
                            {isDriver ? <User size={20} color="#2563EB" /> : <Truck size={20} color="#2563EB" />}
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.headerTitle} numberOfLines={1}>
                                {}
                                {item.category === 'HOUSE_SHIFTING'
                                    ? t('logisticsCard.helpersCountLabel', { goodsType: item.goodsType, count: item.helpersCount ?? 0, plural: item.helpersCount === 1 ? '' : 's' })
                                    : t('logisticsCard.weightLabel', { goodsType: item.goodsType, weight: item.weightKg?.toFixed(1) ?? '0' })}
                            </Text>
                            <Text style={styles.headerSubtitle} numberOfLines={1}>
                                {isDriver ? item.customerName : item.driverName}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.price}>{price}</Text>
                </View>

                {}
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

                {}
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

                {}
                <View style={styles.actionBar}>
                    <ActionButton
                        icon={<Navigation size={16} color="#000" />}
                        label={t('logisticsCard.route')}
                        onPress={onNavigate}
                    />
                    <ActionButton
                        icon={<Phone size={16} color="#000" />}
                        label={t('logisticsCard.call')}
                        onPress={onCall}
                    />
                    <ActionButton
                        icon={<Share2 size={16} color="#000" />}
                        label={t('logisticsCard.share')}
                        onPress={onShare}
                    />

                    {}
                    {isDriver && item.status === 'searching' && !item.driverId && (
                        <ActionButton
                            icon={<Check size={16} color="#FFF" />}
                            label={t('logisticsCard.accept')}
                            primary
                            onPress={() => driverActions.onAccept(item.id)}
                        />
                    )}

                    {}
                    {isDriver && isAssignedToMe && item.status === 'accepted' && (
                        <ActionButton
                            icon={<Truck size={16} color="#FFF" />}
                            label={t('logisticsCard.verifyPickup')}
                            primary
                            onPress={() => driverActions.onStartDelivery(item.id)}
                        />
                    )}

                    {}
                    {isDriver && isAssignedToMe && item.status === 'accepted' && (
                        <ActionButton
                            icon={<XCircle size={16} color="#EF4444" />}
                            label={t('logisticsCard.cantDeliver')}
                            onPress={() => driverActions.onDriverCancel(item.id)}
                        />
                    )}

                    {isDriver && isAssignedToMe && item.status === 'in_transit' && (
                        <ActionButton
                            icon={<Check size={16} color="#FFF" />}
                            label={t('logisticsCard.completeDelivery')}
                            primary
                            onPress={() => driverActions.onCompleteDelivery(item.id)}
                        />
                    )}

                    {}
                    {isDriver && isAssignedToMe && item.status === 'in_transit' && (
                        <ActionButton
                            icon={<XCircle size={16} color="#EF4444" />}
                            label={t('logisticsCard.unableToDeliver')}
                            onPress={() => setFailModalOpen(true)}
                        />
                    )}
                </View>

                <Modal
                    visible={failModalOpen}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setFailModalOpen(false)}
                >
                    <View style={failModalStyles.overlay}>
                        <View style={failModalStyles.sheet}>
                            <Text style={failModalStyles.title}>
                                {t('logisticsCard.unableToDeliverTitle')}
                            </Text>
                            {(['WRONG_ADDRESS', 'CUSTOMER_UNREACHABLE', 'REFUSED', 'OTHER'] as const).map((reason) => (
                                <TouchableOpacity
                                    key={reason}
                                    style={failModalStyles.reasonBtn}
                                    onPress={() => {
                                        setFailModalOpen(false);
                                        driverActions.onFailDelivery(item.id, reason);
                                    }}
                                >
                                    <Text style={failModalStyles.reasonText}>
                                        {t(`logisticsCard.failReason_${reason}`)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                            <TouchableOpacity
                                style={failModalStyles.cancelBtn}
                                onPress={() => setFailModalOpen(false)}
                            >
                                <Text style={failModalStyles.cancelText}>
                                    {t('common.close')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {}
                <TouchableOpacity
                    onPress={() => setChatOpen(o => !o)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}
                >
                    <MessageCircle size={14} color="#2563EB" />
                    <Text style={{ color: '#2563EB', fontSize: 12, fontFamily: FONTS.SEMI_BOLD_PRIMARY }}>
                        {chatOpen ? t('logisticsCard.closeChat') : t('logisticsCard.chatWithCustomerAdmin')}
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
                                placeholder={t('logisticsCard.messagePlaceholder')}
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
                                <Text style={{ color: '#fff', fontFamily: FONTS.BOLD_PRIMARY, fontSize: 12 }}>{t('logisticsCard.send')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        </Animated.View>
    );
});

export const LogisticsCardList: React.FC<{ data: LogisticsItem[]; refreshControl?: any; scrollEnabled?: boolean }>
    = ({
        data,
        refreshControl,
        scrollEnabled = true,
    }) => {
        const isDriver = useUserRole() === 'driver';
        const driverActions = useDriverShipmentActions();

        const renderItem = useCallback(

            ({ item, index }: { item: LogisticsItem; index: number }) => (

                <LogisticsCard
                    item={item}
                    index={index}
                    isDriver={isDriver}
                    driverActions={driverActions}
                />
            ),
            [isDriver, driverActions]
        );

        
        
        
        const bottomPadding = useTabBarContentPadding();
        const items = Array.isArray(data) ? data : [];

        if (!scrollEnabled) {
            return (
                <View style={{ paddingBottom: bottomPadding }}>
                    {items.map((item, index) => (
                        <LogisticsCard
                            key={item.id}
                            item={item}
                            index={index}
                            isDriver={isDriver}
                            driverActions={driverActions}
                        />
                    ))}
                </View>
            );
        }

        return (
            <FlashList
                data={items}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                
                showsVerticalScrollIndicator={false}
                refreshControl={refreshControl}
                contentContainerStyle={{ paddingBottom: bottomPadding }}
            />
        );
    };

const failModalStyles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
    sheet: { backgroundColor: '#fff', borderRadius: 14, padding: 18 },
    title: { fontSize: 15, fontFamily: FONTS.BOLD_PRIMARY, color: '#111827', marginBottom: 14 },
    reasonBtn: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    reasonText: { fontSize: 14, fontFamily: FONTS.MEDIUM_PRIMARY, color: '#111827' },
    cancelBtn: { paddingVertical: 12, marginTop: 4, alignItems: 'center' },
    cancelText: { fontSize: 14, fontFamily: FONTS.SEMI_BOLD_PRIMARY, color: '#6B7280' },
});

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
