import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useDeliveryOtpStore } from './deliveryOtpStore';
import { useTranslation } from 'react-i18next';
import FONTS from '@utils/fonts';

// Mounted once at the app root (App.tsx), same pattern as GlobalToast — the
// driver's "Start delivery" and "Complete delivery" flows
// (LogisticsCardList.tsx) both call requestOtp('pickup' | 'delivery') from
// a plain callback and await whatever the driver types here. Real
// verification happens server-side (DispatchService.startDelivery /
// completeDelivery); this is just the input surface.
export const GlobalDeliveryOtpModal: React.FC = () => {
    const open = useDeliveryOtpStore((s) => s.open);
    const kind = useDeliveryOtpStore((s) => s.kind);
    const resolve = useDeliveryOtpStore((s) => s.resolve);
    const [otp, setOtp] = useState('');
    const { t } = useTranslation();

    const close = (value: string | null) => {
        useDeliveryOtpStore.setState({ open: false, resolve: null });
        setOtp('');
        resolve?.(value);
    };

    return (
        <Modal visible={open} transparent animationType="fade" onRequestClose={() => close(null)}>
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <Text style={styles.title}>{kind === 'pickup' ? t('deliveryOtpModal.enterPickupOtp') : t('deliveryOtpModal.enterDeliveryOtp')}</Text>
                    <Text style={styles.subtitle}>
                        {kind === 'pickup'
                            ? t('deliveryOtpModal.askPickupOtp')
                            : t('deliveryOtpModal.askDeliveryOtp')}
                    </Text>
                    <TextInput
                        style={styles.input}
                        value={otp}
                        onChangeText={(t) => setOtp(t.replace(/[^0-9]/g, '').slice(0, 4))}
                        keyboardType="number-pad"
                        maxLength={4}
                        placeholder="0000"
                        placeholderTextColor="#9CA3AF"
                        autoFocus
                    />
                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => close(null)}>
                            <Text style={styles.cancelText}>{t('deliveryOtpModal.cancel')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.confirmBtn, otp.length !== 4 && styles.confirmBtnDisabled]}
                            disabled={otp.length !== 4}
                            onPress={() => close(otp)}
                        >
                            <Text style={styles.confirmText}>{t('deliveryOtpModal.confirm')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    card: { width: '100%', maxWidth: 360, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20 },
    title: { fontSize: 16, fontFamily: FONTS.BOLD_PRIMARY, color: '#111827', marginBottom: 6 },
    subtitle: { fontSize: 12, fontFamily: FONTS.PRIMARY, color: '#6B7280', marginBottom: 16 },
    input: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        fontSize: 22,
        fontFamily: FONTS.BOLD_PRIMARY,
        color: '#111827',
        letterSpacing: 8,
        textAlign: 'center',
        marginBottom: 18,
    },
    actions: { flexDirection: 'row', gap: 10 },
    cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: '#F3F4F6' },
    cancelText: { fontSize: 14, fontFamily: FONTS.SEMI_BOLD_PRIMARY, color: '#374151' },
    confirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: '#FF7518' },
    confirmBtnDisabled: { backgroundColor: '#FDBA8C' },
    confirmText: { fontSize: 14, fontFamily: FONTS.SEMI_BOLD_PRIMARY, color: '#FFFFFF' },
});
