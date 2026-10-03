import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useMyNotifications,
} from '@features/notifications/hooks';
import type { BackendNotification } from '@features/notifications/types';
import { AsyncState } from '@components/AsyncState';
import { useAppTheme } from '@theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import FONTS from '@utils/fonts';
import { handleNotificationTap } from '@features/notifications/deepLink';


const NotificationScreen = () => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  
  
  
  
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors, insets), [colors, insets]);
  const {
    data: notifications,
    isLoading,
    isRefetching,
    refetch,
    error,
  } = useMyNotifications();
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead, isPending: markingAll } =
    useMarkAllNotificationsRead();

  
  
  const renderItem = ({ item }: { item: BackendNotification }) => (
    <Pressable
      style={[styles.card, !item.read && styles.cardUnread]}
      onPress={() => {
        if (!item.read) markRead(item.id);
        handleNotificationTap(item.type, item.shipmentId, item.ticketId);
      }}
    >
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.body}>{item.body}</Text>
      <Text style={styles.time}>
        {new Date(item.createdAt).toLocaleString()}
      </Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('notifications.title')}</Text>
        {!!notifications?.length && (
          <Pressable
            onPress={() => markAllRead()}
            disabled={markingAll}
            style={styles.markAllBtn}
          >
            {markingAll ? (
              <ActivityIndicator size="small" color={colors.PRIMARY} />
            ) : (
              <Text style={styles.markAllText}>
                {t('notifications.markAllRead')}
              </Text>
            )}
          </Pressable>
        )}
      </View>

      {}
      <AsyncState
        isLoading={isLoading && !notifications}
        error={error}
        onRetry={refetch}
        isEmpty={!notifications?.length}
        emptyTitle={t('notifications.noNotificationsYet')}
      >
        <FlatList
          data={notifications ?? []}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        />
      </AsyncState>
    </View>
  );
};

export default NotificationScreen;



const makeStyles = (
  colors: ReturnType<typeof useAppTheme>['colors'],
  insets: { top: number },
) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.BACKGROUND },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: insets.top + 14,
      paddingBottom: 14,
    },
    headerTitle: {
      fontSize: 18,
      fontFamily: FONTS.BOLD_PRIMARY,
      color: colors.TEXT_PRIMARY,
    },
    markAllBtn: {
      minWidth: 70,
      alignItems: 'flex-end',
      justifyContent: 'center',
    },
    markAllText: {
      color: colors.PRIMARY,
      fontSize: 13,
      fontFamily: FONTS.SEMI_BOLD_PRIMARY,
    },
    card: {
      backgroundColor: colors.SURFACE,
      marginHorizontal: 16,
      marginBottom: 10,
      padding: 14,
      borderRadius: 12,
    },
    cardUnread: { borderLeftWidth: 3, borderLeftColor: colors.PRIMARY },
    title: {
      fontSize: 14,
      fontFamily: FONTS.BOLD_PRIMARY,
      color: colors.TEXT_PRIMARY,
    },
    body: { fontSize: 13, color: colors.TEXT_SECONDARY, marginTop: 4 },
    time: { fontSize: 11, color: colors.GRAY, marginTop: 6 },
  });
