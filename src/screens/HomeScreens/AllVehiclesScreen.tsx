import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, TextInput } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import {
    ArrowLeft,
    ArrowRight,
    ArrowUpDown,
    Box,
    Check,
    Container as ContainerIcon,
    Ruler,
    Search,
    Settings,
    Truck,
    Weight,
} from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@theme/ThemeContext';
import VehicleVisual from '@components/VehicleVisual';
import type { RootStackParamList } from '../navigation/types';
import type { VehicleConfig } from '@features/settings/types';
import { formatFt } from '@utils/vehicleUnits';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AllVehicles'>;
type AllVehiclesRouteProp = RouteProp<RootStackParamList, 'AllVehicles'>;

const HEAVY_CARGO_THRESHOLD_KG = 10_000;

type CategoryKey = 'all' | 'truck' | 'container' | 'heavy' | 'special';

// Derived from real fields already on VehicleConfig (name, maxWeight) —
// there's no admin-set "category" column, so this classifies instead of
// fabricating one. A name containing "container" wins first (it's a body
// type, not a weight class), heavy-tonnage wins next even over a
// "truck"-named vehicle (Heavy Haul Truck), specialized equipment by name
// third, everything else is a plain truck.
const categoryOf = (v: VehicleConfig): CategoryKey => {
    const name = v.name.toLowerCase();
    if (name.includes('container')) return 'container';
    if (v.maxWeight >= HEAVY_CARGO_THRESHOLD_KG) return 'heavy';
    if (name.includes('refrigerated') || name.includes('tanker')) return 'special';
    return 'truck';
};

type SortMode = 'default' | 'priceAsc' | 'priceDesc';

const formatCapacity = (maxWeightKg: number): string =>
    maxWeightKg >= 1000 ? `${(maxWeightKg / 1000).toFixed(maxWeightKg % 1000 === 0 ? 0 : 1)} T` : `${maxWeightKg} kg`;

