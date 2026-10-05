import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { X } from 'lucide-react-native';
import { AppBottomSheet, type AppBottomSheetRef } from '@components/ui/AppBottomSheet';
import AppTextInput from '@components/ui/AppTextInput';
import AppButton from '@components/ui/AppButton';
import { useUpdateBankDetails } from '@hooks/useUpdateBankDetails';
import { showToast } from '@ui/alert/toastStore';
import { useTranslation } from 'react-i18next';

interface BankDetailsModalProps {
    visible: boolean;
    onClose: () => void;
}

// Real RazorpayX transfer destination — without this on file, every
// payout DriverPayoutsService.createPayout records stays
// PENDING_TRANSFER forever (the ledger entry exists, the money just
// never moves). See kalanabhaBackend's PaymentsService.transferPayout.
export const BankDetailsModal: React.FC<BankDetailsModalProps> = ({ visible, onClose }) => {
    const { t } = useTranslation();
    const sheetRef = useRef<AppBottomSheetRef>(null);
    const { mutate, isPending } = useUpdateBankDetails();

    const [accountHolderName, setAccountHolderName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [ifsc, setIfsc] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (visible) {
            setError(null);
            sheetRef.current?.present();
        } else {
            sheetRef.current?.dismiss();
        }
    }, [visible]);

    const handleSave = () => {
        if (!accountHolderName.trim() || !accountNumber.trim() || !ifsc.trim()) {
            setError(t('bankDetails.allFieldsRequired'));
            return;
        }
        setError(null);

        mutate(
            {
                bankAccountHolderName: accountHolderName.trim(),
                bankAccountNumber: accountNumber.trim(),
                bankIfsc: ifsc.trim().toUpperCase(),
            },
            {
                onSuccess: () => {
                    showToast(t('bankDetails.saved'), 'success');
                    onClose();
                },
                onError: (err: any) => setError(err?.message ?? t('bankDetails.saveFailed')),
            },
        );
    };

    return (
        <AppBottomSheet ref={sheetRef} onDismiss={onClose}>
            <View style={styles.header}>
                <Text style={styles.title}>{t('bankDetails.title')}</Text>
                <TouchableOpacity onPress={onClose} hitSlop={10}>
                    <X color="#6B7280" size={22} />
                </TouchableOpacity>
            </View>
            <Text style={styles.subtitle}>{t('bankDetails.subtitle')}</Text>

            <View style={styles.form}>
                <AppTextInput
                    label={t('bankDetails.accountHolderName')}
                    value={accountHolderName}
                    onChange={setAccountHolderName}
                />
                <AppTextInput
                    label={t('bankDetails.accountNumber')}
                    value={accountNumber}
                    onChange={setAccountNumber}
                    keyboardType="number-pad"
                />
                <AppTextInput
                    label={t('bankDetails.ifsc')}
                    value={ifsc}
                    onChange={setIfsc}
                    autoCapitalize="characters"
                />
                {!!error && <Text style={styles.error}>{error}</Text>}
            </View>

            <AppButton
                title={isPending ? t('bankDetails.saving') : t('bankDetails.save')}
                onPress={handleSave}
                loading={isPending}
                disabled={isPending}
            />
        </AppBottomSheet>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    title: { fontSize: 18, fontWeight: '700', color: '#111827' },
    subtitle: { fontSize: 13, color: '#6B7280', marginBottom: 16, lineHeight: 18 },
    form: { gap: 14, marginBottom: 20 },
    error: { color: '#DC2626', fontSize: 13 },
});
