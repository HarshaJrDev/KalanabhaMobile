import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeOut,
    LinearTransition,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { ChevronDown, ChevronUp, Columns3, List as ListIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@theme/ThemeContext';
import { AppBottomSheet, type AppBottomSheetRef } from '@components/ui/AppBottomSheet';
import VehicleVisual from '@components/VehicleVisual';
import type { VehicleConfig } from '@features/settings/types';
import { cmToFt, formatFt3 } from '@utils/vehicleUnits';

interface Props {
    visible: boolean;
    onClose: () => void;
    vehicles: VehicleConfig[];
    selectedName: string;
    onSelect: (vehicle: VehicleConfig) => void;
}

type Mode = 'list' | 'compare';

const HEAVY_CARGO_THRESHOLD_KG = 10_000;
const STAGGER_MS = 55;

const ft1 = (cm: number): string => {
    const ft = cmToFt(cm);
    return ft % 1 === 0 ? ft.toFixed(0) : ft.toFixed(1);
};

const formatCapacity = (maxWeightKg: number): string =>
    maxWeightKg >= 1000 ? `${(maxWeightKg / 1000).toFixed(maxWeightKg % 1000 === 0 ? 0 : 1)} T` : `${maxWeightKg} kg`;

// Shared press-scale wrapper — every tappable card/row in this screen uses
// the same spring feel (matches VehicleSelectCards' Card) instead of a flat
// opacity change, so selecting a vehicle here feels like the rest of the
// booking flow rather than a plain settings-style list.
const Scalable: React.FC<{ onPress: () => void; style?: any; children: React.ReactNode }> = ({ onPress, style, children }) => {
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
    return (
        <Pressable
            onPressIn={() => { scale.value = withSpring(0.97, { damping: 18, stiffness: 240 }); }}
            onPressOut={() => { scale.value = withSpring(1, { damping: 18, stiffness: 240 }); }}
            onPress={onPress}
        >
            <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
        </Pressable>
    );
};

export const VehicleSelectionModal: React.FC<Props> = ({ visible, onClose, vehicles, selectedName, onSelect }) => {
    const { colors, fonts, spacing, radius } = useAppTheme();
    const { t } = useTranslation();
    const styles = useMemo(() => makeStyles(colors, fonts, spacing, radius), [colors, fonts, spacing, radius]);
    const [mode, setMode] = useState<Mode>('list');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const sheetRef = useRef<AppBottomSheetRef>(null);

    useEffect(() => {
        if (visible) sheetRef.current?.present();
        else sheetRef.current?.dismiss();
    }, [visible]);

    const bestValueId = useMemo(() => {
        if (vehicles.length === 0) return null;
        return vehicles.reduce((best, v) => (v.ratePerKm < best.ratePerKm ? v : best), vehicles[0]).id;
    }, [vehicles]);

    const badgeFor = (vehicle: VehicleConfig): string | null => {
        if (vehicle.id === bestValueId) return t('addOrder.vehicleBadgeBestValue');
        if (vehicle.maxWeight >= HEAVY_CARGO_THRESHOLD_KG) return t('addOrder.vehicleBadgeHeavyCargo');
        return null;
    };

    const commit = (vehicle: VehicleConfig) => {
        onSelect(vehicle);
        onClose();
    };

    const switchMode = (next: Mode) => {
        if (next === mode) return;
        setExpandedId(null);
        setMode(next);
    };

    return (
        <AppBottomSheet ref={sheetRef} onDismiss={onClose} snapPoints={['70%', '92%']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{t('addOrder.chooseVehicleTitle')}</Text>
            </View>

            <View style={styles.modeRow}>
                <Animated.View layout={LinearTransition.duration(200)} style={[styles.modeBtn, mode === 'list' && styles.modeBtnActive]}>
                    <Pressable style={styles.modeBtnInner} onPress={() => switchMode('list')}>
                        <ListIcon size={15} color={mode === 'list' ? colors.PRIMARY : colors.TEXT_SECONDARY} />
                        <Text style={[styles.modeBtnText, mode === 'list' && styles.modeBtnTextActive]}>
                            {t('addOrder.vehicleModeList')}
                        </Text>
                    </Pressable>
                </Animated.View>
                <Animated.View layout={LinearTransition.duration(200)} style={[styles.modeBtn, mode === 'compare' && styles.modeBtnActive]}>
                    <Pressable style={styles.modeBtnInner} onPress={() => switchMode('compare')}>
                        <Columns3 size={15} color={mode === 'compare' ? colors.PRIMARY : colors.TEXT_SECONDARY} />
                        <Text style={[styles.modeBtnText, mode === 'compare' && styles.modeBtnTextActive]}>
                            {t('addOrder.vehicleModeCompare')}
                        </Text>
                    </Pressable>
                </Animated.View>
            </View>

            {mode === 'list' ? (
                <BottomSheetScrollView key="list" contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
                    {vehicles.map((vehicle, index) => {
                        const isSelected = selectedName.toLowerCase() === vehicle.name.toLowerCase();
                        const isExpanded = expandedId === vehicle.id;
                        const badge = badgeFor(vehicle);
                        return (
                            <Animated.View
                                key={vehicle.id}
                                entering={FadeInDown.delay(index * STAGGER_MS).duration(280).springify().damping(18)}
                                layout={LinearTransition.duration(220)}
                                style={[styles.row, isSelected && styles.rowActive]}
                            >
                                <Scalable style={styles.rowMain} onPress={() => commit(vehicle)}>
                                    <VehicleVisual
                                        vehicle={vehicle}
                                        size={52}
                                        iconSize={28}
                                        borderRadius={12}
                                        backgroundColor="transparent"
                                        iconColor={isSelected ? colors.PRIMARY : colors.TEXT_SECONDARY}
                                    />
                                    <View style={styles.rowInfo}>
                                        <View style={styles.rowNameLine}>
                                            <Text style={styles.rowName} numberOfLines={1}>{vehicle.name}</Text>
                                            {badge && (
                                                <Animated.View entering={FadeIn.duration(200)} style={styles.rowBadge}>
                                                    <Text style={styles.rowBadgeText}>{badge}</Text>
                                                </Animated.View>
                                            )}
                                        </View>
                                        <Text style={styles.rowDesc} numberOfLines={1}>
                                            {formatCapacity(vehicle.maxWeight)} · ₹{vehicle.ratePerKm}/km
                                        </Text>
                                    </View>
                                    <View style={[styles.radio, isSelected && styles.radioActive]}>
                                        {isSelected && (
                                            <Animated.View entering={FadeIn.duration(150)} style={styles.radioDot} />
                                        )}
                                    </View>
                                </Scalable>
                                <Pressable
                                    style={styles.detailToggle}
                                    onPress={() => setExpandedId(isExpanded ? null : vehicle.id)}
                                    hitSlop={8}
                                >
                                    <Text style={styles.detailToggleText}>{t('addOrder.vehicleDetails')}</Text>
                                    {isExpanded ? (
                                        <ChevronUp size={14} color={colors.TEXT_SECONDARY} />
                                    ) : (
                                        <ChevronDown size={14} color={colors.TEXT_SECONDARY} />
                                    )}
                                </Pressable>
                                {isExpanded && (
                                    <Animated.View
                                        entering={FadeIn.duration(180)}
                                        exiting={FadeOut.duration(120)}
                                        layout={LinearTransition.duration(200)}
                                        style={styles.detailBox}
                                    >
                                        <DetailLine label={t('addOrder.vehicleSpecDimensions')} value={`${ft1(vehicle.maxLength)}L × ${ft1(vehicle.maxWidth)}W × ${ft1(vehicle.maxHeight)}H ft`} styles={styles} />
                                        <DetailLine label={t('addOrder.vehicleSpecVolume')} value={formatFt3(vehicle.maxVolume)} styles={styles} />
                                        <DetailLine label={t('addOrder.vehicleSpecBaseRate')} value={`₹${vehicle.baseRate}`} styles={styles} />
                                        <DetailLine label={t('addOrder.vehicleSpecRatePerKm')} value={`₹${vehicle.ratePerKm}/km`} styles={styles} />
                                        {vehicle.specialConditions.length > 0 && (
                                            <View style={styles.detailTagsRow}>
                                                {vehicle.specialConditions.map(tag => (
                                                    <View key={tag} style={styles.detailTag}>
                                                        <Text style={styles.detailTagText}>{tag}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        )}
                                    </Animated.View>
                                )}
                            </Animated.View>
                        );
                    })}
                </BottomSheetScrollView>
            ) : (
                <ScrollView key="compare" horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.compareContent}>
                    {vehicles.map((vehicle, index) => {
                        const isSelected = selectedName.toLowerCase() === vehicle.name.toLowerCase();
                        const badge = badgeFor(vehicle);
                        return (
                            <Animated.View
                                key={vehicle.id}
                                entering={FadeInDown.delay(index * STAGGER_MS).duration(280).springify().damping(18)}
                                layout={LinearTransition.duration(220)}
                                style={[styles.compareCard, isSelected && styles.compareCardActive]}
                            >
                                {badge && (
                                    <Animated.View entering={FadeIn.duration(200)} style={styles.compareBadge}>
                                        <Text style={styles.rowBadgeText}>{badge}</Text>
                                    </Animated.View>
                                )}
                                <VehicleVisual
                                    vehicle={vehicle}
                                    size={64}
                                    iconSize={34}
                                    borderRadius={14}
                                    backgroundColor="transparent"
                                    iconColor={isSelected ? colors.PRIMARY : colors.TEXT_SECONDARY}
                                />
                                <Text style={styles.compareName} numberOfLines={1}>{vehicle.name}</Text>
                                <DetailLine label={t('addOrder.vehicleSpecCapacity')} value={formatCapacity(vehicle.maxWeight)} styles={styles} stacked />
                                <DetailLine label={t('addOrder.vehicleSpecDimensions')} value={`${ft1(vehicle.maxLength)}×${ft1(vehicle.maxWidth)}×${ft1(vehicle.maxHeight)} ft`} styles={styles} stacked />
                                <DetailLine label={t('addOrder.vehicleSpecVolume')} value={formatFt3(vehicle.maxVolume)} styles={styles} stacked />
                                <DetailLine label={t('addOrder.vehicleSpecBaseRate')} value={`₹${vehicle.baseRate}`} styles={styles} stacked />
                                <DetailLine label={t('addOrder.vehicleSpecRatePerKm')} value={`₹${vehicle.ratePerKm}/km`} styles={styles} stacked />
                                {vehicle.specialConditions.length > 0 && (
                                    <View style={styles.detailTagsRow}>
                                        {vehicle.specialConditions.slice(0, 3).map(tag => (
                                            <View key={tag} style={styles.detailTag}>
                                                <Text style={styles.detailTagText} numberOfLines={1}>{tag}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}
                                <Scalable style={styles.compareSelectBtn} onPress={() => commit(vehicle)}>
                                    <Text style={styles.compareSelectBtnText}>
                                        {isSelected ? t('addOrder.vehicleSelected') : t('addOrder.vehicleSelect')}
                                    </Text>
                                </Scalable>
                            </Animated.View>
                        );
                    })}
                </ScrollView>
            )}
        </AppBottomSheet>
    );
};

const DetailLine: React.FC<{ label: string; value: string; styles: ReturnType<typeof makeStyles>; stacked?: boolean }> = ({ label, value, styles, stacked }) => (
    <View style={stacked ? styles.detailLineStacked : styles.detailLine}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue} numberOfLines={1}>{value}</Text>
    </View>
);

export default VehicleSelectionModal;

const makeStyles = (
    colors: ReturnType<typeof useAppTheme>['colors'],
    fonts: ReturnType<typeof useAppTheme>['fonts'],
    spacing: ReturnType<typeof useAppTheme>['spacing'],
    radius: ReturnType<typeof useAppTheme>['radius'],
) =>
    StyleSheet.create({
        header: {
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingBottom: spacing.md,
        },
        headerTitle: { fontFamily: fonts.BOLD_PRIMARY, fontSize: 17, color: colors.TEXT_PRIMARY },
        modeRow: {
            flexDirection: 'row', gap: 8, paddingBottom: spacing.sm,
            borderBottomWidth: 1, borderBottomColor: colors.BORDER,
        },
        modeBtn: {
            borderRadius: radius.md, backgroundColor: colors.BACKGROUND, overflow: 'hidden',
        },
        modeBtnInner: {
            flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14,
        },
        modeBtnActive: { backgroundColor: colors.PRIMARY_LIGHT },
        modeBtnText: { fontSize: 13, fontFamily: fonts.SEMI_BOLD_PRIMARY, color: colors.TEXT_SECONDARY },
        modeBtnTextActive: { color: colors.PRIMARY },
        listContent: { paddingTop: spacing.md, paddingBottom: 12, gap: 10 },
        row: {
            borderWidth: 1.5, borderColor: colors.BORDER, borderRadius: radius.lg,
            backgroundColor: colors.SURFACE, padding: 12,
        },
        rowActive: { borderColor: colors.PRIMARY, backgroundColor: colors.PRIMARY_LIGHT },
        rowMain: { flexDirection: 'row', alignItems: 'center', gap: 12 },
        rowInfo: { flex: 1 },
        rowNameLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
        rowName: { fontSize: 14, fontFamily: fonts.BOLD_PRIMARY, color: colors.TEXT_PRIMARY, flexShrink: 1 },
        rowBadge: { backgroundColor: colors.PRIMARY, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
        rowBadgeText: { fontSize: 9, fontFamily: fonts.SEMI_BOLD_PRIMARY, color: '#fff' },
        rowDesc: { fontSize: 12, color: colors.TEXT_SECONDARY, marginTop: 2 },
        radio: {
            width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.BORDER,
            alignItems: 'center', justifyContent: 'center',
        },
        radioActive: { borderColor: colors.PRIMARY },
        radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.PRIMARY },
        detailToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10, alignSelf: 'flex-start' },
        detailToggleText: { fontSize: 11, fontFamily: fonts.SEMI_BOLD_PRIMARY, color: colors.TEXT_SECONDARY },
        detailBox: { marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.BORDER, gap: 6 },
        detailLine: { flexDirection: 'row', justifyContent: 'space-between' },
        detailLineStacked: { marginTop: 6 },
        detailLabel: { fontSize: 11, color: colors.TEXT_SECONDARY },
        detailValue: { fontSize: 11, fontFamily: fonts.SEMI_BOLD_PRIMARY, color: colors.TEXT_PRIMARY, marginTop: 1 },
        detailTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 },
        detailTag: { backgroundColor: colors.BACKGROUND, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
        detailTagText: { fontSize: 9, fontFamily: fonts.SEMI_BOLD_PRIMARY, color: colors.TEXT_SECONDARY },
        compareContent: { paddingTop: spacing.md, paddingBottom: 12, paddingRight: spacing.lg, gap: 10 },
        compareCard: {
            width: 170, borderWidth: 1.5, borderColor: colors.BORDER, borderRadius: radius.lg,
            backgroundColor: colors.SURFACE, padding: 14, alignItems: 'center', marginTop: 8,
        },
        compareCardActive: { borderColor: colors.PRIMARY, backgroundColor: colors.PRIMARY_LIGHT },
        compareBadge: {
            position: 'absolute', top: -8, alignSelf: 'center', backgroundColor: colors.PRIMARY,
            borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, zIndex: 1,
        },
        compareName: { fontSize: 14, fontFamily: fonts.BOLD_PRIMARY, color: colors.TEXT_PRIMARY, marginTop: 6 },
        compareSelectBtn: {
            marginTop: 12, backgroundColor: colors.PRIMARY, borderRadius: radius.md,
            paddingVertical: 8, paddingHorizontal: 16, alignSelf: 'stretch', alignItems: 'center',
        },
        compareSelectBtnText: { fontSize: 12, fontFamily: fonts.SEMI_BOLD_PRIMARY, color: '#fff' },
    });