export const AllVehiclesScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<AllVehiclesRouteProp>();
    const { t } = useTranslation();
    const { colors, fonts, spacing, radius } = useAppTheme();
    const styles = useMemo(() => makeStyles(colors, fonts, spacing, radius), [colors, fonts, spacing, radius]);

    const { vehicles, selectedName, onConfirm } = route.params;
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState<CategoryKey>('all');
    const [sort, setSort] = useState<SortMode>('default');

    const bestValueId = useMemo(() => {
        if (vehicles.length === 0) return null;
        return vehicles.reduce((best, v) => (v.ratePerKm < best.ratePerKm ? v : best), vehicles[0]).id;
    }, [vehicles]);

    const badgeFor = (vehicle: VehicleConfig): string | null => {
        if (vehicle.id === bestValueId) return t('addOrder.vehicleBadgeBestValue');
        if (vehicle.maxWeight >= HEAVY_CARGO_THRESHOLD_KG) return t('addOrder.vehicleBadgeHeavyCargo');
        return null;
    };

    const categoryCounts = useMemo(() => {
        const counts: Record<CategoryKey, number> = { all: vehicles.length, truck: 0, container: 0, heavy: 0, special: 0 };
        vehicles.forEach(v => { counts[categoryOf(v)] += 1; });
        return counts;
    }, [vehicles]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        let list = vehicles.filter(v => (category === 'all' || categoryOf(v) === category) && (!q || v.name.toLowerCase().includes(q)));
        if (sort === 'priceAsc') list = [...list].sort((a, b) => a.baseRate - b.baseRate);
        if (sort === 'priceDesc') list = [...list].sort((a, b) => b.baseRate - a.baseRate);
        return list;
    }, [vehicles, query, category, sort]);

    const cycleSort = () => {
        setSort(prev => (prev === 'default' ? 'priceAsc' : prev === 'priceAsc' ? 'priceDesc' : 'default'));
    };

    const openDetails = (vehicle: VehicleConfig) => {
        navigation.navigate('VehicleDetails', {
            vehicleId: vehicle.id,
            vehicles,
            onConfirm,
            popCount: 2,
        });
    };

    const CATEGORIES: { key: CategoryKey; label: string; icon: React.ElementType }[] = [
        { key: 'all', label: t('vehicleDetails.categoryAll'), icon: Check },
        { key: 'truck', label: t('vehicleDetails.categoryTruck'), icon: Truck },
        { key: 'container', label: t('vehicleDetails.categoryContainer'), icon: ContainerIcon },
        { key: 'heavy', label: t('addOrder.vehicleBadgeHeavyCargo'), icon: Weight },
        { key: 'special', label: t('vehicleDetails.categorySpecial'), icon: Settings },
    ];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
                    <ArrowLeft color="#fff" size={22} />
                </Pressable>
                <Text style={styles.headerTitle}>{t('vehicleDetails.allVehiclesTitle')}</Text>
                <Text style={styles.headerSub}>{t('vehicleDetails.allVehiclesSubtitle')}</Text>
            </View>

            <View style={styles.toolbar}>
                <View style={styles.searchBar}>
                    <Search size={16} color={colors.TEXT_SECONDARY} />
                    <TextInput
                        style={styles.searchInput}
                        value={query}
                        onChangeText={setQuery}
                        placeholder={t('vehicleDetails.searchPlaceholder')}
                        placeholderTextColor={colors.TEXT_SECONDARY}
                        returnKeyType="search"
                    />
                </View>
                <Pressable style={[styles.sortBtn, sort !== 'default' && styles.sortBtnActive]} onPress={cycleSort}>
                    <ArrowUpDown size={15} color={sort !== 'default' ? colors.PRIMARY : colors.TEXT_SECONDARY} />
                    <Text style={[styles.sortBtnText, sort !== 'default' && styles.sortBtnTextActive]}>
                        {sort === 'priceAsc' ? t('vehicleDetails.sortPriceAsc') : sort === 'priceDesc' ? t('vehicleDetails.sortPriceDesc') : t('vehicleDetails.sort')}
                    </Text>
                </Pressable>
            </View>

            <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={CATEGORIES}
                keyExtractor={c => c.key}
                contentContainerStyle={styles.chipsRow}
                bounces={false}
                overScrollMode="never"
                renderItem={({ item }) => {
                    const active = category === item.key;
                    const Icon = item.icon;
                    const count = categoryCounts[item.key];
                    if (item.key !== 'all' && count === 0) return null;
                    return (
                        <Pressable style={[styles.chip, active && styles.chipActive]} onPress={() => setCategory(item.key)}>
                            <Icon size={14} color={active ? '#fff' : colors.TEXT_SECONDARY} />
                            <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.label}</Text>
                        </Pressable>
                    );
                }}
            />

            <FlatList
                data={filtered}
                keyExtractor={v => v.id}
                numColumns={2}
                columnWrapperStyle={styles.row}
                contentContainerStyle={styles.gridContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
                overScrollMode="never"
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>{t('vehicleDetails.noVehiclesMatch')}</Text>
                    </View>
                }
                renderItem={({ item }) => {
                    const isSelected = selectedName?.toLowerCase() === item.name.toLowerCase();
                    const badge = badgeFor(item);
                    const bodyType = item.specialConditions[0] ?? '—';
                    return (
                        <Animated.View entering={FadeIn.duration(180)} style={styles.cardWrap}>
                            <Pressable
                                style={[styles.card, isSelected && styles.cardActive]}
                                onPress={() => openDetails(item)}
                            >
                                {isSelected && (
                                    <View style={styles.selectedDot}>
                                        <Check size={12} color="#fff" strokeWidth={3} />
                                    </View>
                                )}
                                {!isSelected && badge && (
                                    <View style={[styles.badge, badge === t('addOrder.vehicleBadgeHeavyCargo') && styles.badgeHeavy]}>
                                        <Text style={styles.badgeText} numberOfLines={1}>{badge}</Text>
                                    </View>
                                )}
                                <View style={styles.imageWrap}>
                                    <VehicleVisual
                                        vehicle={item}
                                        size={120}
                                        width="100%"
                                        height={110}
                                        iconSize={44}
                                        borderRadius={0}
                                        backgroundColor="transparent"
                                        iconColor={colors.PRIMARY}
                                    />
                                </View>
                                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                                <Text style={styles.desc} numberOfLines={1}>
                                    {item.specialConditions.slice(0, 2).join(', ') || t('vehicleDetails.generalPurpose')}
                                </Text>

                                <View style={styles.specRow}>
                                    <View style={styles.specCol}>
                                        <Weight size={12} color={colors.TEXT_SECONDARY} />
                                        <Text style={styles.specValue} numberOfLines={1}>{formatCapacity(item.maxWeight)}</Text>
                                        <Text style={styles.specLabel}>{t('addOrder.vehicleSpecCapacity')}</Text>
                                    </View>
                                    <View style={styles.specCol}>
                                        <Box size={12} color={colors.TEXT_SECONDARY} />
                                        <Text style={styles.specValue} numberOfLines={1}>{bodyType}</Text>
                                        <Text style={styles.specLabel}>{t('vehicleDetails.bodyType')}</Text>
                                    </View>
                                    <View style={styles.specCol}>
                                        <Ruler size={12} color={colors.TEXT_SECONDARY} />
                                        <Text style={styles.specValue} numberOfLines={1}>{formatFt(item.maxLength)}</Text>
                                        <Text style={styles.specLabel}>{t('vehicleDetails.lengthLabel')}</Text>
                                    </View>
                                </View>

                                <View style={styles.footerRow}>
                                    <Text style={styles.price}>₹{item.baseRate}</Text>
                                    <View style={styles.arrowBtn}>
                                        <ArrowRight size={16} color={colors.PRIMARY} />
                                    </View>
                                </View>
                            </Pressable>
                        </Animated.View>
                    );
                }}
            />
        </View>
    );
};

