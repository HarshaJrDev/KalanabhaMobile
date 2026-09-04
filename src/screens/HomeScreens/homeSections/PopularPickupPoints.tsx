// PopularPickupPoints — real, admin-managed service areas (GET
// /settings/service-areas), not a fabricated "saved addresses" feature.
// This app has no per-customer saved-address model on the backend, so
// rather than inventing a fake "Home/Work" chip set, this surfaces the
// real localities Kalanabha actually services — tapping one jumps
// straight into the booking flow with that pickup pre-selected, which is
// the same real, useful shortcut a saved-address feature would offer,
// just built from data that's actually there.
import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { MapPin } from 'lucide-react-native';
import type { ServiceArea } from '@features/settings/types';
import { HomeColors, HomeFonts, SPACING } from './theme';

interface Props {
    areas: ServiceArea[];
    onSelect: (area: ServiceArea) => void;
    colors: HomeColors;
    fonts: HomeFonts;
}

const PopularPickupPoints: React.FC<Props> = ({ areas, onSelect, colors: COLORS, fonts: FONTS }) => {
    const styles = React.useMemo(() => makeStyles(COLORS, FONTS), [COLORS, FONTS]);

    if (areas.length === 0) return null;

    return (
        <View style={styles.section}>
            <Text style={styles.title}>Popular Pickup Points</Text>
            <Text style={styles.subtitle}>Tap a locality to start booking from there</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {areas.slice(0, 12).map((area) => (
                    <Pressable key={area.id} style={styles.chip} onPress={() => onSelect(area)}>
                        <MapPin size={13} color={COLORS.primary} />
                        <View>
                            <Text style={styles.chipName}>{area.name}</Text>
                            <Text style={styles.chipCity}>{area.city}</Text>
                        </View>
                    </Pressable>
                ))}
            </ScrollView>
        </View>
    );
};

export default PopularPickupPoints;

const makeStyles = (COLORS: HomeColors, FONTS: HomeFonts) => StyleSheet.create({
    section: { marginBottom: SPACING.xxl + 4 },
    title: { fontSize: 18, fontFamily: FONTS.BOLD_PRIMARY, color: COLORS.textPrimary, letterSpacing: 0.3, paddingHorizontal: SPACING.xl },
    subtitle: { fontSize: 12, fontFamily: FONTS.PRIMARY, color: COLORS.textSecondary, marginTop: 2, marginBottom: SPACING.l, paddingHorizontal: SPACING.xl },
    scrollContent: { paddingHorizontal: SPACING.xl, gap: SPACING.s },
    chip: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: COLORS.card, borderRadius: 14,
        borderWidth: 1, borderColor: COLORS.border,
        paddingHorizontal: 12, paddingVertical: 10,
    },
    chipName: { fontSize: 12, fontFamily: FONTS.MEDIUM_PRIMARY, color: COLORS.textPrimary },
    chipCity: { fontSize: 10, fontFamily: FONTS.PRIMARY, color: COLORS.textSecondary },
});
