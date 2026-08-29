// TransactionsScreen.tsx — Customer
//
// Real screen replacing Profile.tsx's "Transactions History" menu item,
// which navigated to a screen that was never registered (silent no-op
// tap). There's no separate Payment/Invoice model on the backend — each
// shipment's own `price`/`paymentMode` IS the transaction record, so this
// lists real shipment history (GET /shipments/mine/history) rather than
// fabricating a payments ledger that doesn't exist server-side.
import React from 'react';
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Receipt } from 'lucide-react-native';
import { useMyShipmentHistory } from '@features/shipments/hooks';
import { AsyncState } from '@components/AsyncState';
import type { Shipment, ShipmentStatus } from '@shipment/types';

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

const PAYMENT_LABEL: Record<string, string> = {
    prepaid: 'Online / UPI',
    cod: 'Cash on Delivery',
    credit: 'Credit Account',
};

const TransactionRow = ({ shipment }: { shipment: Shipment }) => {
    const navigation = useNavigation();
    return (
        <Pressable
            style={styles.row}
            onPress={() => (navigation as any).navigate('ShipmentDetailsScreen', { id: shipment.id })}
        >
            <View style={styles.rowIcon}>
                <Receipt color="#2563EB" size={18} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.trackingId}>{shipment.trackingId}</Text>
                <Text style={styles.meta}>
                    {PAYMENT_LABEL[shipment.paymentMode] ?? shipment.paymentMode} ·{' '}
                    {new Date(shipment.createdAt).toLocaleDateString()}
                </Text>
            </View>
            <View style={styles.rowRight}>
                <Text style={styles.price}>₹{shipment.price}</Text>
                <Text style={[styles.status, { color: STATUS_COLOR[shipment.status] }]}>
                    {STATUS_LABEL[shipment.status]}
                </Text>
            </View>
        </Pressable>
    );
};

const TransactionsScreen = () => {
    const navigation = useNavigation();
    const { data: shipments, isLoading, error, refetch } = useMyShipmentHistory();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
                    <ChevronLeft color="#111" size={24} />
                </Pressable>
                <Text style={styles.headerTitle}>Transactions</Text>
                <View style={{ width: 24 }} />
            </View>

            <AsyncState
                isLoading={isLoading}
                error={error}
                onRetry={refetch}
                isEmpty={!shipments?.length}
                emptyTitle="No transactions yet"
                emptyMessage="Your shipment payments will show up here."
            >
                <FlatList
                    data={shipments ?? []}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => <TransactionRow shipment={item} />}
                    contentContainerStyle={styles.list}
                />
            </AsyncState>
        </View>
    );
};

export default TransactionsScreen;

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
    headerTitle: { fontSize: 16, fontWeight: '700' },
    list: { padding: 12, gap: 8 },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#FFF',
        borderRadius: 14,
        padding: 14,
    },
    rowIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    trackingId: { fontSize: 14, fontWeight: '700', color: '#111827' },
    meta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    rowRight: { alignItems: 'flex-end' },
    price: { fontSize: 15, fontWeight: '700', color: '#111827' },
    status: { fontSize: 11, fontWeight: '700', marginTop: 2 },
});
