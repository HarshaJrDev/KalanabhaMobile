// Real per-customer saved addresses (GET /users/me/saved-addresses),
// each anchored to a real ServiceArea. Sibling to PopularPickupPoints —
// same horizontal-chip pattern — but these are the customer's own
// bookmarked places (see src/features/savedAddresses).
import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Bookmark } from 'lucide-react-native';
import type { SavedAddress } from '@features/savedAddresses/types';
import { HomeColors, HomeFonts, SPACING } from './theme';

interface Props {
    addresses: SavedAddress[];
    onSelect: (address: SavedAddress) => void;
    onManage: () => void;
    colors: HomeColors;
    fonts: HomeFonts;
}

const FavoriteAddresses: React.FC<Props> = ({ addresses, onSelect, onManage, colors: COLORS, fonts: FONTS }) => {
    const styles = React.useMemo(() => makeStyles(COLORS, FONTS), [COLORS, FONTS]);

    if (addresses.length === 0) return null;

    return (
        <View style={styles.section}>
            <View style={styles.headerRow}>
                <Text style={styles.title}>Favorites</Text>
                <Pressable onPress={onManage} hitSlop={8}>
                    <Text style={styles.manageText}>Manage</Text>
                </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {addresses.map((address) => (
                    <Pressable key={address.id} style={styles.chip} onPress={() => onSelect(address)}>
                        <Bookmark size={13} color={COLORS.primary} />
                        <View>
                            <Text style={styles.chipName}>{address.label}</Text>
                            <Text style={styles.chipCity}>{address.serviceArea.name}, {address.serviceArea.city}</Text>
                        </View>
                    </Pressable>
                ))}
            </ScrollView>
        </View>
    );
};

export default FavoriteAddresses;

const makeStyles = (COLORS: HomeColors, FONTS: HomeFonts) => StyleSheet.create({
    section: { marginBottom: SPACING.xxl + 4 },
    headerRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: SPACING.xl, marginBottom: SPACING.l,
    },
    title: { fontSize: 18, fontFamily: FONTS.BOLD_PRIMARY, color: COLORS.textPrimary, letterSpacing: 0.3 },
    manageText: { fontSize: 12, fontFamily: FONTS.MEDIUM_PRIMARY, color: COLORS.primary },
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
