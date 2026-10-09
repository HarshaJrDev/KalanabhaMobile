



import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Reanimated, { useAnimatedStyle, interpolate, Extrapolate, type SharedValue } from 'react-native-reanimated';
import { ArrowRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { VehicleConfig } from '@features/settings/types';
import VehicleVisual from '@components/VehicleVisual';
import { HomeColors, HomeFonts, SPACING } from './theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
export const VEHICLE_CARD_WIDTH = SCREEN_WIDTH * 0.72;
export const VEHICLE_CARD_GAP = SPACING.m;

const HEAVY_CARGO_THRESHOLD_KG = 10_000;

type VehicleCardProps = {
    vehicle: VehicleConfig;
    index: number;
    isFirst: boolean;
    badge: string | null;
    cardWidth: number;
    cardStep: number;
    scrollX: SharedValue<number>;
    styles: ReturnType<typeof makeStyles>;
    colors: HomeColors;
    onPress: () => void;
};

const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, index, isFirst, badge, cardWidth, cardStep, scrollX, styles, colors: COLORS, onPress }) => {
    const { t } = useTranslation();
    const animatedStyle = useAnimatedStyle(() => {
        const center = index * cardStep;
        const scale = interpolate(scrollX.value, [center - cardStep, center, center + cardStep], [0.92, 1, 0.92], Extrapolate.CLAMP);
        const opacity = interpolate(scrollX.value, [center - cardStep, center, center + cardStep], [0.7, 1, 0.7], Extrapolate.CLAMP);
        return { transform: [{ scale }], opacity };
    });

    return (
        <Reanimated.View style={[{ width: cardWidth }, animatedStyle]}>
            <Pressable style={[styles.vehicleCard, isFirst && styles.vehicleCardFeatured]} onPress={onPress}>
                {}
                <View style={styles.bannerWrap}>
                    <VehicleVisual
                        vehicle={vehicle}
                        size={64}
                        width="100%"
                        height="100%"
                        borderRadius={0}
                        iconSize={40}
                        backgroundColor={COLORS.primaryLight}
                        iconColor={COLORS.primary}
                    />
                    {badge && (
                        <View style={styles.vehicleFastestTag}>
                            <Text style={styles.vehicleFastestTagText}>{badge}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.vehicleCardBody}>
                    <Text style={styles.vehicleLabel}>{vehicle.name}</Text>
                    <Text style={styles.vehicleDesc}>
                        {t('home.upToKg', { weight: vehicle.maxWeight })}
                        {vehicle.specialConditions.length > 0 ? ` · ${vehicle.specialConditions.join(', ')}` : ''}
                    </Text>
                    <View style={styles.vehicleFareRow}>
                        <View>
                            <Text style={styles.vehicleFareLabel}>{t('home.startingFare')}</Text>
                            <Text style={styles.vehicleFareValue}>{t('home.fromPrice', { price: Math.round(vehicle.baseRate) })}</Text>
                        </View>
                        <View style={styles.vehicleBookBtn}>
                            <Text style={styles.vehicleBookBtnText}>{t('home.viewVehicleDetails')}</Text>
                            <ArrowRight size={13} color="#fff" />
                        </View>
                    </View>
                </View>
            </Pressable>
        </Reanimated.View>
    );
};

interface Props {
    vehicles: VehicleConfig[];
    scrollX: SharedValue<number>;
    onScroll: (e: any) => void;
    onSelect: (vehicle: VehicleConfig) => void;
    onViewAll: () => void;
    colors: HomeColors;
    fonts: HomeFonts;
}

const QuickVehicleSelector: React.FC<Props> = ({ vehicles, scrollX, onScroll, onSelect, onViewAll, colors: COLORS, fonts: FONTS }) => {
    const styles = React.useMemo(() => makeStyles(COLORS, FONTS), [COLORS, FONTS]);
    const { t } = useTranslation();

    const bestValueId = React.useMemo(() => {
        if (vehicles.length === 0) return null;
        return vehicles.reduce((best, v) => (v.ratePerKm < best.ratePerKm ? v : best), vehicles[0]).id;
    }, [vehicles]);

    const badgeFor = (vehicle: VehicleConfig): string | null => {
        if (vehicle.id === bestValueId) return t('addOrder.vehicleBadgeBestValue');
        if (vehicle.maxWeight >= HEAVY_CARGO_THRESHOLD_KG) return t('addOrder.vehicleBadgeHeavyCargo');
        return null;
    };

    if (vehicles.length === 0) return null;

    return (
        <View style={styles.vehicleSection}>
            <View style={styles.vehicleSectionHeader}>
                <View>
                    <Text style={styles.sectionTitle}>{t('home.chooseYourVehicle')}</Text>
                    <Text style={styles.vehicleSectionSubtitle}>{t('home.realAdminRatesHint')}</Text>
                </View>
                <Pressable onPress={onViewAll} hitSlop={8}>
                    <Text style={styles.vehicleReadyText}>{t('vehicleDetails.viewAll')}</Text>
                </Pressable>
            </View>
            <Reanimated.ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={VEHICLE_CARD_WIDTH + VEHICLE_CARD_GAP}
                decelerationRate="fast"
                onScroll={onScroll}
                scrollEventThrottle={16}
                contentContainerStyle={{ paddingHorizontal: SPACING.xl, gap: VEHICLE_CARD_GAP }}
            >
                {vehicles.map((v, index) => (
                    <VehicleCard
                        key={v.id}
                        vehicle={v}
                        index={index}
                        isFirst={index === 0}
                        badge={badgeFor(v)}
                        cardWidth={VEHICLE_CARD_WIDTH}
                        cardStep={VEHICLE_CARD_WIDTH + VEHICLE_CARD_GAP}
                        scrollX={scrollX}
                        styles={styles}
                        colors={COLORS}
                        onPress={() => onSelect(v)}
                    />
                ))}
            </Reanimated.ScrollView>
        </View>
    );
};

export default QuickVehicleSelector;

const makeStyles = (COLORS: HomeColors, FONTS: HomeFonts) => StyleSheet.create({
    sectionTitle: { fontSize: 18, fontFamily: FONTS.BOLD_PRIMARY, color: COLORS.textPrimary, letterSpacing: 0.3 },
    vehicleSection: { marginBottom: SPACING.xxl + 4 },
    vehicleSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.l, paddingHorizontal: SPACING.xl },
    vehicleSectionSubtitle: { fontSize: 12, fontFamily: FONTS.PRIMARY, color: COLORS.textSecondary, marginTop: 2 },
    vehicleReadyText: { fontSize: 11, fontFamily: FONTS.BOLD_PRIMARY, color: COLORS.primary, marginTop: 4 },
    vehicleCard: {
        backgroundColor: COLORS.card, borderRadius: 20, overflow: 'hidden',
        borderWidth: 1, borderColor: COLORS.border,
        shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 14, elevation: 4,
    },
    vehicleCardFeatured: { borderColor: COLORS.primary },
    bannerWrap: { width: '100%', height: 132, position: 'relative' },
    vehicleFastestTag: { position: 'absolute', top: 0, right: 0, backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 5, borderBottomLeftRadius: 10 },
    vehicleFastestTagText: { color: '#fff', fontSize: 9, fontFamily: FONTS.BOLD_PRIMARY, letterSpacing: 0.3 },
    vehicleCardBody: { padding: 16 },
    vehicleLabel: { fontSize: 17, fontFamily: FONTS.BOLD_PRIMARY, color: COLORS.textPrimary, marginBottom: 8 },
    vehicleDesc: { fontSize: 12, fontFamily: FONTS.PRIMARY, color: COLORS.textSecondary, marginBottom: 14, lineHeight: 17 },
    vehicleFareRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    vehicleFareLabel: { fontSize: 10, fontFamily: FONTS.PRIMARY, color: COLORS.textLight },
    vehicleFareValue: { fontSize: 15, fontFamily: FONTS.BOLD_PRIMARY, color: COLORS.textPrimary },
    vehicleBookBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
    vehicleBookBtnText: { color: '#fff', fontSize: 12, fontFamily: FONTS.BOLD_PRIMARY },
});
