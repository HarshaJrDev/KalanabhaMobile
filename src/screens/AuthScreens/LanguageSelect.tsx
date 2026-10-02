// LanguageSelect.tsx — shown exactly once, the first time the app is
// opened (Splash routes here only when getStoredLanguage() is still null;
// every later launch skips straight to OnBoarding). Picking a language is
// optional here — English is pre-selected so "Next" always works — this
// is just making the choice visible up front instead of silently
// defaulting to English with no way to discover Profile > Language later.
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, Globe } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAppTheme } from '@theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, LANGUAGE_LABELS, setAppLanguage, type SupportedLanguage } from '../../i18n';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'LanguageSelect'>;

const LanguageSelect = () => {
    const navigation = useNavigation<NavProp>();
    const { colors, fonts, fontSize, spacing, radius, isDark } = useAppTheme();
    const { t, i18n } = useTranslation();
    const styles = useMemoStyles(colors, fonts, fontSize, spacing, radius);
    const [selected, setSelected] = useState<SupportedLanguage>(i18n.language as SupportedLanguage);

    const handleContinue = () => {
        setAppLanguage(selected);
        navigation.replace('OnBoarding');
    };

    return (
        <View style={styles.root}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.BACKGROUND} />
            <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
                <View style={styles.header}>
                    <View style={styles.iconWrap}>
                        <Globe color={colors.PRIMARY} size={26} />
                    </View>
                    <Text style={styles.title}>{t('language.title')}</Text>
                    <Text style={styles.subtitle}>{t('language.subtitle')}</Text>
                </View>

                <View style={styles.list}>
                    {SUPPORTED_LANGUAGES.map((lang) => {
                        const active = selected === lang;
                        return (
                            <Pressable
                                key={lang}
                                style={[styles.row, active && styles.rowActive]}
                                onPress={() => setSelected(lang)}
                                accessibilityRole="radio"
                                accessibilityState={{ selected: active }}
                            >
                                <Text style={[styles.rowText, active && styles.rowTextActive]}>
                                    {LANGUAGE_LABELS[lang]}
                                </Text>
                                {active && <Check color={colors.PRIMARY} size={18} />}
                            </Pressable>
                        );
                    })}
                </View>

                <Pressable onPress={handleContinue} style={styles.button}>
                    <Text style={styles.buttonText}>{t('common.next')}</Text>
                </Pressable>
            </SafeAreaView>
        </View>
    );
};

export default LanguageSelect;

const useMemoStyles = (
    colors: ReturnType<typeof useAppTheme>['colors'],
    fonts: ReturnType<typeof useAppTheme>['fonts'],
    fontSize: ReturnType<typeof useAppTheme>['fontSize'],
    spacing: ReturnType<typeof useAppTheme>['spacing'],
    radius: ReturnType<typeof useAppTheme>['radius'],
) => React.useMemo(() => makeStyles(colors, fonts, fontSize, spacing, radius), [colors, fonts, fontSize, spacing, radius]);

const makeStyles = (
    colors: ReturnType<typeof useAppTheme>['colors'],
    fonts: ReturnType<typeof useAppTheme>['fonts'],
    fontSize: ReturnType<typeof useAppTheme>['fontSize'],
    spacing: ReturnType<typeof useAppTheme>['spacing'],
    radius: ReturnType<typeof useAppTheme>['radius'],
) => StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.BACKGROUND },
    safe: { flex: 1, paddingHorizontal: spacing.xl, justifyContent: 'space-between' },
    header: { alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.xl },
    iconWrap: {
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: colors.PRIMARY_LIGHT,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: spacing.md,
    },
    title: { fontFamily: fonts.BOLD_PRIMARY, fontSize: 24, color: colors.TEXT_PRIMARY, textAlign: 'center' },
    subtitle: {
        fontFamily: fonts.MEDIUM_PRIMARY,
        fontSize: fontSize.md,
        color: colors.TEXT_SECONDARY,
        textAlign: 'center',
        marginTop: spacing.sm,
        paddingHorizontal: spacing.lg,
    },
    list: { flex: 1, gap: spacing.md },
    row: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: 16, paddingHorizontal: spacing.lg,
        borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.BORDER,
        backgroundColor: colors.SURFACE,
    },
    rowActive: { borderColor: colors.PRIMARY, backgroundColor: colors.PRIMARY_LIGHT },
    rowText: { fontFamily: fonts.MEDIUM_PRIMARY, fontSize: fontSize.lg, color: colors.TEXT_PRIMARY },
    rowTextActive: { fontFamily: fonts.BOLD_PRIMARY, color: colors.PRIMARY },
    button: {
        borderRadius: radius.md,
        paddingVertical: 17,
        alignItems: 'center',
        backgroundColor: colors.PRIMARY,
        marginBottom: spacing.sm,
    },
    buttonText: { fontFamily: fonts.BOLD_PRIMARY, fontSize: fontSize.xl, color: '#fff' },
});
