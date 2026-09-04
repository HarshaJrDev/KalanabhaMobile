// RatingScreen.tsx — Customer
//
// Post-delivery rating: stars + "what went great" tags + a note, all real
// (POST /shipments/:id/rating — a genuine new backend model, verified live
// against the running server: submitting recomputes the driver's real
// average rating). The reference mockup also had a tip-to-UPI flow and a
// GST invoice download — neither is built here. There's no payment-gateway
// integration in this app yet to move real money through, and no invoice/
// PDF generation backend either; faking either would mean pretending
// money moved or a real tax document was produced when neither happened.
// Both sections below say "coming soon" instead.
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, StatusBar } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { X, Headphones, CheckCircle2, MapPin, Star, Receipt, ArrowRight } from 'lucide-react-native';
import { useShipment } from '@features/shipments/hooks';
import { useShipmentRating, useSubmitRating } from '@features/ratings/hooks';
import { RATING_TAGS, type RatingTag } from '@features/ratings/types';
import { useAppTheme } from '@theme/ThemeContext';
import { showToast } from '@ui/alert/toastStore';
import AppButton from '../../components/ui/AppButton';

const PAYMENT_LABEL: Record<string, string> = {
    prepaid: 'Paid via UPI',
    cod: 'Cash on Delivery',
    credit: 'Credit Account',
};

