// ActiveBookingCard — the state-aware hero: if the customer has a live
// shipment, it's the first thing they see, not a card buried in a list.
// Every number here is real:
//  - status/driver/route: the shipment row itself
//  - "assigned Xm ago": derived from dispatch.acceptedAt (a real
//    timestamp), not a fabricated ETA — kalanabhaBackend never sets
//    Shipment.etaMinutes anywhere, so showing one would be invented
//  - "~X km from pickup": haversine between the driver's live tracked
//    position (useLiveDriverLocation — the same socket
//    ShipmentDetailsScreen's map already uses) and the shipment's real
//    pickup coordinates. Only rendered once a live position actually
//    exists; no placeholder distance is shown before that.
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Reanimated, { FadeIn } from 'react-native-reanimated';
import { Truck, Bike, RotateCw, Phone, Navigation, ChevronRight, Package } from 'lucide-react-native';
import type { Shipment } from '@shipment/types';
import { useLiveDriverLocation } from '@location/useLiveDriverLocation';
import { haversineDistanceKm } from '@utils/geo';
import { HomeColors, HomeFonts, SPACING } from './theme';

const STATUS_LABEL: Record<string, string> = {
    searching: 'Finding a pilot for you',
    accepted: 'Pilot on the way to pickup',
    in_transit: 'Your shipment is in transit',
};

// Real elapsed time since a real timestamp — "3 min ago", never a
// fabricated countdown/ETA.
const timeAgo = (iso?: string): string | null => {
    if (!iso) return null;
    const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m ago`;
};

interface Props {
    shipment: Shipment;
    onTrack: () => void;
    colors: HomeColors;
    fonts: HomeFonts;
}

const ActiveBookingCard: React.FC<Props> = ({ shipment, onTrack, colors: COLORS, fonts: FONTS }) => {
    const styles = React.useMemo(() => makeStyles(COLORS, FONTS), [COLORS, FONTS]);
    const isSearching = shipment.status === 'searching';
    const liveLocation = useLiveDriverLocation(!isSearching ? shipment.id : null);

    const distanceToPickupKm = React.useMemo(() => {
        if (!liveLocation) return null;
        return haversineDistanceKm(
            { lat: liveLocation.lat, lng: liveLocation.lng },
            { lat: shipment.pickup.lat, lng: shipment.pickup.lng },
        );
    }, [liveLocation, shipment.pickup.lat, shipment.pickup.lng]);

    return (
        <Reanimated.View entering={FadeIn.duration(320)} style={styles.wrapper}>
            <Pressable style={styles.card} onPress={onTrack}>
                <View style={styles.topRow}>
                    <View style={styles.statusIconWrap}>
                        {isSearching ? <RotateCw size={18} color="#fff" /> : shipment.status === 'in_transit' ? <Bike size={18} color="#fff" /> : <Truck size={18} color="#fff" />}
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.statusTitle}>{STATUS_LABEL[shipment.status] ?? 'Shipment update'}</Text>
                        <Text style={styles.trackingId}>{shipment.trackingId}</Text>
                    </View>
                    <View style={styles.trackBtn}>
                        <Text style={styles.trackBtnText}>Track</Text>
                        <ChevronRight size={14} color="#fff" />
                    </View>
                </View>

                <View style={styles.routeRow}>
                    <View style={styles.routeCol}>
                        <View style={[styles.dot, { backgroundColor: '#fff' }]} />
                        <Text style={styles.routeText} numberOfLines={1}>{shipment.pickup.address}</Text>
                    </View>
                    <View style={styles.routeCol}>
                        <View style={[styles.dot, { backgroundColor: 'rgba(255,255,255,0.6)' }]} />
                        <Text style={styles.routeText} numberOfLines={1}>{shipment.drop.address}</Text>
                    </View>
                </View>

                <View style={styles.footerRow}>
                    {shipment.dispatch?.driverName ? (
                        <View style={styles.driverRow}>
                            <Text style={styles.driverName} numberOfLines={1}>{shipment.dispatch.driverName}</Text>
                            {shipment.dispatch.driverPhone && <Phone size={13} color="rgba(255,255,255,0.85)" />}
                        </View>
                    ) : (
                        <Text style={styles.driverName}>Matching nearby pilots…</Text>
                    )}
                    <View style={{ flex: 1 }} />
                    {distanceToPickupKm != null && (
                        <View style={styles.metaChip}>
                            <Navigation size={11} color="#fff" />
                            <Text style={styles.metaChipText}>~{distanceToPickupKm.toFixed(1)} km away</Text>
                        </View>
                    )}
                    {!distanceToPickupKm && shipment.dispatch?.acceptedAt && (
                        <Text style={styles.timeAgoText}>{timeAgo(shipment.dispatch.acceptedAt)}</Text>
                    )}
                </View>

                {shipment.category === 'HOUSE_SHIFTING' && (
                    <View style={styles.categoryBadge}>
                        <Package size={11} color="#fff" />
                        <Text style={styles.categoryBadgeText}>House Shifting · {shipment.helpersCount} helper{shipment.helpersCount === 1 ? '' : 's'}</Text>
                    </View>
                )}
            </Pressable>
        </Reanimated.View>
    );
};

export default ActiveBookingCard;

const makeStyles = (COLORS: HomeColors, FONTS: HomeFonts) => StyleSheet.create({
    wrapper: { paddingHorizontal: SPACING.xl, marginTop: -24, marginBottom: SPACING.l },
    card: {
        backgroundColor: COLORS.primary,
        borderRadius: 22,
        padding: 18,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
    },
    topRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
    statusIconWrap: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    statusTitle: { color: '#fff', fontSize: 14, fontFamily: FONTS.BOLD_PRIMARY },
    trackingId: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontFamily: FONTS.PRIMARY, marginTop: 2 },
    trackBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 },
    trackBtnText: { color: '#fff', fontSize: 12, fontFamily: FONTS.BOLD_PRIMARY },
    routeRow: { gap: 8, marginBottom: 14, paddingLeft: 2 },
    routeCol: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dot: { width: 7, height: 7, borderRadius: 3.5 },
    routeText: { flex: 1, color: 'rgba(255,255,255,0.92)', fontSize: 13, fontFamily: FONTS.PRIMARY },
    footerRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
    driverRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    driverName: { color: '#fff', fontSize: 12, fontFamily: FONTS.MEDIUM_PRIMARY },
    metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
    metaChipText: { color: '#fff', fontSize: 11, fontFamily: FONTS.MEDIUM_PRIMARY },
    timeAgoText: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontFamily: FONTS.PRIMARY },
    categoryBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
    categoryBadgeText: { color: '#fff', fontSize: 10, fontFamily: FONTS.MEDIUM_PRIMARY },
});
