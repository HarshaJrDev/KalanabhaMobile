// ReceiptScreen.tsx
//
// A real, structured payment receipt for a shipment — every field here is
// data the backend already returns (price, promo discount, payment
// status/mode, tracking id, dates), just laid out and shareable. Not a
// generated PDF: no PDF-rendering library exists in this app, and adding
// one just to produce a document that says the same thing this screen
// already shows would be extra surface area for no real benefit. Share
// uses RN's own Share API (plain text) so a customer can still forward it
// (email, WhatsApp, etc.) without this app needing to be a file-generation
// service.
import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Share, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ChevronLeft, Share2 } from 'lucide-react-native';
import { useShipment } from '@features/shipments/hooks';
import { useAppTheme } from '@theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import FONTS from '@utils/fonts';

type RouteParams = { id?: string };

const PAYMENT_MODE_LABEL: Record<string, string> = {
    prepaid: 'Online / UPI',
    cod: 'Cash on Delivery',
    credit: 'Credit Account',
};

const ReceiptScreen = () => {
    const { colors } = useAppTheme();
    const { t } = useTranslation();
    const navigation = useNavigation();
    const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
    const shipmentId = route?.params?.id;
    const { data: shipment, isLoading } = useShipment(shipmentId);

    const styles = React.useMemo(() => makeStyles(colors), [colors]);

    const handleShare = () => {
        if (!shipment) return;
        const lines = [
            `Kalanabha — ${t('receipt.title')}`,
            `${t('receipt.trackingId')}: ${shipment.trackingId}`,
            `${t('receipt.date')}: ${new Date(shipment.createdAt).toLocaleString()}`,
            `${t('receipt.route')}: ${shipment.from} → ${shipment.to}`,
            `${t('receipt.vehicle')}: ${shipment.vehicleType}`,
            `${t('receipt.paymentMode')}: ${PAYMENT_MODE_LABEL[shipment.paymentMode] ?? shipment.paymentMode}`,
            `${t('receipt.paymentStatus')}: ${shipment.paymentStatus}`,
            shipment.promoCode ? `${t('receipt.promoApplied')}: ${shipment.promoCode} (-₹${shipment.promoDiscount ?? 0})` : null,
            `${t('receipt.total')}: ₹${shipment.price}`,
        ].filter(Boolean).join('\n');
        Share.share({ message: lines });
    };

    if (isLoading || !shipment) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color={colors.PRIMARY} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
                    <ChevronLeft color={colors.TEXT_PRIMARY} size={24} />
                </Pressable>
                <Text style={styles.headerTitle}>{t('receipt.title')}</Text>
                <Pressable onPress={handleShare} hitSlop={12}>
                    <Share2 color={colors.PRIMARY} size={20} />
                </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.brand}>Kalanabha</Text>
                    <Text style={styles.trackingId}>{shipment.trackingId}</Text>

                    <View style={styles.divider} />

                    <Row label={t('receipt.date')} value={new Date(shipment.createdAt).toLocaleString()} styles={styles} />
                    <Row label={t('receipt.route')} value={`${shipment.from} → ${shipment.to}`} styles={styles} />
                    <Row label={t('receipt.vehicle')} value={shipment.vehicleType} styles={styles} />
                    <Row label={t('receipt.distance')} value={`${shipment.distanceKm} km`} styles={styles} />
                    <Row
                        label={t('receipt.paymentMode')}
                        value={PAYMENT_MODE_LABEL[shipment.paymentMode] ?? shipment.paymentMode}
                        styles={styles}
                    />
                    <Row
                        label={t('receipt.paymentStatus')}
                        value={shipment.paymentStatus}
                        styles={styles}
                        valueColor={
                            shipment.paymentStatus === 'PAID' ? colors.SUCCESS
                                : shipment.paymentStatus === 'REFUNDED' ? colors.WARNING
                                    : colors.GRAY
                        }
                    />

                    {shipment.promoCode && (
                        <Row
                            label={t('receipt.promoApplied')}
                            value={`${shipment.promoCode} (-₹${shipment.promoDiscount ?? 0})`}
                            styles={styles}
                            valueColor={colors.SUCCESS}
                        />
                    )}

                    <View style={styles.divider} />

                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>{t('receipt.total')}</Text>
                        <Text style={styles.totalValue}>₹{shipment.price}</Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const Row = ({ label, value, styles, valueColor }: {
    label: string;
    value: string;
    styles: ReturnType<typeof makeStyles>;
    valueColor?: string;
}) => (
    <View style={styles.row}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={[styles.rowValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
);

export default ReceiptScreen;

const makeStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.BACKGROUND },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.BACKGROUND },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 16, backgroundColor: colors.SURFACE,
        borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.BORDER,
    },
    headerTitle: { fontSize: 16, fontFamily: FONTS.BOLD_PRIMARY, color: colors.TEXT_PRIMARY },
    content: { padding: 16 },
    card: { backgroundColor: colors.SURFACE, borderRadius: 16, padding: 20 },
    brand: { fontSize: 18, fontFamily: FONTS.BOLD_PRIMARY, color: colors.PRIMARY, textAlign: 'center' },
    trackingId: { fontSize: 13, color: colors.GRAY, textAlign: 'center', marginTop: 4, marginBottom: 12 },
    divider: { height: 1, backgroundColor: colors.BORDER, marginVertical: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    rowLabel: { fontSize: 13, color: colors.GRAY, flex: 1 },
    rowValue: { fontSize: 13, color: colors.TEXT_PRIMARY, fontFamily: FONTS.MEDIUM_PRIMARY, flex: 1, textAlign: 'right' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalLabel: { fontSize: 16, fontFamily: FONTS.BOLD_PRIMARY, color: colors.TEXT_PRIMARY },
    totalValue: { fontSize: 20, fontFamily: FONTS.BOLD_PRIMARY, color: colors.PRIMARY },
});
