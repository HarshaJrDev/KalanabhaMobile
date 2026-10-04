import React from 'react';
import { ScrollView, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useAppTheme } from '@theme/ThemeContext';
import VehicleVisual from '@components/VehicleVisual';
import type { VehicleConfig } from '@features/settings/types';

interface VehicleSelectCardsProps {
    vehicles: VehicleConfig[];
    selectedName: string;
    onSelect: (vehicle: VehicleConfig) => void;
    maxWeightLabel: (vehicle: VehicleConfig) => string;
}

const Card: React.FC<{
    vehicle: VehicleConfig;
    isSelected: boolean;
    onPress: () => void;
    label: string;
}> = ({ vehicle, isSelected, onPress, label }) => {
    const { colors, fonts, radius } = useAppTheme();
    const styles = React.useMemo(() => makeCardStyles(colors, fonts, radius), [colors, fonts, radius]);
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    return (
        <Pressable
            onPressIn={() => { scale.value = withSpring(0.95, { damping: 16, stiffness: 220 }); }}
            onPressOut={() => { scale.value = withSpring(1, { damping: 16, stiffness: 220 }); }}
            onPress={onPress}
        >
            <Animated.View style={[styles.card, isSelected && styles.cardActive, animatedStyle]}>
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
                <Text style={styles.desc} numberOfLines={1}>{label}</Text>
            </Animated.View>
        </Pressable>
    );
};

export const VehicleSelectCards: React.FC<VehicleSelectCardsProps> = ({
    vehicles,
    selectedName,
    onSelect,
    maxWeightLabel,
}) => {
    const { spacing } = useAppTheme();
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
                    label={maxWeightLabel(vt)}
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
            width: 108,
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
    });
