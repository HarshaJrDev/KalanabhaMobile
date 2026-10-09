import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { ArrowLeft, Box, Check, ChevronRight, Ruler, Weight } from 'lucide-react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@theme/ThemeContext';
import VehicleVisual from '@components/VehicleVisual';
import VehicleSelectCards from '@components/VehicleSelectCards';
import type { RootStackParamList } from '../navigation/types';
import type { VehicleConfig } from '@features/settings/types';
import { formatFt, formatFt3 } from '@utils/vehicleUnits';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'VehicleDetails'>;
type VehicleDetailsRouteProp = RouteProp<RootStackParamList, 'VehicleDetails'>;

type Tab = 'dimensions' | 'load' | 'pricing';

const HEAVY_CARGO_THRESHOLD_KG = 10_000;

const formatCapacity = (maxWeightKg: number): string =>
    maxWeightKg >= 1000 ? `${(maxWeightKg / 1000).toFixed(maxWeightKg % 1000 === 0 ? 0 : 1)} T` : `${maxWeightKg} kg`;

export const VehicleDetailsScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<VehicleDetailsRouteProp>();
    const { t } = useTranslation();
    const { colors, fonts, spacing, radius } = useAppTheme();
    const styles = useMemo(() => makeStyles(colors, fonts, spacing, radius), [colors, fonts, spacing, radius]);

    const { vehicles, onConfirm, popCount } = route.params;
    const [activeId, setActiveId] = useState(route.params.vehicleId);
    const [tab, setTab] = useState<Tab>('dimensions');

    const vehicle = useMemo(
        () => vehicles.find(v => v.id === activeId) ?? vehicles[0],
        [vehicles, activeId],
    );

    const bestValueId = useMemo(() => {
        if (vehicles.length === 0) return null;
        return vehicles.reduce((best, v) => (v.ratePerKm < best.ratePerKm ? v : best), vehicles[0]).id;
    }, [vehicles]);

    const fleetMaxWeight = useMemo(
        () => (vehicles.length === 0 ? 0 : Math.max(...vehicles.map(v => v.maxWeight))),
        [vehicles],
    );

    const badge = vehicle?.id === bestValueId
        ? t('addOrder.vehicleBadgeBestValue')
        : vehicle && vehicle.maxWeight >= HEAVY_CARGO_THRESHOLD_KG
            ? t('addOrder.vehicleBadgeHeavyCargo')
            : null;

    const selectVehicle = (next: VehicleConfig) => {
        if (next.id === activeId) return;
        setTab('dimensions');
        setActiveId(next.id);
    };

    const handleConfirm = () => {
        if (!vehicle) return;
        onConfirm?.(vehicle);
        if (popCount && popCount > 1) {
            navigation.pop(popCount);
        } else {
            navigation.goBack();
        }
    };

    if (!vehicle) return null;

    return (
        <View style={styles.container}>
            <LinearGradient colors={[colors.PRIMARY, colors.PRIMARY_DARK ?? colors.PRIMARY]} style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
                    <ArrowLeft color="#fff" size={22} />
                </Pressable>
                <Text style={styles.headerTitle}>{t('vehicleDetails.title')}</Text>
                <Text style={styles.headerSub}>{t('vehicleDetails.subtitle')}</Text>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                <Animated.View key={vehicle.id} entering={FadeIn.duration(220)} layout={LinearTransition.duration(220)} style={styles.heroCard}>
                    <View style={styles.heroImageWrap}>
                        <VehicleVisual
                            vehicle={vehicle}
                            size={180}
                            width="100%"
                            height={160}
                            iconSize={72}
                            borderRadius={0}
                            backgroundColor="transparent"
                            iconColor={colors.PRIMARY}
                        />
                    </View>

                    <View style={styles.heroTopRow}>
                        <View style={styles.categoryChip}>
                            <Text style={styles.categoryChipText}>{t('vehicleDetails.categoryTruck')}</Text>
                        </View>
                        {badge && (
                            <View style={styles.popularChip}>
                                <Check size={12} color="#fff" strokeWidth={3} />
                                <Text style={styles.popularChipText}>{badge}</Text>
                            </View>
                        )}
                    </View>

                    <Text style={styles.vehicleName}>{vehicle.name}</Text>
                    {vehicle.specialConditions.length > 0 && (
                        <Text style={styles.vehicleDesc} numberOfLines={2}>
                            {t('vehicleDetails.idealFor', { items: vehicle.specialConditions.slice(0, 3).join(', ') })}
                        </Text>
                    )}

                    <View style={styles.specGrid}>
                        <SpecTile icon={Weight} label={t('addOrder.vehicleSpecCapacity')} value={formatCapacity(vehicle.maxWeight)} styles={styles} />
                        <SpecTile icon={Box} label={t('vehicleDetails.bodyType')} value={vehicle.specialConditions[0] ?? '—'} styles={styles} />
                        <SpecTile icon={Ruler} label={t('vehicleDetails.lengthLabel')} value={formatFt(vehicle.maxLength)} styles={styles} />
                    </View>

                    {vehicle.specialConditions.length > 0 && (
                        <>
                            <Text style={styles.sectionLabel}>{t('vehicleDetails.bestFor')}</Text>
                            <View style={styles.tagsWrap}>
                                {vehicle.specialConditions.map(tag => (
                                    <View key={tag} style={styles.tagChip}>
                                        <Check size={11} color={colors.PRIMARY} />
                                        <Text style={styles.tagChipText}>{tag}</Text>
                                    </View>
                                ))}
                            </View>
                        </>
                    )}
                </Animated.View>

                <View style={styles.tabRow}>
                    {([
                        { key: 'dimensions' as const, label: t('vehicleDetails.tabDimensions') },
                        { key: 'load' as const, label: t('vehicleDetails.tabLoadInfo') },
                        { key: 'pricing' as const, label: t('vehicleDetails.tabPricing') },
                    ]).map(item => {
                        const active = tab === item.key;
                        return (
                            <Pressable
                                key={item.key}
                                style={[styles.tabBtn, active && styles.tabBtnActive]}
                                onPress={() => setTab(item.key)}
                            >
                                <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]} numberOfLines={1}>
                                    {item.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>

                <Animated.View key={tab + vehicle.id} entering={FadeIn.duration(180)} layout={LinearTransition.duration(200)} style={styles.tabPanel}>
                    {tab === 'dimensions' && (
                        <>
                            <DetailRow label={t('vehicleDetails.length')} value={formatFt(vehicle.maxLength)} styles={styles} />
                            <DetailRow label={t('vehicleDetails.width')} value={formatFt(vehicle.maxWidth)} styles={styles} />
                            <DetailRow label={t('vehicleDetails.height')} value={formatFt(vehicle.maxHeight)} styles={styles} />
                            <DetailRow label={t('vehicleDetails.volume')} value={formatFt3(vehicle.maxVolume)} styles={styles} />
                        </>
                    )}
                    {tab === 'load' && (
                        <>
                            <DetailRow label={t('addOrder.vehicleSpecCapacity')} value={formatCapacity(vehicle.maxWeight)} styles={styles} />
                            {fleetMaxWeight > 0 && (
                                <View style={styles.capacityBarWrap}>
                                    <View style={styles.capacityBarTrack}>
                                        <View
                                            style={[
                                                styles.capacityBarFill,
                                                { width: `${Math.max(6, Math.round((vehicle.maxWeight / fleetMaxWeight) * 100))}%` },
                                            ]}
                                        />
                                    </View>
                                    <Text style={styles.capacityBarHint}>
                                        {t('vehicleDetails.capacityOfFleet', { percent: Math.round((vehicle.maxWeight / fleetMaxWeight) * 100) })}
                                    </Text>
                                </View>
                            )}
                            <DetailRow label={t('vehicleDetails.volume')} value={formatFt3(vehicle.maxVolume)} styles={styles} />
                            {vehicle.specialConditions.length > 0 && (
                                <DetailRow label={t('vehicleDetails.bodyType')} value={vehicle.specialConditions[0]} styles={styles} />
                            )}
                        </>
                    )}
                    {tab === 'pricing' && (
                        <>
                            <DetailRow label={t('addOrder.vehicleSpecBaseRate')} value={`₹${vehicle.baseRate}`} styles={styles} />
                            <DetailRow label={t('addOrder.vehicleSpecRatePerKm')} value={`₹${vehicle.ratePerKm}/km`} styles={styles} />
                        </>
                    )}
                </Animated.View>

                {vehicles.length > 1 && (
                    <Animated.View entering={FadeInDown.delay(80).duration(240)} style={styles.similarSection}>
                        <View style={styles.similarHeaderRow}>
                            <Text style={styles.sectionTitle}>{t('vehicleDetails.similarVehicles')}</Text>
                        </View>
                        <VehicleSelectCards
                            vehicles={vehicles}
                            selectedName={vehicle.name}
                            onSelect={selectVehicle}
                        />
                    </Animated.View>
                )}
            </ScrollView>

            <View style={styles.footer}>
                <View>
                    <Text style={styles.footerPrice}>₹{vehicle.baseRate}</Text>
                    <Text style={styles.footerPriceLabel}>{t('vehicleDetails.estimatedBaseFare')}</Text>
                </View>
                <Pressable style={styles.confirmBtn} onPress={handleConfirm}>
                    <Text style={styles.confirmBtnText}>{t('vehicleDetails.confirmVehicle')}</Text>
                    <ChevronRight size={18} color="#fff" />
                </Pressable>
            </View>
        </View>
    );
};

const SpecTile: React.FC<{ icon: React.ElementType; label: string; value: string; styles: ReturnType<typeof makeStyles> }> = ({ icon: Icon, label, value, styles }) => (
    <View style={styles.specTile}>
        <Icon size={16} color={styles.specIconColor.color} />
        <Text style={styles.specValue} numberOfLines={1}>{value}</Text>
        <Text style={styles.specLabel} numberOfLines={1}>{label}</Text>
    </View>
);

const DetailRow: React.FC<{ label: string; value: string; styles: ReturnType<typeof makeStyles> }> = ({ label, value, styles }) => (
    <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
    </View>
);

export default VehicleDetailsScreen;

const makeStyles = (
    colors: ReturnType<typeof useAppTheme>['colors'],
    fonts: ReturnType<typeof useAppTheme>['fonts'],
    spacing: ReturnType<typeof useAppTheme>['spacing'],
    radius: ReturnType<typeof useAppTheme>['radius'],
) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.BACKGROUND },
        header: { paddingTop: 54, paddingBottom: 28, paddingHorizontal: spacing.lg },
        backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
        headerTitle: { fontSize: 24, fontFamily: fonts.BOLD_PRIMARY, color: '#fff', marginTop: 10 },
        headerSub: { fontSize: 13, fontFamily: fonts.PRIMARY, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
        body: { padding: spacing.lg, paddingBottom: 12, gap: spacing.lg },
        heroCard: {
            backgroundColor: colors.SURFACE, borderRadius: radius.lg, marginTop: -40, overflow: 'hidden',
            shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
        },
        heroImageWrap: { height: 160, backgroundColor: colors.BACKGROUND },
        heroTopRow: {
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: spacing.lg, paddingTop: spacing.md,
        },
        categoryChip: { backgroundColor: colors.PRIMARY_LIGHT, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
        categoryChipText: { fontSize: 11, fontFamily: fonts.BOLD_PRIMARY, color: colors.PRIMARY, textTransform: 'uppercase', letterSpacing: 0.5 },
        popularChip: {
            flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.SUCCESS,
            borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4,
        },
        popularChipText: { fontSize: 11, fontFamily: fonts.BOLD_PRIMARY, color: '#fff' },
        vehicleName: { fontSize: 22, fontFamily: fonts.BOLD_PRIMARY, color: colors.TEXT_PRIMARY, marginTop: 10, paddingHorizontal: spacing.lg },
        vehicleDesc: { fontSize: 13, color: colors.TEXT_SECONDARY, marginTop: 4, paddingHorizontal: spacing.lg, lineHeight: 18 },
        specGrid: { flexDirection: 'row', gap: 8, marginTop: spacing.lg, paddingHorizontal: spacing.lg },
        specTile: {
            flex: 1, alignItems: 'center', gap: 4, paddingVertical: 12, borderRadius: radius.md,
            borderWidth: 1, borderColor: colors.BORDER,
        },
        specIconColor: { color: colors.PRIMARY },
        specValue: { fontSize: 13, fontFamily: fonts.BOLD_PRIMARY, color: colors.TEXT_PRIMARY },
        specLabel: { fontSize: 10, color: colors.TEXT_SECONDARY },
        sectionLabel: { fontSize: 13, fontFamily: fonts.BOLD_PRIMARY, color: colors.TEXT_PRIMARY, marginTop: spacing.lg, paddingHorizontal: spacing.lg },
        tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: spacing.lg, paddingTop: 8, paddingBottom: spacing.lg },
        tagChip: {
            flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.BACKGROUND,
            borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6,
        },
        tagChipText: { fontSize: 11, fontFamily: fonts.SEMI_BOLD_PRIMARY, color: colors.TEXT_PRIMARY },
        tabRow: { flexDirection: 'row', gap: 8 },
        tabBtn: {
            flex: 1, paddingVertical: 10, borderRadius: radius.md, alignItems: 'center',
            backgroundColor: colors.SURFACE, borderWidth: 1, borderColor: colors.BORDER,
        },
        tabBtnActive: { backgroundColor: colors.PRIMARY, borderColor: colors.PRIMARY },
        tabBtnText: { fontSize: 12, fontFamily: fonts.SEMI_BOLD_PRIMARY, color: colors.TEXT_SECONDARY },
        tabBtnTextActive: { color: '#fff' },
        tabPanel: {
            backgroundColor: colors.SURFACE, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.BORDER,
            padding: spacing.lg, gap: spacing.sm,
        },
        detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        detailLabel: { fontSize: 13, color: colors.TEXT_SECONDARY },
        detailValue: { fontSize: 13, fontFamily: fonts.BOLD_PRIMARY, color: colors.TEXT_PRIMARY },
        capacityBarWrap: { gap: 4, marginTop: -2 },
        capacityBarTrack: { height: 6, borderRadius: 3, backgroundColor: colors.BACKGROUND, overflow: 'hidden' },
        capacityBarFill: { height: 6, borderRadius: 3, backgroundColor: colors.PRIMARY },
        capacityBarHint: { fontSize: 11, color: colors.TEXT_SECONDARY },
        similarSection: { gap: spacing.sm },
        similarHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
        sectionTitle: { fontSize: 15, fontFamily: fonts.BOLD_PRIMARY, color: colors.TEXT_PRIMARY },
        footer: {
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: spacing.lg, paddingVertical: spacing.md, paddingBottom: spacing.lg,
            backgroundColor: colors.SURFACE, borderTopWidth: 1, borderTopColor: colors.BORDER,
        },
        footerPrice: { fontSize: 20, fontFamily: fonts.BOLD_PRIMARY, color: colors.TEXT_PRIMARY },
        footerPriceLabel: { fontSize: 11, color: colors.TEXT_SECONDARY },
        confirmBtn: {
            flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.PRIMARY,
            borderRadius: 999, paddingHorizontal: 22, paddingVertical: 14,
        },
        confirmBtnText: { fontSize: 14, fontFamily: fonts.BOLD_PRIMARY, color: '#fff' },
    });
