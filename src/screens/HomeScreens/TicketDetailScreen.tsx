// TicketDetailScreen.tsx — Customer & Driver
//
// GET /support/tickets/:id + POST /support/tickets/:id/messages
// (kalanabhaBackend SupportController) — the real message thread between
// the ticket raiser and support staff, previously visible only from the
// admin panel's SupportTicketsPage.
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ArrowLeft, Send } from 'lucide-react-native';
import { useAppTheme } from '@theme/ThemeContext';
import { useAuthStore } from '@features/store/authStore';
import { useTicket, useAddTicketMessage } from '@features/support/hooks';
import type { SupportTicketMessage, TicketStatus } from '@features/support/types';
import { showToast } from '@ui/alert/toastStore';
import { normalizeError } from '@utils/error';

const STATUS_LABEL: Record<TicketStatus, string> = {
    OPEN: 'Open',
    IN_PROGRESS: 'In Progress',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed',
};

type RouteParams = { id: string };

const TicketDetailScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
    const ticketId = route?.params?.id;
    const { colors, fonts, spacing, radius } = useAppTheme();
    const styles = useMemo(() => makeStyles(colors, fonts, spacing, radius), [colors, fonts, spacing, radius]);
    const currentUserId = useAuthStore((s) => s.user?.id);

    const { data: ticket, isLoading } = useTicket(ticketId);
    const { mutate: sendMessage, isPending: sending } = useAddTicketMessage(ticketId ?? '');
    const [draft, setDraft] = useState('');

    const isClosed = ticket?.status === 'CLOSED' || ticket?.status === 'RESOLVED';

    const handleSend = () => {
        const text = draft.trim();
        if (!text) return;
        setDraft('');
        sendMessage(text, {
            onError: (err) => showToast(normalizeError(err) || 'Failed to send message', 'error'),
        });
    };

    const renderMessage = ({ item }: { item: SupportTicketMessage }) => {
        const isMine = item.senderId === currentUserId;
        return (
            <View style={[styles.messageRow, isMine && styles.messageRowMine]}>
                <View style={[styles.messageBubble, isMine ? styles.messageBubbleMine : styles.messageBubbleTheirs]}>
                    {!isMine && <Text style={styles.messageSender}>{item.senderName}</Text>}
                    <Text style={[styles.messageText, isMine && styles.messageTextMine]}>{item.text}</Text>
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
                    <ArrowLeft color={colors.TEXT_PRIMARY} size={22} />
                </Pressable>
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <Text style={styles.headerTitle} numberOfLines={1}>{ticket?.subject ?? 'Ticket'}</Text>
                    {ticket && <Text style={styles.headerStatus}>{STATUS_LABEL[ticket.status]}</Text>}
                </View>
            </View>

            {isLoading || !ticket ? (
                <View style={styles.centerState}>
                    <ActivityIndicator size="large" color={colors.PRIMARY} />
                </View>
            ) : (
                <FlatList
                    data={ticket.messages ?? []}
                    keyExtractor={(m) => m.id}
                    contentContainerStyle={styles.list}
                    renderItem={renderMessage}
                    ListHeaderComponent={
                        <View style={styles.descriptionCard}>
                            <Text style={styles.descriptionText}>{ticket.description}</Text>
                        </View>
                    }
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No replies yet — support will respond here.</Text>
                    }
                />
            )}

            {!isClosed && (
                <View style={styles.composerRow}>
                    <TextInput
                        style={styles.composerInput}
                        value={draft}
                        onChangeText={setDraft}
                        placeholder="Type a message…"
                        placeholderTextColor={colors.GRAY}
                        multiline
                    />
                    <Pressable style={styles.sendBtn} onPress={handleSend} disabled={sending || !draft.trim()}>
                        {sending ? <ActivityIndicator size="small" color="#fff" /> : <Send size={18} color="#fff" />}
                    </Pressable>
                </View>
            )}
        </KeyboardAvoidingView>
    );
};

export default TicketDetailScreen;

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
    headerTitle: { fontFamily: fonts.BOLD_PRIMARY, fontSize: 15, color: colors.TEXT_PRIMARY },
    headerStatus: { fontFamily: fonts.PRIMARY, fontSize: 11, color: colors.TEXT_SECONDARY, marginTop: 1 },

    centerState: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    list: { padding: spacing.lg, gap: spacing.sm, flexGrow: 1 },
    descriptionCard: {
        backgroundColor: colors.SURFACE,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.BORDER,
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    descriptionText: { fontFamily: fonts.PRIMARY, fontSize: 13, color: colors.TEXT_PRIMARY, lineHeight: 19 },
    emptyText: { fontFamily: fonts.PRIMARY, fontSize: 12, color: colors.GRAY, textAlign: 'center', marginTop: spacing.lg },

    messageRow: { flexDirection: 'row', marginBottom: spacing.sm },
    messageRowMine: { justifyContent: 'flex-end' },
    messageBubble: { maxWidth: '80%', borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
    messageBubbleTheirs: { backgroundColor: colors.SURFACE, borderWidth: 1, borderColor: colors.BORDER },
    messageBubbleMine: { backgroundColor: colors.PRIMARY },
    messageSender: { fontFamily: fonts.SEMI_BOLD_PRIMARY, fontSize: 11, color: colors.TEXT_SECONDARY, marginBottom: 2 },
    messageText: { fontFamily: fonts.PRIMARY, fontSize: 13, color: colors.TEXT_PRIMARY },
    messageTextMine: { color: '#fff' },

    composerRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: spacing.sm,
        padding: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.BORDER,
        backgroundColor: colors.BACKGROUND,
    },
    composerInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: colors.BORDER,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        fontFamily: fonts.MEDIUM_PRIMARY,
        fontSize: 13,
        color: colors.TEXT_PRIMARY,
        backgroundColor: colors.SURFACE,
        maxHeight: 100,
    },
    sendBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: colors.PRIMARY,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
