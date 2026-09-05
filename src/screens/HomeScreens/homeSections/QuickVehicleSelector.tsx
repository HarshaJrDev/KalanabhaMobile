// QuickVehicleSelector — real, admin-managed vehicle types (GET
// /settings/vehicle-configs), unchanged logic from the previous Home.tsx,
// just relocated to its own file. Tapping a card hands off into the real
// booking flow (addOrders.tsx) with that vehicle prefilled.
import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Reanimated, { useAnimatedStyle, interpolate, Extrapolate, type SharedValue } from 'react-native-reanimated';
import { ArrowRight } from 'lucide-react-native';
import type { VehicleConfig } from '@features/settings/types';
import VehicleVisual from '@components/VehicleVisual';
import { HomeColors, HomeFonts, SPACING } from './theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
export const VEHICLE_CARD_WIDTH = SCREEN_WIDTH * 0.72;
export const VEHICLE_CARD_GAP = SPACING.m;

type VehicleCardProps = {
    vehicle: VehicleConfig;
    index: number;
    isFirst: boolean;
    cardWidth: number;
    cardStep: number;
    scrollX: SharedValue<number>;
    styles: ReturnType<typeof makeStyles>;
    colors: HomeColors;
    onPress: () => void;
};

const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, index, isFirst, cardWidth, cardStep, scrollX, styles, colors: COLORS, onPress }) => {
    const animatedStyle = useAnimatedStyle(() => {
        const center = index * cardStep;
        const scale = interpolate(scrollX.value, [center - cardStep, center, center + cardStep], [0.92, 1, 0.92], Extrapolate.CLAMP);
        const opacity = interpolate(scrollX.value, [center - cardStep, center, center + cardStep], [0.7, 1, 0.7], Extrapolate.CLAMP);
        return { transform: [{ scale }], opacity };
    });

    return (
        <Reanimated.View style={[{ width: cardWidth }, animatedStyle]}>
            <Pressable style={[styles.vehicleCard, isFirst && styles.vehicleCardFeatured]} onPress={onPress}>
                {/* Full-width photo banner — the real fleet photo is the
                    hero of the card now, not a small 56px chip squeezed
                    beside the text. Falls back to the Lucide icon on its
                    own tinted background exactly like before if a vehicle
                    has no photo at all. */}
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
                    {isFirst && (
                        <View style={styles.vehicleFastestTag}>
                            <Text style={styles.vehicleFastestTagText}>FASTEST DISPATCH</Text>
                        </View>
                    )}
                </View>

                <View style={styles.vehicleCardBody}>
                    <View style={styles.vehicleTopRow}>
                        <Text style={styles.vehicleLabel}>{vehicle.name}</Text>
                        {isFirst && (
                            <View style={styles.vehicleArrivalRow}>
                                <View style={styles.vehicleArrivalDot} />
                                <Text style={styles.vehicleArrivalText}>Available now</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.vehicleDesc}>
                        Up to {vehicle.maxWeight} kg
                        {vehicle.specialConditions.length > 0 ? ` · ${vehicle.specialConditions.join(', ')}` : ''}
                    </Text>
                    <View style={styles.vehicleFareRow}>
                        <View>
                            <Text style={styles.vehicleFareLabel}>Starting Fare</Text>
                            <Text style={styles.vehicleFareValue}>From ₹{Math.round(vehicle.baseRate)}</Text>
                        </View>
                        <View style={styles.vehicleBookBtn}>
                            <Text style={styles.vehicleBookBtnText}>Book {vehicle.name}</Text>
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
    onSelect: (vehicleName: string) => void;
    colors: HomeColors;
    fonts: HomeFonts;
}

const QuickVehicleSelector: React.FC<Props> = ({ vehicles, scrollX, onScroll, onSelect, colors: COLORS, fonts: FONTS }) => {
    const styles = React.useMemo(() => makeStyles(COLORS, FONTS), [COLORS, FONTS]);

    if (vehicles.length === 0) return null;

    return (
        <View style={styles.vehicleSection}>
            <View style={styles.vehicleSectionHeader}>
                <View>
                    <Text style={styles.sectionTitle}>Choose Your Vehicle</Text>
                    <Text style={styles.vehicleSectionSubtitle}>Real, admin-set rates — tap to book</Text>
                </View>
                <Text style={styles.vehicleReadyText}>{vehicles.length} T  YPES READY</Text>
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
                        cardWidth={VEHICLE_CARD_WIDTH}
                        cardStep={VEHICLE_CARD_WIDTH + VEHICLE_CARD_GAP}
                        scrollX={scrollX}
                        styles={styles}
                        colors={COLORS}
                        onPress={() => onSelect(v.name)}
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
    vehicleCardFeatured: { borderColor: COLORS.primary, borderWidth: 1.5 },
    bannerWrap: { width: '100%', height: 132, position: 'relative' },
    vehicleFastestTag: { position: 'absolute', top: 0, right: 0, backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 5, borderBottomLeftRadius: 10 },
    vehicleFastestTagText: { color: '#fff', fontSize: 9, fontFamily: FONTS.BOLD_PRIMARY, letterSpacing: 0.3 },
    vehicleCardBody: { padding: 16 },
    vehicleTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    vehicleLabel: { fontSize: 17, fontFamily: FONTS.BOLD_PRIMARY, color: COLORS.textPrimary },
    vehicleArrivalRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    vehicleArrivalDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.success },
    vehicleArrivalText: { fontSize: 11, fontFamily: FONTS.MEDIUM_PRIMARY, color: COLORS.success },
    vehicleDesc: { fontSize: 12, fontFamily: FONTS.PRIMARY, color: COLORS.textSecondary, marginBottom: 14, lineHeight: 17 },
    vehicleFareRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    vehicleFareLabel: { fontSize: 10, fontFamily: FONTS.PRIMARY, color: COLORS.textLight },
    vehicleFareValue: { fontSize: 15, fontFamily: FONTS.BOLD_PRIMARY, color: COLORS.textPrimary },
    vehicleBookBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
    vehicleBookBtnText: { color: '#fff', fontSize: 12, fontFamily: FONTS.BOLD_PRIMARY },
});