export default AllVehiclesScreen;

const makeStyles = (
    colors: ReturnType<typeof useAppTheme>['colors'],
    fonts: ReturnType<typeof useAppTheme>['fonts'],
    spacing: ReturnType<typeof useAppTheme>['spacing'],
    radius: ReturnType<typeof useAppTheme>['radius'],
) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.BACKGROUND },
        header: { backgroundColor: colors.PRIMARY, paddingTop: 54, paddingBottom: 28, paddingHorizontal: spacing.lg },
        backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
        headerTitle: { fontSize: 24, fontFamily: fonts.BOLD_PRIMARY, color: '#fff' },
        headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
        toolbar: { flexDirection: 'row', gap: 10, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
        searchBar: {
            flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.SURFACE,
            borderRadius: 999, borderWidth: 1, borderColor: colors.BORDER, paddingHorizontal: 14, height: 44,
        },
        searchInput: { flex: 1, fontSize: 13, color: colors.TEXT_PRIMARY, padding: 0 },
        sortBtn: {
            flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 44,
            borderRadius: 999, borderWidth: 1, borderColor: colors.BORDER, backgroundColor: colors.SURFACE,
        },
        sortBtnActive: { borderColor: colors.PRIMARY, backgroundColor: colors.PRIMARY_LIGHT },
        sortBtnText: { fontSize: 12, fontFamily: fonts.SEMI_BOLD_PRIMARY, color: colors.TEXT_SECONDARY },
        sortBtnTextActive: { color: colors.PRIMARY },
        chipsRow: { gap: 8, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
        chip: {
            flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 36,
            borderRadius: 999, backgroundColor: colors.SURFACE, borderWidth: 1, borderColor: colors.BORDER,
        },
        chipActive: { backgroundColor: colors.PRIMARY, borderColor: colors.PRIMARY },
        chipText: { fontSize: 12, fontFamily: fonts.SEMI_BOLD_PRIMARY, color: colors.TEXT_SECONDARY },
        chipTextActive: { color: '#fff' },
        gridContent: { padding: spacing.lg, paddingTop: 4, gap: 12 },
        row: { gap: 12 },
        cardWrap: { flex: 1 },
        card: {
            borderWidth: 1.5, borderColor: colors.BORDER, borderRadius: radius.lg,
            backgroundColor: colors.SURFACE, padding: 12, position: 'relative',
        },
        cardActive: { borderColor: colors.PRIMARY, backgroundColor: colors.PRIMARY_LIGHT },
        selectedDot: {
            position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderRadius: 11,
            backgroundColor: colors.PRIMARY, alignItems: 'center', justifyContent: 'center', zIndex: 1,
        },
        badge: {
            position: 'absolute', top: 10, right: 10, backgroundColor: colors.SUCCESS,
            borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, zIndex: 1, maxWidth: '70%',
        },
        badgeHeavy: { backgroundColor: colors.TEXT_SECONDARY },
        badgeText: { fontSize: 9, fontFamily: fonts.SEMI_BOLD_PRIMARY, color: '#fff' },
        imageWrap: { width: '100%', height: 110 },
        name: { fontSize: 15, fontFamily: fonts.BOLD_PRIMARY, color: colors.TEXT_PRIMARY, marginTop: 8 },
        desc: { fontSize: 11, color: colors.TEXT_SECONDARY, marginTop: 2 },
        specRow: {
            flexDirection: 'row', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.BORDER,
        },
        specCol: { flex: 1, alignItems: 'flex-start', gap: 2 },
        specValue: { fontSize: 11, fontFamily: fonts.BOLD_PRIMARY, color: colors.TEXT_PRIMARY },
        specLabel: { fontSize: 9, color: colors.TEXT_SECONDARY },
        footerRow: {
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.BORDER,
        },
        price: { fontSize: 16, fontFamily: fonts.BOLD_PRIMARY, color: colors.PRIMARY },
        arrowBtn: {
            width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: colors.PRIMARY,
            alignItems: 'center', justifyContent: 'center',
        },
        emptyState: { paddingVertical: 48, alignItems: 'center' },
        emptyStateText: { fontSize: 13, color: colors.TEXT_SECONDARY },
    });
