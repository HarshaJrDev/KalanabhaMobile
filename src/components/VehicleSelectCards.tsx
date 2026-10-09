import React from 'react';
import { ScrollView, Text, View, Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useAppTheme } from '@theme/ThemeContext';
import VehicleVisual from '@components/VehicleVisual';
import type { VehicleConfig } from '@features/settings/types';

interface VehicleSelectCardsProps {
    vehicles: VehicleConfig[];
    selectedName: string;
    onSelect: (vehicle: VehicleConfig) => void;
}

// Capacity is more readable in tons for the heavy-truck classes (9000kg
// reads easier as "9 T") while staying exact for lighter ones where a
// fraction-of-a-ton figure would be a worse read than the kg number
// itself (a 750kg Pickup as "0.75 T" is less immediately legible).
const formatCapacity = (maxWeightKg: number): string =>
    maxWeightKg >= 1000 ? `${(maxWeightKg / 1000).toFixed(maxWeightKg % 1000 === 0 ? 0 : 1)} T` : `${maxWeightKg} kg`;

// Heavy Cargo threshold — 10T+ is squarely in the dedicated heavy-haul
// class (Low Bed Trailer, Heavy Haul Truck, Container), not an arbitrary
// cutoff picked for marketing effect.
const HEAVY_CARGO_THRESHOLD_KG = 10_000;

type Badge = { label: string; variant: 'value' | 'heavy' } | null;

const Card: React.FC<{
    vehicle: VehicleConfig;
    isSelected: boolean;
    onPress: () => void;
    badge: Badge;
}> = ({ vehicle, isSelected, onPress, badge }) => {
    const { colors, fonts, radius } = useAppTheme();
    const styles = React.useMemo(() => makeCardStyles(colors, fonts, radius), [colors, fonts, radius]);
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    // "Additional data" shown per card — admin-set via VehicleConfig's
    // specialConditions (free-text tags: body type, what the vehicle
    // suits). Dynamic: a vehicle with none of this set (specialConditions
    // empty) just shows the capacity line, no empty tag row.
    const tags = vehicle.specialConditions.slice(0, 2);

    return (
        <Pressable
            onPressIn={() => { scale.value = withSpring(0.95, { damping: 16, stiffness: 220 }); }}
            onPressOut={() => { scale.value = withSpring(1, { damping: 16, stiffness: 220 }); }}
            onPress={onPress}
        >
            <Animated.View style={[styles.card, isSelected && styles.cardActive, animatedStyle]}>
                {badge && (
                    <View style={[styles.badge, badge.variant === 'heavy' && styles.badgeHeavy]}>
                        <Text style={styles.badgeText} numberOfLines={1}>{badge.label}</Text>
                    </View>
                )}
                <VehicleVisual
                    vehicle={vehicle}
                    size={64}
                    iconSize={34}
                    borderRadius={14}
                    backgroundColor="transparent"
                    iconColor={isSelected ? colors.PRIMARY : colors.TEXT_SECONDARY}
                />
                <Text style={[styles.label, isSelected && { color: colors.PRIMARY }]} numberOfLines={1}>
                    {vehicle.name}
                </Text>
                <Text style={styles.desc} numberOfLines={1}>
                    {formatCapacity(vehicle.maxWeight)} capacity
                </Text>
                {tags.length > 0 && (
                    <View style={styles.tagsRow}>
                        {tags.map(tag => (
                            <View key={tag} style={[styles.tag, isSelected && styles.tagActive]}>
                                <Text
                                    style={[styles.tagText, isSelected && styles.tagTextActive]}
                                    numberOfLines={1}
                                >
                                    {tag}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}
            </Animated.View>
        </Pressable>
    );
};

export const VehicleSelectCards: React.FC<VehicleSelectCardsProps> = ({
    vehicles,
    selectedName,
    onSelect,
}) => {
    const { spacing } = useAppTheme();

    // "Best Value" needs sibling awareness (lowest ratePerKm among the
    // options actually on offer), so it's computed once here rather than
    // inside each Card. Ties aren't broken arbitrarily into multiple
    // badges — only the first vehicle at the minimum rate gets it.
    const bestValueId = React.useMemo(() => {
        if (vehicles.length === 0) return null;
        return vehicles.reduce((best, v) => (v.ratePerKm < best.ratePerKm ? v : best), vehicles[0]).id;
    }, [vehicles]);

    const badgeFor = (vehicle: VehicleConfig): Badge => {
        if (vehicle.id === bestValueId) return { label: 'Best Value', variant: 'value' };
        if (vehicle.maxWeight >= HEAVY_CARGO_THRESHOLD_KG) return { label: 'Heavy Cargo', variant: 'heavy' };
        return null;
    };

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingRight: spacing.lg, paddingBottom: 4 }}
        >
            {vehicles.map(vt => (
                <Card
                    key={vt.id}
                    vehicle={vt}
                    isSelected={selectedName.toLowerCase() === vt.name.toLowerCase()}
                    onPress={() => onSelect(vt)}
                    badge={badgeFor(vt)}
                />
            ))}
        </ScrollView>
    );
};

export default VehicleSelectCards;

const makeCardStyles = (
    colors: ReturnType<typeof useAppTheme>['colors'],
    fonts: ReturnType<typeof useAppTheme>['fonts'],
    radius: ReturnType<typeof useAppTheme>['radius'],
) =>
    StyleSheet.create({
        card: {
            width: 140,
            minHeight: 196,
            marginTop: 8,
            borderRadius: radius.lg,
            borderWidth: 1.5,
            borderColor: colors.BORDER,
            backgroundColor: colors.SURFACE,
            padding: 12,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 1,
        },
        cardActive: {
            borderColor: colors.PRIMARY,
            backgroundColor: colors.PRIMARY_LIGHT,
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
        },
        label: {
            fontSize: 13,
            fontFamily: fonts.BOLD_PRIMARY,
            color: colors.TEXT_PRIMARY,
            marginTop: 6,
        },
        desc: {
            fontSize: 10,
            color: colors.TEXT_SECONDARY,
            marginTop: 2,
            textAlign: 'center',
        },
        tagsRow: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 4,
            marginTop: 8,
        },
        tag: {
            backgroundColor: colors.BACKGROUND,
            borderRadius: 999,
            paddingHorizontal: 8,
            paddingVertical: 3,
            maxWidth: 124,
        },
        tagActive: {
            backgroundColor: colors.SURFACE,
        },
        tagText: {
            fontSize: 9,
            fontFamily: fonts.SEMI_BOLD_PRIMARY,
            color: colors.TEXT_SECONDARY,
        },
        tagTextActive: {
            color: colors.PRIMARY,
        },
        badge: {
            position: 'absolute',
            top: -8,
            alignSelf: 'center',
            backgroundColor: colors.PRIMARY,
            borderRadius: 999,
            paddingHorizontal: 8,
            paddingVertical: 3,
            maxWidth: 124,
            zIndex: 1,
        },
        badgeHeavy: {
            backgroundColor: colors.TEXT_SECONDARY,
        },
        badgeText: {
            fontSize: 9,
            fontFamily: fonts.SEMI_BOLD_PRIMARY,
            color: colors.SURFACE,
        },
    });
