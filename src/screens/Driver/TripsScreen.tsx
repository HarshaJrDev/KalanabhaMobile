// TripsScreen.tsx — Driver
//
// Replaces ProfileScreen's "Your Trips" "Coming soon" toast — it was a
// no-op only because there was no backend endpoint returning "shipments
// assigned to me" for a driver (GET /shipments/searching is the unassigned
// pool, GET /shipments/mine is customer-scoped). Added
// GET /shipments/driver/mine (ShipmentsController.findMineAsDriver) for
// this — same real data model, actual trip history, not fabricated.
//
// The current ACCEPTED/IN_TRANSIT shipment (if any) is pinned at the top
// with a "Chat with Customer" button — this is also the fix for "customer
// sends a message but the driver never gets it": the driver app had no
// chat entry point at all before this, even though the chat backend
// (GET/POST /shipments/:id/messages + ChatGateway websocket) already
// worked correctly (verified independently via curl + a raw socket.io
// client — messages were delivered live; the mobile driver side just never
// opened the screen that reads them).
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, MessageCircle, Package } from 'lucide-react-native';
import { useMyShipmentsAsDriver } from '@features/shipments/hooks';
import { AsyncState } from '@components/AsyncState';
import type { Shipment, ShipmentStatus } from '@shipment/types';
import FONTS from '@utils/fonts';

const STATUS_LABEL: Record<ShipmentStatus, string> = {
    searching: 'Searching',
    accepted: 'Accepted',
    in_transit: 'In Transit',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
};

const STATUS_COLOR: Record<ShipmentStatus, string> = {
    searching: '#9CA3AF',
    accepted: '#2563EB',
    in_transit: '#F59E0B',
    delivered: '#10B981',
    cancelled: '#DC2626',
};

const TripRow = ({ shipment, onChat }: { shipment: Shipment; onChat: (id: string) => void }) => {
    const navigation = useNavigation();
    const isActive = shipment.status === 'accepted' || shipment.status === 'in_transit';

    return (
        <Pressable
            style={styles.row}
            onPress={() => (navigation as any).navigate('ShipmentDetailsScreen', { id: shipment.id })}
        >
            <View style={styles.rowTop}>
                <Text style={styles.trackingId}>{shipment.trackingId}</Text>
                <View style={[styles.statusPill, { backgroundColor: `${STATUS_COLOR[shipment.status]}22` }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLOR[shipment.status] }]}>
                        {STATUS_LABEL[shipment.status]}
                    </Text>
                </View>
            </View>
            <Text style={styles.route} numberOfLines={1}>
                {shipment.from} → {shipment.to}
            </Text>
            <View style={styles.rowBottom}>
                <Text style={styles.price}>₹{shipment.price}</Text>
                {isActive && (
                    <Pressable style={styles.chatBtn} onPress={() => onChat(shipment.id)}>
                        <MessageCircle color="#2563EB" size={16} />
                        <Text style={styles.chatBtnText}>Chat with Customer</Text>
                    </Pressable>
                )}
            </View>
        </Pressable>
    );
};

const TripsScreen = () => {
    const navigation = useNavigation();
    const { data: shipments, isLoading, error, refetch } = useMyShipmentsAsDriver();

    const onChat = useCallback(
        (shipmentId: string) => (navigation as any).navigate('ShipmentChat', { shipmentId }),
        [navigation],
    );

    const renderItem = useCallback(
        ({ item }: { item: Shipment }) => <TripRow shipment={item} onChat={onChat} />,
        [onChat],
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
                    <ChevronLeft color="#111" size={24} />
                </Pressable>
                <Text style={styles.headerTitle}>Your Trips</Text>
                <View style={{ width: 24 }} />
            </View>

            <AsyncState
                isLoading={isLoading}
                error={error}
                onRetry={refetch}
                isEmpty={!shipments?.length}
                emptyTitle="No trips yet"
                emptyMessage="Accepted deliveries will show up here."
            >
                <FlatList
                    data={shipments ?? []}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.emptyIcon}>
                            <Package color="#D1D5DB" size={40} />
                        </View>
                    }
                />
            </AsyncState>
        </View>
    );
};

export default TripsScreen;

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
    list: { padding: 12, gap: 10 },
    emptyIcon: { alignItems: 'center', paddingTop: 40 },
    row: {
        backgroundColor: '#FFF',
        borderRadius: 14,
        padding: 14,
        gap: 6,
    },
    rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    trackingId: { fontSize: 14, fontFamily: FONTS.BOLD_PRIMARY, color: '#111827' },
    statusPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
    statusText: { fontSize: 11, fontFamily: FONTS.BOLD_PRIMARY },
    route: { fontSize: 12, fontFamily: FONTS.PRIMARY, color: '#6B7280' },
    rowBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
    price: { fontSize: 15, fontFamily: FONTS.BOLD_PRIMARY, color: '#111827' },
    chatBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
    },
    chatBtnText: { fontSize: 12, fontFamily: FONTS.BOLD_PRIMARY, color: '#2563EB' },
});
