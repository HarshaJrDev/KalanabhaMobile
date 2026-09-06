// SupportTicketsScreen.tsx — Customer & Driver
//
// Real backend contract (kalanabhaBackend SupportController — full ticket
// lifecycle, already used by the admin panel's SupportTicketsPage) that
// had no mobile UI at all before this. Profile.tsx's "Help Center" only
// opened a mailto: link; this is a real "My Tickets" list + "New Ticket"
// entry point.
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Plus, MessageSquareText, Clock, CheckCircle2, XCircle } from 'lucide-react-native';
import { useAppTheme } from '@theme/ThemeContext';
import { useMyTickets } from '@features/support/hooks';
import type { SupportTicket, TicketStatus } from '@features/support/types';

const STATUS_META: Record<TicketStatus, { label: string; icon: typeof Clock; color: 'warning' | 'success' | 'muted' }> = {
    OPEN: { label: 'Open', icon: Clock, color: 'warning' },
    IN_PROGRESS: { label: 'In Progress', icon: MessageSquareText, color: 'warning' },
    RESOLVED: { label: 'Resolved', icon: CheckCircle2, color: 'success' },
    CLOSED: { label: 'Closed', icon: XCircle, color: 'muted' },
};

const SupportTicketsScreen = () => {
    const navigation = useNavigation();
    const { colors, fonts, spacing, radius } = useAppTheme();
    const styles = useMemo(() => makeStyles(colors, fonts, spacing, radius), [colors, fonts, spacing, radius]);

    const { data: tickets, isLoading } = useMyTickets();

    const renderItem = ({ item }: { item: SupportTicket }) => {
        const meta = STATUS_META[item.status];
        const StatusIcon = meta.icon;
        const statusColor = meta.color === 'success' ? colors.SUCCESS : meta.color === 'warning' ? colors.WARNING : colors.GRAY;
        return (
            <Pressable
                style={styles.card}
                onPress={() => (navigation as any).navigate('TicketDetail', { id: item.id })}
            >
                <View style={{ flex: 1 }}>
                    <Text style={styles.cardSubject} numberOfLines={1}>{item.subject}</Text>
                    <Text style={styles.cardCategory}>{item.category}</Text>
                </View>
                <View style={styles.statusPill}>
                    <StatusIcon size={12} color={statusColor} />
                    <Text style={[styles.statusPillText, { color: statusColor }]}>{meta.label}</Text>
                </View>
            </Pressable>
        );
    };

    return (
        <View style={styles.root}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
                    <ArrowLeft color={colors.TEXT_PRIMARY} size={22} />
                </Pressable>
                <Text style={styles.headerTitle}>My Support Tickets</Text>
                <View style={{ width: 40 }} />
            </View>

            {isLoading ? (
                <View style={styles.centerState}>
                    <ActivityIndicator size="large" color={colors.PRIMARY} />
                </View>
            ) : (
                <FlatList
                    data={tickets ?? []}
                    keyExtractor={(t) => t.id}
                    contentContainerStyle={styles.list}
                    renderItem={renderItem}
                    ListEmptyComponent={
                        <View style={styles.centerState}>
                            <MessageSquareText color={colors.GRAY} size={40} />
                            <Text style={styles.emptyText}>No support tickets yet</Text>
                        </View>
                    }
                />
            )}

            <Pressable
                style={styles.fab}
                onPress={() => (navigation as any).navigate('NewTicket')}
            >
                <Plus color="#fff" size={22} />
            </Pressable>
        </View>
    );
};

export default SupportTicketsScreen;

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

    centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 60 },
    emptyText: { fontFamily: fonts.PRIMARY, fontSize: 13, color: colors.GRAY },

    list: { padding: spacing.lg, gap: spacing.sm, flexGrow: 1 },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        backgroundColor: colors.SURFACE,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.BORDER,
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    cardSubject: { fontFamily: fonts.SEMI_BOLD_PRIMARY, fontSize: 14, color: colors.TEXT_PRIMARY },
    cardCategory: { fontFamily: fonts.PRIMARY, fontSize: 12, color: colors.TEXT_SECONDARY, marginTop: 2 },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: colors.BACKGROUND,
    },
    statusPillText: { fontFamily: fonts.SEMI_BOLD_PRIMARY, fontSize: 11 },

    fab: {
        position: 'absolute',
        right: spacing.lg,
        bottom: spacing.xl,
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: colors.PRIMARY,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
});
