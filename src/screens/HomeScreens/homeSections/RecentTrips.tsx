// RecentTrips — real delivered/cancelled history (GET /shipments/mine/
// history), most recent first. "Book Again" reuses addOrders.tsx's
// existing prefill contract (the same one CheckRate.tsx and the vehicle
// swiper already use) with this trip's real pickup/drop text and vehicle
// type — addOrders.tsx's own service-area matching then either finds the
// matching locality automatically or leaves it for the customer to pick,
// same as any other prefilled hand-off. No fabricated "frequency" or
// "favorite route" scoring — just the real last few trips, newest first.
//
// Each card's thumbnail is that trip's own real vehicle photo (matched by
// name against the same admin-managed VehicleConfig list every other
// vehicle picker already reads) — not a generic stock photo, the actual
// picture an admin set for that vehicle type.
import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { RotateCcw, ChevronRight } from 'lucide-react-native';
import type { Shipment } from '@shipment/types';
import type { VehicleConfig } from '@features/settings/types';
import VehicleVisual from '@components/VehicleVisual';
import { HomeColors, HomeFonts, SPACING } from './theme';

interface Props {
    trips: Shipment[];
    vehicleConfigs: VehicleConfig[];
    onBookAgain: (trip: Shipment) => void;
    onViewAll: () => void;
    colors: HomeColors;
    fonts: HomeFonts;
}

const RecentTrips: React.FC<Props> = ({ trips, vehicleConfigs, onBookAgain, onViewAll, colors: COLORS, fonts: FONTS }) => {
    const styles = React.useMemo(() => makeStyles(COLORS, FONTS), [COLORS, FONTS]);

    if (trips.length === 0) return null;

    return (
        <View style={styles.section}>
            <View style={styles.header}>
                <Text style={styles.title}>Recent Trips</Text>
                <Pressable style={styles.viewAllBtn} onPress={onViewAll}>
                    <Text style={styles.viewAllText}>View All</Text>
                    <ChevronRight size={14} color={COLORS.primary} />
                </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {trips.slice(0, 5).map((trip) => {
                    const vehicle = vehicleConfigs.find((v) => v.name.toLowerCase() === trip.vehicleType.toLowerCase());
                    return (
                        <View key={trip.id} style={styles.card}>
                            <View style={styles.cardTopRow}>
                                <VehicleVisual
                                    vehicle={vehicle ?? { name: trip.vehicleType, imageUrl: null }}
                                    size={40}
                                    iconSize={20}
                                    borderRadius={10}
                                    backgroundColor={COLORS.primaryLight}
                                    iconColor={COLORS.primary}
                                />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.route} numberOfLines={1}>{trip.pickup.address}</Text>
                                    <Text style={styles.routeArrow} numberOfLines={1}>→ {trip.drop.address}</Text>
                                </View>
                            </View>
                            <View style={styles.metaRow}>
                                <Text style={styles.metaText}>{trip.vehicleType} · ₹{trip.price}</Text>
                            </View>
                            <Text style={styles.dateText}>
                                {new Date(trip.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </Text>
                            <Pressable style={styles.bookAgainBtn} onPress={() => onBookAgain(trip)}>
                                <RotateCcw size={12} color="#fff" />
                                <Text style={styles.bookAgainText}>Book Again</Text>
                            </Pressable>
                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );
};

export default RecentTrips;

const makeStyles = (COLORS: HomeColors, FONTS: HomeFonts) => StyleSheet.create({
    section: { marginBottom: SPACING.xxl + 4 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.l, paddingHorizontal: SPACING.xl },
    title: { fontSize: 18, fontFamily: FONTS.BOLD_PRIMARY, color: COLORS.textPrimary, letterSpacing: 0.3 },
    viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: COLORS.primaryLight, borderRadius: 12 },
    viewAllText: { color: COLORS.primary, fontSize: 12, fontFamily: FONTS.BOLD_PRIMARY },
    scrollContent: { paddingHorizontal: SPACING.xl, gap: SPACING.m },
    card: {
        width: 220, backgroundColor: COLORS.card, borderRadius: 18,
        borderWidth: 1, borderColor: COLORS.border, padding: 14,
    },
    cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
    route: { fontSize: 13, fontFamily: FONTS.MEDIUM_PRIMARY, color: COLORS.textPrimary },
    routeArrow: { fontSize: 12, fontFamily: FONTS.PRIMARY, color: COLORS.textSecondary, marginTop: 2 },
    metaRow: { marginTop: 8 },
    metaText: { fontSize: 11, fontFamily: FONTS.PRIMARY, color: COLORS.textSecondary, textTransform: 'capitalize' },
    dateText: { fontSize: 10, fontFamily: FONTS.PRIMARY, color: COLORS.textLight, marginTop: 2, marginBottom: 10 },
    bookAgainBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
        backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 8,
    },
    bookAgainText: { color: '#fff', fontSize: 11, fontFamily: FONTS.BOLD_PRIMARY },
});
