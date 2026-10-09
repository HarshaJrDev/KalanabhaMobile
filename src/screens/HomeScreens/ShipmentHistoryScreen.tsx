import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { ArrowLeft, ArrowRight, Package } from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@theme/ThemeContext';
import { useMyShipmentHistory } from '@features/shipments/hooks';
import { AsyncState } from '@components/AsyncState';
import type { Shipment, ShipmentStatus } from '@shipment/types';
import type { RootStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ShipmentHistory'>;
type ShipmentHistoryRouteProp = RouteProp<RootStackParamList, 'ShipmentHistory'>;

type FilterKey = 'all' | ShipmentStatus;

const STATUS_ORDER: ShipmentStatus[] = ['searching', 'accepted', 'in_transit', 'scheduled', 'delivered', 'cancelled', 'failed'];

export const ShipmentHistoryScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<ShipmentHistoryRouteProp>();
    const { t } = useTranslation();
    const { colors, fonts, spacing, radius } = useAppTheme();
    const styles = useMemo(() => makeStyles(colors, fonts, spacing, radius), [colors, fonts, spacing, radius]);
    const { data: shipments, isLoading, error, refetch } = useMyShipmentHistory();

    const [filter, setFilter] = useState<FilterKey>((route.params?.initialStatus as FilterKey) ?? 'all');

    const statusColor = useMemo((): Record<ShipmentStatus, string> => ({
        scheduled: colors.INFO ?? colors.PRIMARY,
        searching: colors.GRAY,
        accepted: colors.PRIMARY,
        in_transit: colors.WARNING,
        delivered: colors.SUCCESS,
        cancelled: colors.ERROR,
        failed: colors.ERROR,
    }), [colors]);

    const statusLabel = useMemo((): Record<ShipmentStatus, string> => ({
        scheduled: t('status.scheduled'),
        searching: t('status.searching'),
        accepted: t('status.accepted'),
        in_transit: t('status.inTransit'),
        delivered: t('status.delivered'),
        cancelled: t('status.cancelled'),
        failed: t('status.failed'),
    }), [t]);

    const counts = useMemo(() => {
        const base: Record<FilterKey, number> = { all: shipments?.length ?? 0 } as Record<FilterKey, number>;
        STATUS_ORDER.forEach(s => { base[s] = 0; });
        (shipments ?? []).forEach(s => { base[s.status] = (base[s.status] ?? 0) + 1; });
        return base;
    }, [shipments]);

    const deliveredCount = counts.delivered ?? 0;
    const activeCount = (counts.searching ?? 0) + (counts.accepted ?? 0) + (counts.in_transit ?? 0) + (counts.scheduled ?? 0);

    const filtered = useMemo(() => {
        if (filter === 'all') return shipments ?? [];
        return (shipments ?? []).filter(s => s.status === filter);
    }, [shipments, filter]);

    const filters: { key: FilterKey; label: string }[] = [
        { key: 'all', label: t('shipmentHistory.filterAll') },
        ...STATUS_ORDER.filter(s => counts[s] > 0).map(s => ({ key: s, label: statusLabel[s] })),
    ];

    return (
        <View style={styles.container}>
            <LinearGradient colors={[colors.PRIMARY, colors.PRIMARY_DARK ?? colors.PRIMARY]} style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
                    <ArrowLeft color="#fff" size={22} />
                </Pressable>
                <Text style={styles.headerTitle}>{t('shipmentHistory.title')}</Text>
                <Text style={styles.headerSub}>
                    {t('shipmentHistory.subtitle', { count: shipments?.length ?? 0 })}
                </Text>

                <View style={styles.statsRow}>
                    <View style={styles.statChip}>
                        <Text style={styles.statValue}>{shipments?.length ?? 0}</Text>
                        <Text style={styles.statLabel}>{t('shipmentHistory.statTotal')}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statChip}>
                        <Text style={styles.statValue}>{deliveredCount}</Text>
                        <Text style={styles.statLabel}>{t('shipmentHistory.statDelivered')}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statChip}>
                        <Text style={styles.statValue}>{activeCount}</Text>
                        <Text style={styles.statLabel}>{t('shipmentHistory.statActive')}</Text>
                    </View>
                </View>
            </LinearGradient>

            <View style={styles.filterWrap}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={filters}
                    keyExtractor={f => f.key}
                    contentContainerStyle={styles.filterRow}
                    bounces={false}
                    overScrollMode="never"
                    renderItem={({ item }) => {
                        const active = filter === item.key;
                        return (
                            <Pressable style={[styles.chip, active && styles.chipActive]} onPress={() => setFilter(item.key)}>
                                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.label}</Text>
                                <View style={[styles.chipCount, active && styles.chipCountActive]}>
                                    <Text style={[styles.chipCountText, active && styles.chipCountTextActive]}>
                                        {counts[item.key] ?? 0}
                                    </Text>
                                </View>
                            </Pressable>
                        );
                    }}
                />
            </View>

            <AsyncState
                isLoading={isLoading}
                error={error}
                onRetry={refetch}
                isEmpty={filtered.length === 0}
                emptyVariant="package"
                emptyTitle={t('shipmentHistory.emptyTitle')}
                emptyMessage={t('shipmentHistory.emptyMessage')}
            >
                <FlatList
                    data={filtered}
                    keyExtractor={item => item.id}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                    overScrollMode="never"
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => (
                        <Row
                            shipment={item}
                            statusColor={statusColor[item.status]}
                            statusText={statusLabel[item.status]}
                            onPress={() => (navigation as any).navigate('ShipmentDetailsScreen', { id: item.id })}
                            styles={styles}
                        />
                    )}
                />
            </AsyncState>
        </View>
    );
};