const RatingScreen = () => {
    const navigation = useNavigation();
    const { colors, fonts } = useAppTheme();
    const styles = useMemo(() => makeStyles(colors, fonts), [colors, fonts]);
    const route = useRoute<any>();
    const shipmentId: string | undefined = route.params?.shipmentId;

    const { data: shipment, isLoading } = useShipment(shipmentId);
    const { data: existingRating } = useShipmentRating(shipmentId);
    const { mutate: submitRating, isPending } = useSubmitRating(shipmentId ?? '');

    const [stars, setStars] = useState(0);
    const [selectedTags, setSelectedTags] = useState<RatingTag[]>([]);
    const [note, setNote] = useState('');

    const toggleTag = (tag: RatingTag) => {
        setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
    };

    const durationLabel = useMemo(() => {
        const start = shipment?.dispatch?.acceptedAt;
        const end = shipment?.dispatch?.completedAt;
        if (!start || !end) return null;
        const minutes = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
        return minutes > 0 ? `Completed in ${minutes} mins` : null;
    }, [shipment]);

    const handleSubmit = () => {
        if (stars === 0) {
            showToast('Please select a star rating', 'error');
            return;
        }
        submitRating(
            { stars, tags: selectedTags, note: note.trim() || undefined },
            {
                onSuccess: () => {
                    showToast('Thanks for rating your delivery!', 'success');
                    navigation.goBack();
                },
                onError: (err: any) => showToast(err?.message ?? 'Could not submit your rating', 'error'),
            },
        );
    };

    if (isLoading || !shipment) {
        return <View style={styles.root} />;
    }

    // Already rated — nothing more to do here.
    if (existingRating) {
        return (
            <View style={styles.root}>
                <View style={styles.doneState}>
                    <CheckCircle2 size={40} color={colors.SUCCESS} />
                    <Text style={styles.doneTitle}>You already rated this delivery</Text>
                    <Text style={styles.doneSub}>{existingRating.stars} / 5 stars — thank you!</Text>
                    <AppButton title="Done" onPress={() => navigation.goBack()} style={{ marginTop: 20, width: 160 }} />
                </View>
            </View>
        );
    }

    const driverName = shipment.dispatch?.driverName ?? 'your pilot';

    return (
        <View style={styles.root}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.BACKGROUND} />
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Top bar */}
                <View style={styles.topBar}>
                    <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
                        <X size={20} color={colors.TEXT_SECONDARY} />
                    </Pressable>
                    <View style={styles.trackingPill}>
                        <Text style={styles.trackingPillText}>#{shipment.trackingId} · Delivered</Text>
                    </View>
                    <Pressable style={styles.headsetBtn} onPress={() => (navigation as any).navigate('Search')} hitSlop={10}>
                        <Headphones size={16} color={colors.TEXT_SECONDARY} />
                    </Pressable>
                </View>

                {/* Delivered banner */}
                <View style={styles.deliveredBanner}>
                    <View style={styles.deliveredIconWrap}>
                        <CheckCircle2 size={20} color="#fff" />
                    </View>
                    <View>
                        <Text style={styles.deliveredTitle}>Safely Delivered!</Text>
                        {durationLabel && <Text style={styles.deliveredSub}>{durationLabel}</Text>}
                    </View>
                </View>

                {/* Driver card */}
                <View style={styles.driverCard}>
                    <View style={styles.driverAvatar}>
                        <Text style={styles.driverInitials}>
                            {driverName.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
                        </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.driverName}>{driverName}</Text>
                        <View style={styles.driverMetaRow}>
                            {shipment.dispatch?.driverRating != null && (
                                <View style={styles.driverRatingRow}>
                                    <Star size={12} color="#F59E0B" fill="#F59E0B" />
                                    <Text style={styles.driverRatingText}>{shipment.dispatch.driverRating.toFixed(1)}</Text>
                                </View>
                            )}
                            <Text style={styles.driverVehicle}>{shipment.vehicleType}</Text>
                        </View>
                    </View>
                </View>

                {/* Route */}
                <View style={styles.routeRow}>
                    <MapPin size={13} color={colors.SUCCESS} />
                    <Text style={styles.routeText} numberOfLines={1}>{shipment.from}</Text>
                    <ArrowRight size={12} color={colors.GRAY} />
                    <MapPin size={13} color={colors.PRIMARY} />
                    <Text style={styles.routeText} numberOfLines={1}>{shipment.to}</Text>
                    <Text style={styles.routeDistance}>{shipment.distanceKm.toFixed(1)} km</Text>
                </View>

                {/* Stars */}
                <Text style={styles.sectionEyebrow}>TRIP EXPERIENCE</Text>
                <Text style={styles.sectionTitle}>How was your pilot today?</Text>
                <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((n) => (
                        <Pressable key={n} onPress={() => setStars(n)} hitSlop={6}>
                            <Star size={34} color="#F59E0B" fill={n <= stars ? '#F59E0B' : 'transparent'} strokeWidth={1.5} />
                        </Pressable>
                    ))}
                </View>
                {stars >= 4 && (
                    <View style={styles.starsHintPill}>
                        <Text style={styles.starsHintText}>Excellent Service! Fast &amp; Smooth</Text>
                    </View>
                )}

                {/* Tags */}
                <View style={styles.tagsHeaderRow}>
                    <Text style={styles.tagsTitle}>What went great?</Text>
                    <Text style={styles.tagsHint}>Select all that apply</Text>
                </View>
                <View style={styles.tagsWrap}>
                    {RATING_TAGS.map((tag) => {
                        const selected = selectedTags.includes(tag);
                        return (
                            <Pressable
                                key={tag}
                                style={[styles.tagChip, selected && styles.tagChipSelected]}
                                onPress={() => toggleTag(tag)}
                            >
                                <Text style={[styles.tagChipText, selected && styles.tagChipTextSelected]}>{tag}</Text>
                            </Pressable>
                        );
                    })}
                </View>

                {/* Tip — not built (no payment gateway to move real money through) */}
                <View style={styles.comingSoonCard}>
                    <Text style={styles.comingSoonTitle}>Send a tip to {driverName.split(' ')[0]}</Text>
                    <Text style={styles.comingSoonText}>
                        Tipping is coming soon — it needs a real payment integration we haven't built yet.
                    </Text>
                </View>

                {/* Note */}
                <Text style={styles.tagsTitle}>Leave {driverName.split(' ')[0]} a note</Text>
                <TextInput
                    style={styles.noteInput}
                    placeholder="Share specific praise like safe handling, courteous manners, or freight navigation…"
                    placeholderTextColor={colors.GRAY}
                    value={note}
                    onChangeText={setNote}
                    multiline
                    numberOfLines={3}
                    maxLength={500}
                />

                {/* Fare + invoice */}
                <View style={styles.fareCard}>
                    <View style={styles.fareRow}>
                        <Text style={styles.fareLabel}>Total Fare Paid</Text>
                        <Text style={styles.farePaidBadge}>✓ {PAYMENT_LABEL[shipment.paymentMode] ?? shipment.paymentMode}</Text>
                    </View>
                    <Text style={styles.fareValue}>₹{shipment.price.toFixed(2)}</Text>
                    <Pressable
                        style={styles.invoiceRow}
                        onPress={() => showToast('Invoice download is not available yet', 'info')}
                    >
                        <Receipt size={14} color={colors.TEXT_SECONDARY} />
                        <Text style={styles.invoiceText}>Download Invoice (PDF)</Text>
                    </Pressable>
                </View>

                <AppButton
                    title={isPending ? 'Submitting…' : 'Submit Rating'}
                    onPress={handleSubmit}
                    loading={isPending}
                    disabled={isPending}
                    style={{ marginTop: 8 }}
                />
                <Pressable style={styles.skipBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.skipText}>Skip for Now</Text>
                </Pressable>
            </ScrollView>
        </View>
    );
};

export default RatingScreen;

