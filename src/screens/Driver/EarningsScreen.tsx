// EarningsScreen.tsx — Driver
//
// Was only a generic Transactions list before (shipment rows, no
// aggregation) — this is the first real today/week/all-time earnings
// summary, backed by GET /shipments/driver/earnings-summary
// (ShipmentsController.earningsSummary), computed server-side by summing
// Shipment.price over this driver's own DELIVERED trips. No separate
// wallet/payout ledger exists yet — this IS the transaction record, same
// reasoning TransactionsScreen.tsx's own comment gives on the customer side.
import React from 'react';
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Wallet, TrendingUp, Package } from 'lucide-react-native';
import { useDriverEarningsSummary } from '@features/shipments/hooks';
import { AsyncState } from '@components/AsyncState';
import { useTranslation } from 'react-i18next';
import FONTS from '@utils/fonts';

const EarningsScreen = () => {
    const navigation = useNavigation();
    const { t } = useTranslation();
    const { data: summary, isLoading, error, refetch } = useDriverEarningsSummary();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
                    <ChevronLeft color="#111" size={24} />
                </Pressable>
                <Text style={styles.headerTitle}>{t('earnings.title')}</Text>
                <View style={{ width: 24 }} />
            </View>

            <AsyncState
                isLoading={isLoading}
                error={error}
                onRetry={refetch}
                isEmpty={false}
            >
                <FlatList
                    data={summary?.recentTrips ?? []}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    ListHeaderComponent={
                        <>
                            <View style={styles.cardsRow}>
                                <View style={[styles.card, styles.cardPrimary]}>
                                    <Wallet color="#fff" size={20} />
                                    <Text style={styles.cardValueLight}>₹{summary?.today.total ?? 0}</Text>
                                    <Text style={styles.cardLabelLight}>{t('earnings.today')}</Text>
                                </View>
                                <View style={styles.card}>
                                    <TrendingUp color="#2563EB" size={20} />
                                    <Text style={styles.cardValue}>₹{summary?.week.total ?? 0}</Text>
                                    <Text style={styles.cardLabel}>{t('earnings.thisWeek')}</Text>
                                </View>
                            </View>
                            <View style={styles.card}>
                                <Package color="#10B981" size={20} />
                                <Text style={styles.cardValue}>₹{summary?.allTime.total ?? 0}</Text>
                                <Text style={styles.cardLabel}>{t('earnings.allTime', { trips: summary?.allTime.trips ?? 0 })}</Text>
                            </View>
                            <Text style={styles.sectionTitle}>{t('earnings.recentTrips')}</Text>
                        </>
                    }
                    renderItem={({ item }) => (
                        <View style={styles.tripRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.tripTrackingId}>{item.trackingId}</Text>
                                <Text style={styles.tripRoute} numberOfLines={1}>{item.from} → {item.to}</Text>
                            </View>
                            <Text style={styles.tripPrice}>₹{item.price}</Text>
                        </View>
                    )}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>{t('earnings.noTripsYet')}</Text>
                    }
                />
            </AsyncState>
        </View>
    );
};

export default EarningsScreen;

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
    cardsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    card: {
        flex: 1, backgroundColor: '#FFF', borderRadius: 14, padding: 16, gap: 4,
        marginBottom: 10,
    },
    cardPrimary: { backgroundColor: '#FF7518' },
    cardValue: { fontSize: 20, fontFamily: FONTS.BOLD_PRIMARY, color: '#111827' },
    cardValueLight: { fontSize: 20, fontFamily: FONTS.BOLD_PRIMARY, color: '#fff' },
    cardLabel: { fontSize: 12, fontFamily: FONTS.PRIMARY, color: '#6B7280' },
    cardLabelLight: { fontSize: 12, fontFamily: FONTS.PRIMARY, color: '#FFEEDF' },
    sectionTitle: { fontSize: 14, fontFamily: FONTS.BOLD_PRIMARY, color: '#111827', marginBottom: 6, marginTop: 4 },
    tripRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#FFF', borderRadius: 12, padding: 12, marginBottom: 8,
    },
    tripTrackingId: { fontSize: 13, fontFamily: FONTS.BOLD_PRIMARY, color: '#111827' },
    tripRoute: { fontSize: 12, fontFamily: FONTS.PRIMARY, color: '#6B7280', marginTop: 2 },
    tripPrice: { fontSize: 14, fontFamily: FONTS.BOLD_PRIMARY, color: '#10B981' },
    emptyText: { fontSize: 13, fontFamily: FONTS.PRIMARY, color: '#9CA3AF', textAlign: 'center', paddingTop: 20 },
});
