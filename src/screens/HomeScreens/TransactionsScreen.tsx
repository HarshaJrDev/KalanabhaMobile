// TransactionsScreen.tsx — Customer
//
// Real screen replacing Profile.tsx's "Transactions History" menu item,
// which navigated to a screen that was never registered (silent no-op
// tap). There's no separate Payment/Invoice model on the backend — each
// shipment's own `price`/`paymentMode` IS the transaction record, so this
// lists real shipment history (GET /shipments/mine/history) rather than
// fabricating a payments ledger that doesn't exist server-side.
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Receipt } from 'lucide-react-native';
import { useMyShipmentHistory } from '@features/shipments/hooks';
import { AsyncState } from '@components/AsyncState';
import type { Shipment, ShipmentStatus } from '@shipment/types';
import { useAppTheme } from '@theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import FONTS from '@utils/fonts';

const makeStatusColor = (colors: ReturnType<typeof useAppTheme>['colors']): Record<ShipmentStatus, string> => ({
    searching: colors.GRAY,
    accepted: colors.PRIMARY,
    in_transit: colors.WARNING,
    delivered: colors.SUCCESS,
    cancelled: colors.ERROR,
});

const makeStatusLabel = (t: (key: string) => string): Record<ShipmentStatus, string> => ({
    searching: t('status.searching'),
    accepted: t('status.accepted'),
    in_transit: t('status.inTransit'),
    delivered: t('status.delivered'),
    cancelled: t('status.cancelled'),
});

const makePaymentLabel = (t: (key: string) => string): Record<string, string> => ({
    prepaid: t('addOrder.paymentOnlineUpi'),
    cod: t('addOrder.paymentCod'),
    credit: t('addOrder.paymentCredit'),
});

const TransactionRow = ({ shipment }: { shipment: Shipment }) => {
    const navigation = useNavigation();
    const { colors } = useAppTheme();
    const { t } = useTranslation();
    const styles = useMemo(() => makeStyles(colors), [colors]);
    const statusColor = useMemo(() => makeStatusColor(colors), [colors]);
    const STATUS_LABEL = useMemo(() => makeStatusLabel(t), [t]);
    const PAYMENT_LABEL = useMemo(() => makePaymentLabel(t), [t]);
    return (
        <Pressable
            style={styles.row}
            onPress={() => (navigation as any).navigate('ShipmentDetailsScreen', { id: shipment.id })}
        >
            <View style={styles.rowIcon}>
                <Receipt color={colors.PRIMARY} size={18} />
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
                <Text style={[styles.status, { color: statusColor[shipment.status] }]}>
                    {STATUS_LABEL[shipment.status]}
                </Text>
            </View>
        </Pressable>
    );
};

const TransactionsScreen = () => {
    const navigation = useNavigation();
    const { colors } = useAppTheme();
    const { t } = useTranslation();
    const styles = useMemo(() => makeStyles(colors), [colors]);
    const { data: shipments, isLoading, error, refetch } = useMyShipmentHistory();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
                    <ChevronLeft color={colors.TEXT_PRIMARY} size={24} />
                </Pressable>
                <Text style={styles.headerTitle}>{t('transactions.title')}</Text>
                <View style={{ width: 24 }} />
            </View>

            <AsyncState
                isLoading={isLoading}
                error={error}
                onRetry={refetch}
                isEmpty={!shipments?.length}
                emptyTitle={t('transactions.noTransactionsYet')}
                emptyMessage={t('transactions.paymentsShowHere')}
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

// Computed from useAppTheme() so this screen repaints correctly in dark
// mode instead of staying pinned to the light palette baked at import.
const makeStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.BACKGROUND },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: colors.SURFACE,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.BORDER,
    },
    headerTitle: { fontSize: 16, fontFamily: FONTS.BOLD_PRIMARY, color: colors.TEXT_PRIMARY },
    list: { padding: 12, gap: 8 },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: colors.SURFACE,
        borderRadius: 14,
        padding: 14,
    },
    rowIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.PRIMARY_LIGHT,
        alignItems: 'center',
        justifyContent: 'center',
    },
    trackingId: { fontSize: 14, fontFamily: FONTS.BOLD_PRIMARY, color: colors.TEXT_PRIMARY },
    meta: { fontSize: 12, color: colors.TEXT_SECONDARY, marginTop: 2 },
    rowRight: { alignItems: 'flex-end' },
    price: { fontSize: 15, fontFamily: FONTS.BOLD_PRIMARY, color: colors.TEXT_PRIMARY },
    status: { fontSize: 11, fontFamily: FONTS.BOLD_PRIMARY, marginTop: 2 },
});
