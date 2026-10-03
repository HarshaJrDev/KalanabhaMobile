














import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, ScanLine, QrCode } from 'lucide-react-native';
import { useMyShipments } from '@features/shipments/hooks';
import { showToast } from '@ui/alert/toastStore';
import { colors as BRAND } from '@config/theme';
import { useTranslation } from 'react-i18next';
import FONTS from '@utils/fonts';

const DUMMY_CODE = 'KL-DEMO-000000';

const QRScanScreen = () => {
    const navigation = useNavigation();
    const { t } = useTranslation();
    const { data: shipments, isLoading } = useMyShipments();
    const [scanning, setScanning] = useState(false);

    const simulateScan = () => {
        setScanning(true);

        
        
        setTimeout(() => {
            setScanning(false);

            const target = shipments?.[0];
            if (!target) {
                showToast(t('qrScan.noMatch', { code: DUMMY_CODE }), 'info');
                return;
            }

            showToast(t('qrScan.scanned', { trackingId: target.trackingId }), 'success');
            (navigation as any).navigate('ShipmentDetailsScreen', { id: target.id });
        }, 900);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
                    <ChevronLeft color="#fff" size={24} />
                </Pressable>
                <Text style={styles.headerTitle}>{t('qrScan.title')}</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.body}>
                <View style={styles.frame}>
                    {scanning ? (
                        <ActivityIndicator color="#fff" size="large" />
                    ) : (
                        <ScanLine color="#fff" size={64} />
                    )}
                </View>

                <Text style={styles.notice}>
                    {t('qrScan.notice')}
                </Text>

                <Pressable style={styles.scanBtn} onPress={simulateScan} disabled={scanning || isLoading}>
                    <QrCode color="#fff" size={18} />
                    <Text style={styles.scanBtnText}>{scanning ? t('qrScan.scanning') : t('qrScan.simulateScan')}</Text>
                </Pressable>
            </View>
        </View>
    );
};

export default QRScanScreen;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#111827' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        paddingTop: 24,
    },
    headerTitle: { fontSize: 16, fontFamily: FONTS.BOLD_PRIMARY, color: '#fff' },
    body: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        gap: 24,
    },
    frame: {
        width: 220,
        height: 220,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    notice: {
        fontSize: 13,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 19,
    },
    scanBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: BRAND.PRIMARY,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 14,
    },
    scanBtnText: { color: '#fff', fontFamily: FONTS.BOLD_PRIMARY, fontSize: 14 },
});
