// InboxScreen.tsx — replaces the old message.tsx/Message/ChatScreen.tsx
// demo pair (100% mock data, no navigation route ever reached it — deleted
// earlier this session).
//
// There's no backend "conversations" or general-support-chat endpoint —
// ChatMessage rows are strictly per-shipment (kalanabhaBackend prisma
// schema: `ChatMessage.shipmentId` is a required FK). Rather than invent
// one, this is a real inbox over what already exists: every one of the
// customer's active shipments that has a driver assigned (dispatch != null,
// so there's actually someone to talk to) is a "conversation", opening the
// same real ShipmentChatScreen backend (GET/POST /shipments/:id/messages)
// that already works from ShipmentDetailsScreen.
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useMyShipments } from '@features/shipments/hooks';
import { useChatMessages } from '@features/chat/hooks';
import { AsyncState } from '@components/AsyncState';
import type { Shipment } from '@shipment/types';
import FONTS from '@utils/fonts';

const ConversationRow = ({ shipment }: { shipment: Shipment }) => {
    const navigation = useNavigation();
    // Each row's own last-message preview — cheap, and shares the cache
    // with ShipmentChatScreen so opening a thread doesn't refetch.
    const { data: messages } = useChatMessages(shipment.id);
    const last = messages?.[messages.length - 1];

    return (
        <Pressable
            style={styles.row}
            onPress={() => (navigation as any).navigate('ShipmentChat', { shipmentId: shipment.id })}
        >
            <View style={styles.avatar}>
                <MessageCircle color="#2563EB" size={20} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.driverName}>{shipment.dispatch?.driverName ?? 'Driver'}</Text>
                <Text style={styles.preview} numberOfLines={1}>
                    {last ? last.text : `Shipment ${shipment.trackingId}`}
                </Text>
            </View>
            <ChevronRight color="#9CA3AF" size={18} />
        </Pressable>
    );
};

const InboxScreen = () => {
    const navigation = useNavigation();
    const { data: shipments, isLoading, error, refetch } = useMyShipments();

    const conversations = (shipments ?? []).filter((s) => s.dispatch != null);

    const renderItem = useCallback(
        ({ item }: { item: Shipment }) => <ConversationRow shipment={item} />,
        [],
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
                    <ChevronLeft color="#111" size={24} />
                </Pressable>
                <Text style={styles.headerTitle}>Inbox</Text>
                <View style={{ width: 24 }} />
            </View>

            <AsyncState
                isLoading={isLoading}
                error={error}
                onRetry={refetch}
                isEmpty={conversations.length === 0}
                emptyTitle="No conversations yet"
                emptyMessage="Once a driver accepts one of your shipments, you can chat with them here."
            >
                <FlatList
                    data={conversations}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                />
            </AsyncState>
        </View>
    );
};

export default InboxScreen;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7F7F7' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#EEE',
    },
    headerTitle: { fontSize: 16, fontFamily: FONTS.BOLD_PRIMARY },
    list: { padding: 12, gap: 8 },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#FFF',
        borderRadius: 14,
        padding: 14,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    driverName: { fontSize: 14, fontFamily: FONTS.BOLD_PRIMARY, color: '#111827' },
    preview: { fontSize: 12, color: '#6B7280', marginTop: 2 },
});