const makeStyles = (colors: ReturnType<typeof useAppTheme>['colors'], fonts: ReturnType<typeof useAppTheme>['fonts']) => StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.BACKGROUND },
    scroll: { padding: 16, paddingBottom: 32 },

    doneState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, padding: 24 },
    doneTitle: { fontFamily: fonts.BOLD_PRIMARY, fontSize: 16, color: colors.TEXT_PRIMARY, textAlign: 'center', marginTop: 8 },
    doneSub: { fontFamily: fonts.PRIMARY, fontSize: 13, color: colors.TEXT_SECONDARY },

    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    trackingPill: { backgroundColor: colors.SURFACE, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: colors.BORDER },
    trackingPillText: { fontFamily: fonts.SEMI_BOLD_PRIMARY, fontSize: 11, color: colors.TEXT_SECONDARY },
    headsetBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.SURFACE, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.BORDER },

    deliveredBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#0F1115',
        borderRadius: 16,
        padding: 16,
        marginBottom: 14,
    },
    deliveredIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.SUCCESS, alignItems: 'center', justifyContent: 'center' },
    deliveredTitle: { fontFamily: fonts.BOLD_PRIMARY, fontSize: 15, color: '#fff' },
    deliveredSub: { fontFamily: fonts.PRIMARY, fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },

    driverCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: colors.SURFACE,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.BORDER,
        padding: 14,
        marginBottom: 12,
    },
    driverAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.PRIMARY_LIGHT, alignItems: 'center', justifyContent: 'center' },
    driverInitials: { fontFamily: fonts.BOLD_PRIMARY, fontSize: 14, color: colors.PRIMARY },
    driverName: { fontFamily: fonts.BOLD_PRIMARY, fontSize: 15, color: colors.TEXT_PRIMARY },
    driverMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
    driverRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    driverRatingText: { fontFamily: fonts.SEMI_BOLD_PRIMARY, fontSize: 12, color: colors.TEXT_SECONDARY },
    driverVehicle: { fontFamily: fonts.PRIMARY, fontSize: 12, color: colors.TEXT_SECONDARY, textTransform: 'capitalize' },

    routeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: colors.SURFACE,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.BORDER,
        padding: 10,
        marginBottom: 20,
    },
    routeText: { flex: 1, fontFamily: fonts.MEDIUM_PRIMARY, fontSize: 12, color: colors.TEXT_PRIMARY },
    routeDistance: { fontFamily: fonts.SEMI_BOLD_PRIMARY, fontSize: 11, color: colors.TEXT_SECONDARY },

    sectionEyebrow: { fontFamily: fonts.BOLD_PRIMARY, fontSize: 11, color: colors.PRIMARY, letterSpacing: 0.5, marginBottom: 4 },
    sectionTitle: { fontFamily: fonts.BOLD_PRIMARY, fontSize: 20, color: colors.TEXT_PRIMARY, marginBottom: 16 },
    starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 12 },
    starsHintPill: { alignSelf: 'center', backgroundColor: colors.PRIMARY_LIGHT, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, marginBottom: 20 },
    starsHintText: { fontFamily: fonts.SEMI_BOLD_PRIMARY, fontSize: 12, color: colors.PRIMARY_DARK },

    tagsHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    tagsTitle: { fontFamily: fonts.BOLD_PRIMARY, fontSize: 15, color: colors.TEXT_PRIMARY },
    tagsHint: { fontFamily: fonts.PRIMARY, fontSize: 11, color: colors.TEXT_SECONDARY },
    tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
    tagChip: {
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 9,
        backgroundColor: colors.SURFACE,
        borderWidth: 1,
        borderColor: colors.BORDER,
    },
    tagChipSelected: { backgroundColor: colors.PRIMARY_DARK, borderColor: colors.PRIMARY_DARK },
    tagChipText: { fontFamily: fonts.MEDIUM_PRIMARY, fontSize: 12, color: colors.TEXT_SECONDARY },
    tagChipTextSelected: { color: '#fff' },

    comingSoonCard: {
        backgroundColor: colors.SURFACE,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.BORDER,
        padding: 14,
        marginBottom: 20,
    },
    comingSoonTitle: { fontFamily: fonts.BOLD_PRIMARY, fontSize: 14, color: colors.TEXT_PRIMARY, marginBottom: 4 },
    comingSoonText: { fontFamily: fonts.PRIMARY, fontSize: 12, color: colors.TEXT_SECONDARY, lineHeight: 17 },

    noteInput: {
        backgroundColor: colors.SURFACE,
        borderWidth: 1,
        borderColor: colors.BORDER,
        borderRadius: 14,
        padding: 12,
        fontSize: 13,
        color: colors.TEXT_PRIMARY,
        minHeight: 80,
        textAlignVertical: 'top',
        marginTop: 10,
        marginBottom: 20,
    },

    fareCard: {
        backgroundColor: colors.SURFACE,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.BORDER,
        padding: 14,
        marginBottom: 16,
    },
    fareRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    fareLabel: { fontFamily: fonts.MEDIUM_PRIMARY, fontSize: 12, color: colors.TEXT_SECONDARY },
    farePaidBadge: { fontFamily: fonts.SEMI_BOLD_PRIMARY, fontSize: 11, color: colors.SUCCESS },
    fareValue: { fontFamily: fonts.BOLD_PRIMARY, fontSize: 22, color: colors.TEXT_PRIMARY, marginTop: 4 },
    invoiceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.BORDER },
    invoiceText: { fontFamily: fonts.SEMI_BOLD_PRIMARY, fontSize: 12, color: colors.TEXT_SECONDARY },

    skipBtn: { alignItems: 'center', marginTop: 14 },
    skipText: { fontFamily: fonts.MEDIUM_PRIMARY, fontSize: 13, color: colors.TEXT_SECONDARY },
});
