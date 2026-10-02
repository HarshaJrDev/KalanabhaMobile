import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useConfirmStore } from './confirmStore';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@theme/ThemeContext';

// Mounted once at the app root (App.tsx), same pattern as GlobalToast and
// GlobalDeliveryOtpModal — every destructive/confirm action (logout,
// delete address, cancel shipment) calls confirmDialog({...}) from a
// plain callback and awaits the answer, instead of each screen reaching
// for the OS's own unthemed Alert.alert.
export const GlobalConfirmDialog: React.FC = () => {
    const open = useConfirmStore((s) => s.open);
    const title = useConfirmStore((s) => s.title);
    const message = useConfirmStore((s) => s.message);
    const confirmText = useConfirmStore((s) => s.confirmText);
    const cancelText = useConfirmStore((s) => s.cancelText);
    const destructive = useConfirmStore((s) => s.destructive);
    const resolve = useConfirmStore((s) => s.resolve);
    const { colors, fonts } = useAppTheme();
    const { t } = useTranslation();
    const styles = React.useMemo(() => makeStyles(colors, fonts), [colors, fonts]);

    const close = (confirmed: boolean) => {
        useConfirmStore.setState({ open: false, resolve: null });
        resolve?.(confirmed);
    };

    return (
        <Modal visible={open} transparent animationType="fade" onRequestClose={() => close(false)}>
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <Text style={styles.title}>{title}</Text>
                    {!!message && <Text style={styles.message}>{message}</Text>}
                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => close(false)}>
                            <Text style={styles.cancelText}>{cancelText || t('common.cancel')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.confirmBtn, destructive && styles.confirmBtnDestructive]}
                            onPress={() => close(true)}
                        >
                            <Text style={styles.confirmText}>{confirmText || t('common.confirm')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const makeStyles = (
    colors: ReturnType<typeof useAppTheme>['colors'],
    fonts: ReturnType<typeof useAppTheme>['fonts'],
) => StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 28 },
    card: { width: '100%', maxWidth: 360, backgroundColor: colors.SURFACE, borderRadius: 18, padding: 22 },
    title: { fontSize: 16.5, fontFamily: fonts.BOLD_PRIMARY, color: colors.TEXT_PRIMARY, marginBottom: 6 },
    message: { fontSize: 13.5, fontFamily: fonts.PRIMARY, color: colors.TEXT_SECONDARY, lineHeight: 19, marginBottom: 18 },
    actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
    cancelBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center', backgroundColor: colors.BACKGROUND, borderWidth: 1, borderColor: colors.BORDER },
    cancelText: { fontSize: 14, fontFamily: fonts.SEMI_BOLD_PRIMARY, color: colors.TEXT_SECONDARY },
    confirmBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center', backgroundColor: colors.PRIMARY },
    confirmBtnDestructive: { backgroundColor: colors.ERROR },
    confirmText: { fontSize: 14, fontFamily: fonts.SEMI_BOLD_PRIMARY, color: '#fff' },
});
