import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSuccessModalStore } from './successModalStore';
import { Illustration } from '@components/Illustration';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@theme/ThemeContext';
import { hapticSuccess } from '@utils/haptics';




export const GlobalSuccessModal: React.FC = () => {
    const open = useSuccessModalStore(s => s.open);
    const illustration = useSuccessModalStore(s => s.illustration);
    const title = useSuccessModalStore(s => s.title);
    const message = useSuccessModalStore(s => s.message);
    const buttonLabel = useSuccessModalStore(s => s.buttonLabel);
    const { colors, fonts } = useAppTheme();
    const { t } = useTranslation();
    const styles = React.useMemo(() => makeStyles(colors, fonts), [colors, fonts]);

    const close = () => useSuccessModalStore.setState({ open: false });

    return (
        <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
            <View style={styles.overlay}>
                <View style={styles.card}>
                    {open && illustration && <Illustration source={illustration} size={160} />}
                    <Text style={styles.title}>{title}</Text>
                    {!!message && <Text style={styles.message}>{message}</Text>}
                    <TouchableOpacity
                        style={styles.button}
                        activeOpacity={0.85}
                        onPress={() => {
                            hapticSuccess();
                            close();
                        }}
                    >
                        <Text style={styles.buttonText}>{buttonLabel || t('common.ok')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const makeStyles = (
    colors: ReturnType<typeof useAppTheme>['colors'],
    fonts: ReturnType<typeof useAppTheme>['fonts'],
) =>
    StyleSheet.create({
        overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 28 },
        card: { width: '100%', maxWidth: 360, backgroundColor: colors.SURFACE, borderRadius: 20, padding: 24, alignItems: 'center' },
        title: { fontSize: 17, fontFamily: fonts.BOLD_PRIMARY, color: colors.TEXT_PRIMARY, marginTop: 8, textAlign: 'center' },
        message: { fontSize: 13.5, fontFamily: fonts.PRIMARY, color: colors.TEXT_SECONDARY, textAlign: 'center', marginTop: 8, lineHeight: 19 },
        button: { backgroundColor: colors.PRIMARY, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 32, marginTop: 20, alignSelf: 'stretch', alignItems: 'center' },
        buttonText: { color: '#fff', fontSize: 14.5, fontFamily: fonts.BOLD_PRIMARY },
    });
