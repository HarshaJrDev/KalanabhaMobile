import React, { useMemo } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Check, Globe } from 'lucide-react-native';
import { useAppTheme } from '@theme/ThemeContext';
import { SUPPORTED_LANGUAGES, LANGUAGE_LABELS, setAppLanguage, type SupportedLanguage } from '../i18n';

interface Props {
    visible: boolean;
    onClose: () => void;
}

// Real, working language switch — persisted via services/storage
// (setStoredLanguage) and applied instantly through i18next, not a
// "coming soon" stub. Covers the four languages the product actually
// asked for: English, Hindi, Telugu, Tamil.
export const LanguagePickerModal: React.FC<Props> = ({ visible, onClose }) => {
    const { t, i18n } = useTranslation();
    const { colors, fonts } = useAppTheme();
    const styles = useMemo(() => makeStyles(colors, fonts), [colors, fonts]);

    const handleSelect = (lang: SupportedLanguage) => {
        setAppLanguage(lang);
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <Globe color={colors.PRIMARY} size={20} />
                        <Text style={styles.title}>{t('language.title')}</Text>
                    </View>
                    <Text style={styles.subtitle}>{t('language.subtitle')}</Text>

                    {SUPPORTED_LANGUAGES.map((lang) => {
                        const active = i18n.language === lang;
                        return (
                            <TouchableOpacity
                                key={lang}
                                style={[styles.row, active && styles.rowActive]}
                                onPress={() => handleSelect(lang)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.rowText, active && styles.rowTextActive]}>
                                    {LANGUAGE_LABELS[lang]}
                                </Text>
                                {active && <Check color={colors.PRIMARY} size={18} />}
                            </TouchableOpacity>
                        );
                    })}

                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <Text style={styles.closeBtnText}>{t('common.close')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const makeStyles = (
    colors: ReturnType<typeof useAppTheme>['colors'],
    fonts: ReturnType<typeof useAppTheme>['fonts'],
) => StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheet: {
        backgroundColor: colors.SURFACE,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 32,
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    title: { fontFamily: fonts.BOLD_PRIMARY, fontSize: 17, color: colors.TEXT_PRIMARY },
    subtitle: { fontFamily: fonts.PRIMARY, fontSize: 12.5, color: colors.TEXT_SECONDARY, marginBottom: 16 },
    row: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: 14, paddingHorizontal: 14,
        borderRadius: 12, borderWidth: 1, borderColor: colors.BORDER,
        marginBottom: 8,
    },
    rowActive: { borderColor: colors.PRIMARY, backgroundColor: colors.PRIMARY_LIGHT },
    rowText: { fontFamily: fonts.MEDIUM_PRIMARY, fontSize: 15, color: colors.TEXT_PRIMARY },
    rowTextActive: { fontFamily: fonts.BOLD_PRIMARY, color: colors.PRIMARY },
    closeBtn: { alignItems: 'center', paddingVertical: 12, marginTop: 4 },
    closeBtnText: { fontFamily: fonts.SEMI_BOLD_PRIMARY, fontSize: 14, color: colors.TEXT_SECONDARY },
});
