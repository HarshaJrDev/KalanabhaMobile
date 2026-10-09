




import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { ScreenHeader } from '@components/ScreenHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppTheme } from '@theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useCreateTicket } from '@features/support/hooks';
import { TICKET_CATEGORIES } from '@features/support/types';
import { showToast } from '@ui/alert/toastStore';
import { normalizeError } from '@utils/error';

const NewTicketScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { colors, fonts, spacing, radius } = useAppTheme();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => makeStyles(colors, fonts, spacing, radius, insets), [colors, fonts, spacing, radius, insets]);
    const { t } = useTranslation();

    
    
    
    
    
    const [category, setCategory] = useState<string>(route.params?.prefillCategory ?? TICKET_CATEGORIES[0]);
    const [subject, setSubject] = useState(route.params?.prefillSubject ?? '');
    const [description, setDescription] = useState(route.params?.prefillDescription ?? '');
    const { mutate: createTicket, isPending } = useCreateTicket();

    const canSubmit = subject.trim().length >= 3 && description.trim().length >= 10;

    const handleSubmit = () => {
        createTicket(
            { subject: subject.trim(), description: description.trim(), category },
            {
                onSuccess: () => {
                    showToast(t('support.ticketRaised'), 'success');
                    navigation.goBack();
                },
                onError: (err) => showToast(normalizeError(err) || t('support.failedToRaise'), 'error'),
            },
        );
    };

    return (
        <View style={styles.root}>
            <ScreenHeader title={t('support.newTicket')} />

            <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
                <Text style={styles.label}>{t('support.category')}</Text>
                <View style={styles.categoryRow}>
                    {TICKET_CATEGORIES.map((c) => (
                        <Pressable
                            key={c}
                            style={[styles.categoryChip, category === c && styles.categoryChipActive]}
                            onPress={() => setCategory(c)}
                        >
                            <Text style={[styles.categoryChipText, category === c && styles.categoryChipTextActive]}>{c}</Text>
                        </Pressable>
                    ))}
                </View>

                <Text style={styles.label}>{t('support.subject')}</Text>
                <TextInput
                    style={styles.input}
                    value={subject}
                    onChangeText={setSubject}
                    placeholder={t('support.subjectPlaceholder')}
                    placeholderTextColor={colors.GRAY}
                    maxLength={120}
                />

                <Text style={styles.label}>{t('support.description')}</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder={t('support.descriptionPlaceholder')}
                    placeholderTextColor={colors.GRAY}
                    multiline
                    maxLength={2000}
                />

                <Pressable
                    style={[styles.submitBtn, (!canSubmit || isPending) && styles.submitBtnDisabled]}
                    disabled={!canSubmit || isPending}
                    onPress={handleSubmit}
                >
                    {isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{t('support.raiseTicket')}</Text>}
                </Pressable>
            </ScrollView>
        </View>
    );
};

export default NewTicketScreen;

const makeStyles = (
    colors: ReturnType<typeof useAppTheme>['colors'],
    fonts: ReturnType<typeof useAppTheme>['fonts'],
    spacing: ReturnType<typeof useAppTheme>['spacing'],
    radius: ReturnType<typeof useAppTheme>['radius'],
    insets: { top: number },
) => StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.BACKGROUND },

    form: { padding: spacing.lg, paddingBottom: 60 },
    label: { fontFamily: fonts.SEMI_BOLD_PRIMARY, fontSize: 13, color: colors.TEXT_PRIMARY, marginBottom: spacing.sm, marginTop: spacing.md },
    categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    categoryChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm - 2,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.BORDER,
        backgroundColor: colors.SURFACE,
    },
    categoryChipActive: { backgroundColor: colors.PRIMARY, borderColor: colors.PRIMARY },
    categoryChipText: { fontFamily: fonts.MEDIUM_PRIMARY, fontSize: 12, color: colors.TEXT_SECONDARY },
    categoryChipTextActive: { color: '#fff' },
    input: {
        borderWidth: 1,
        borderColor: colors.BORDER,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm + 2,
        fontFamily: fonts.MEDIUM_PRIMARY,
        fontSize: 13,
        color: colors.TEXT_PRIMARY,
        backgroundColor: colors.SURFACE,
    },
    textArea: { minHeight: 120, textAlignVertical: 'top' },
    submitBtn: {
        marginTop: spacing.xl,
        backgroundColor: colors.PRIMARY,
        borderRadius: radius.md,
        paddingVertical: spacing.md,
        alignItems: 'center',
    },
    submitBtnDisabled: { opacity: 0.5 },
    submitBtnText: { fontFamily: fonts.SEMI_BOLD_PRIMARY, fontSize: 14, color: '#fff' },
});