const Row: React.FC<{
    shipment: Shipment;
    statusColor: string;
    statusText: string;
    onPress: () => void;
    styles: ReturnType<typeof makeStyles>;
}> = ({ shipment, statusColor, statusText, onPress, styles }) => (
    <Animated.View entering={FadeIn.duration(160)}>
        <Pressable style={styles.row} onPress={onPress}>
            <View style={[styles.rowIcon, { backgroundColor: `${statusColor}1A` }]}>
                <Package color={statusColor} size={18} />
            </View>
            <View style={styles.rowBody}>
                <View style={styles.rowTopLine}>
                    <Text style={styles.trackingId} numberOfLines={1}>{shipment.trackingId}</Text>
                    <Text style={styles.price}>₹{shipment.price}</Text>
                </View>
                <Text style={styles.route} numberOfLines={1}>{shipment.from} → {shipment.to}</Text>
                <View style={styles.rowBottomLine}>
                    <View style={[styles.statusBadge, { backgroundColor: `${statusColor}1A` }]}>
                        <Text style={[styles.statusBadgeText, { color: statusColor }]}>{statusText}</Text>
                    </View>
                    <Text style={styles.date}>{new Date(shipment.createdAt).toLocaleDateString()}</Text>
                </View>
            </View>
            <ArrowRight size={16} color={styles.rowIconColor.color} />
        </Pressable>
    </Animated.View>
);

export default ShipmentHistoryScreen;

const makeStyles = (
    colors: ReturnType<typeof useAppTheme>['colors'],
    fonts: ReturnType<typeof useAppTheme>['fonts'],
    spacing: ReturnType<typeof useAppTheme>['spacing'],
    radius: ReturnType<typeof useAppTheme>['radius'],
) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.BACKGROUND },
        header: { paddingTop: 54, paddingBottom: spacing.lg, paddingHorizontal: spacing.lg },
        backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
        headerTitle: { fontSize: 22, fontFamily: fonts.BOLD_PRIMARY, color: '#fff', marginTop: 8 },
        headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
        statsRow: {
            flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)',
            borderRadius: radius.lg, marginTop: spacing.lg, paddingVertical: 12,
        },
        statChip: { flex: 1, alignItems: 'center' },
        statValue: { fontSize: 18, fontFamily: fonts.BOLD_PRIMARY, color: '#fff' },
        statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
        statDivider: { width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.25)' },
        filterWrap: { backgroundColor: colors.SURFACE, borderBottomWidth: 1, borderBottomColor: colors.BORDER },
        filterRow: { gap: 8, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
        chip: {
            flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 32,
            borderRadius: 999, backgroundColor: colors.BACKGROUND, borderWidth: 1, borderColor: colors.BORDER,
        },
        chipActive: { backgroundColor: colors.PRIMARY, borderColor: colors.PRIMARY },
        chipText: { fontSize: 12, fontFamily: fonts.SEMI_BOLD_PRIMARY, color: colors.TEXT_SECONDARY },
        chipTextActive: { color: '#fff' },
        chipCount: { backgroundColor: colors.SURFACE, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1 },
        chipCountActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
        chipCountText: { fontSize: 10, fontFamily: fonts.BOLD_PRIMARY, color: colors.TEXT_SECONDARY },
        chipCountTextActive: { color: '#fff' },
        listContent: { padding: spacing.lg, gap: 10 },
        row: {
            flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.SURFACE,
            borderRadius: radius.lg, borderWidth: 1, borderColor: colors.BORDER, padding: 12,
        },
        rowIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
        rowIconColor: { color: colors.TEXT_SECONDARY },
        rowBody: { flex: 1 },
        rowTopLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
        trackingId: { fontSize: 13, fontFamily: fonts.BOLD_PRIMARY, color: colors.TEXT_PRIMARY, flexShrink: 1 },
        price: { fontSize: 13, fontFamily: fonts.BOLD_PRIMARY, color: colors.TEXT_PRIMARY },
        route: { fontSize: 12, color: colors.TEXT_SECONDARY, marginTop: 2 },
        rowBottomLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
        statusBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
        statusBadgeText: { fontSize: 10, fontFamily: fonts.SEMI_BOLD_PRIMARY },
        date: { fontSize: 11, color: colors.TEXT_SECONDARY },
    });
