// NewTicketScreen.tsx — Customer & Driver
//
// POST /support/tickets (kalanabhaBackend SupportController.create) — a
// real ticket the admin's SupportTicketsPage queue already handles, wired
// up on the mobile side for the first time.
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { useAppTheme } from '@theme/ThemeContext';
import { useCreateTicket } from '@features/support/hooks';
import { TICKET_CATEGORIES } from '@features/support/types';
import { showToast } from '@ui/alert/toastStore';
import { normalizeError } from '@utils/error';

const NewTicketScreen = () => {
    const navigation = useNavigation();
    const { colors, fonts, spacing, radius } = useAppTheme();
    const styles = useMemo(() => makeStyles(colors, fonts, spacing, radius), [colors, fonts, spacing, radius]);

    const [category, setCategory] = useState<string>(TICKET_CATEGORIES[0]);
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const { mutate: createTicket, isPending } = useCreateTicket();

    const canSubmit = subject.trim().length >= 3 && description.trim().length >= 10;

    const handleSubmit = () => {
        createTicket(
            { subject: subject.trim(), description: description.trim(), category },
            {
                onSuccess: () => {
                    showToast('Ticket raised — our team will get back to you', 'success');
                    navigation.goBack();
                },
                onError: (err) => showToast(normalizeError(err) || 'Failed to raise ticket', 'error'),
            },
        );
    };

    return (
        <View style={styles.root}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
                    <ArrowLeft color={colors.TEXT_PRIMARY} size={22} />
                </Pressable>
                <Text style={styles.headerTitle}>New Support Ticket</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.form}>
                <Text style={styles.label}>Category</Text>
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

                <Text style={styles.label}>Subject</Text>
                <TextInput
                    style={styles.input}
                    value={subject}
                    onChangeText={setSubject}
                    placeholder="Short summary of the issue"
                    placeholderTextColor={colors.GRAY}
                    maxLength={120}
                />

                <Text style={styles.label}>Description</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Tell us what happened, with any order details if relevant…"
                    placeholderTextColor={colors.GRAY}
                    multiline
                    maxLength={2000}
                />

                <Pressable
                    style={[styles.submitBtn, (!canSubmit || isPending) && styles.submitBtnDisabled]}
                    disabled={!canSubmit || isPending}
                    onPress={handleSubmit}
                >
                    {isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Raise Ticket</Text>}
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
) => StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.BACKGROUND },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingTop: 50,
        paddingBottom: spacing.md,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.SURFACE,
        borderWidth: 1,
        borderColor: colors.BORDER,
    },
    headerTitle: { fontFamily: fonts.BOLD_PRIMARY, fontSize: 16, color: colors.TEXT_PRIMARY },

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
