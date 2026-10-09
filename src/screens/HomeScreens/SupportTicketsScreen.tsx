






import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Linking } from 'react-native';
import { SkeletonList } from '@components/ui';
import { ScreenHeader } from '@components/ScreenHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  Plus,
  MessageSquareText,
  Clock,
  CheckCircle2,
  XCircle,
  Phone,
} from 'lucide-react-native';
import { useAppTheme } from '@theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useMyTickets } from '@features/support/hooks';
import { useBusinessSettings } from '@features/settings/hooks';
import type { SupportTicket, TicketStatus } from '@features/support/types';
import { EmptyState } from '@components/EmptyState';
import { showToast } from '@ui/alert/toastStore';

const makeStatusMeta = (
  t: (key: string) => string,
): Record<
  TicketStatus,
  { label: string; icon: typeof Clock; color: 'warning' | 'success' | 'muted' }
> => ({
  OPEN: { label: t('support.statusOpen'), icon: Clock, color: 'warning' },
  IN_PROGRESS: {
    label: t('support.statusInProgress'),
    icon: MessageSquareText,
    color: 'warning',
  },
  RESOLVED: {
    label: t('support.statusResolved'),
    icon: CheckCircle2,
    color: 'success',
  },
  CLOSED: { label: t('support.statusClosed'), icon: XCircle, color: 'muted' },
});

const SupportTicketsScreen = () => {
  const navigation = useNavigation();
  const { colors, fonts, spacing, radius } = useAppTheme();
  
  
  
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => makeStyles(colors, fonts, spacing, radius, insets),
    [colors, fonts, spacing, radius, insets],
  );
  const { t } = useTranslation();
  const STATUS_META = useMemo(() => makeStatusMeta(t), [t]);

  const { data: tickets, isLoading } = useMyTickets();
  const { data: businessSettings } = useBusinessSettings();

  
  
  const handleCallSupport = () => {
    const phone = businessSettings?.find((s) => s.key === 'support_phone')?.value;
    const supportEmail = businessSettings?.find((s) => s.key === 'support_email')?.value;
    if (phone) {
      Linking.openURL(`tel:${phone}`).catch(() => showToast(t('support.couldNotCall'), 'error'));
      return;
    }
    if (supportEmail) {
      Linking.openURL(`mailto:${supportEmail}`).catch(() => showToast(t('support.couldNotCall'), 'error'));
    }
  };

  const renderItem = ({ item }: { item: SupportTicket }) => {
    const meta = STATUS_META[item.status];
    const StatusIcon = meta.icon;
    const statusColor =
      meta.color === 'success'
        ? colors.SUCCESS
        : meta.color === 'warning'
        ? colors.WARNING
        : colors.GRAY;
    return (
      <Pressable
        style={styles.card}
        onPress={() =>
          (navigation as any).navigate('TicketDetail', { id: item.id })
        }
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.cardSubject} numberOfLines={1}>
            {item.subject}
          </Text>
          <Text style={styles.cardCategory}>{item.category}</Text>
        </View>
        <View style={styles.statusPill}>
          <StatusIcon size={12} color={statusColor} />
          <Text style={[styles.statusPillText, { color: statusColor }]}>
            {meta.label}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.root}>
      <ScreenHeader
        title={t('support.myTickets')}
        rightSlot={
          <Pressable onPress={handleCallSupport} hitSlop={12}>
            <Phone color={colors.PRIMARY} size={20} />
          </Pressable>
        }
      />

      {isLoading ? (
        <SkeletonList />
      ) : (
        <FlatList
          showsVerticalScrollIndicator={false}
          data={tickets ?? []}
          keyExtractor={t => t.id}
          contentContainerStyle={styles.list}
          renderItem={renderItem}
          ListEmptyComponent={
            <EmptyState variant="ticket" title={t('support.noTicketsYet')} />
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
  insets: { top: number },
) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.BACKGROUND },

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
    cardSubject: {
      fontFamily: fonts.SEMI_BOLD_PRIMARY,
      fontSize: 14,
      color: colors.TEXT_PRIMARY,
    },
    cardCategory: {
      fontFamily: fonts.PRIMARY,
      fontSize: 12,
      color: colors.TEXT_SECONDARY,
      marginTop: 2,
    },
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
