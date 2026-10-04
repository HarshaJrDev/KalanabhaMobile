







import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { SkeletonList } from '@components/ui';
import { ScreenHeader } from '@components/ScreenHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Briefcase,
  Home as HomeIcon,
  Hotel,
  MapPin,
  Pencil,
  Plus,
  Star,
  Trash2,
} from 'lucide-react-native';
import { useAppTheme } from '@theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import {
  useSavedAddresses,
  useSetDefaultSavedAddress,
  useDeleteSavedAddress,
} from '@features/savedAddresses/hooks';
import type {
  SavedAddress,
  SavedAddressType,
} from '@features/savedAddresses/types';
import { AddressFormModal } from '@components/AddressFormModal';
import { EmptyState } from '@components/EmptyState';
import { normalizeError } from '@utils/error';
import { showToast } from '@ui/alert/toastStore';
import { confirmDialog } from '@ui/alert/confirmStore';

const TYPE_ICON: Record<SavedAddressType, typeof HomeIcon> = {
  HOME: HomeIcon,
  WORK: Briefcase,
  HOTEL: Hotel,
  OTHER: MapPin,
};

const SavedAddressesScreen = () => {
  const { colors, fonts, spacing, radius } = useAppTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => makeStyles(colors, fonts, spacing, radius, insets),
    [colors, fonts, spacing, radius, insets],
  );

  const { data: addresses, isLoading } = useSavedAddresses();
  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<SavedAddress | null>(null);
  const setDefaultAddress = useSetDefaultSavedAddress();
  const deleteAddress = useDeleteSavedAddress();

  const openAdd = () => {
    setEditing(null);
    setFormVisible(true);
  };

  const openEdit = (address: SavedAddress) => {
    setEditing(address);
    setFormVisible(true);
  };

  const makeDefault = (address: SavedAddress) => {
    if (address.isDefault) return;
    setDefaultAddress.mutate(address.id, {
      onSuccess: () =>
        showToast(t('savedAddresses.defaultAddressSet'), 'success'),
      onError: err =>
        showToast(
          normalizeError(err) || 'Could not set default address',
          'error',
        ),
    });
  };

  const confirmDelete = async (address: SavedAddress) => {
    const confirmed = await confirmDialog({
      title: t('savedAddresses.removeAddress'),
      message: t('savedAddresses.removeConfirm', { label: address.label }),
      confirmText: t('savedAddresses.remove'),
      destructive: true,
    });
    if (confirmed) {
      deleteAddress.mutate(address.id, {
        onSuccess: () =>
          showToast(t('savedAddresses.addressRemoved'), 'success'),
        onError: err =>
          showToast(normalizeError(err) || 'Could not remove address', 'error'),
      });
    }
  };

  const renderItem = ({ item }: { item: SavedAddress }) => {
    const TypeIcon = TYPE_ICON[item.type];
    return (
      <View style={[styles.card, item.isDefault && styles.cardDefault]}>
        <View style={styles.cardIconWrap}>
          <TypeIcon color={colors.PRIMARY} size={18} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.cardLabelRow}>
            <Text style={styles.cardLabel} numberOfLines={1}>
              {item.label}
            </Text>
            {item.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>
                  {t('savedAddresses.default')}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.cardArea} numberOfLines={1}>
            {item.serviceArea.name}, {item.serviceArea.city}
          </Text>
        </View>
        <Pressable
          onPress={() => makeDefault(item)}
          hitSlop={10}
          style={styles.iconBtn}
        >
          <Star
            color={item.isDefault ? colors.PRIMARY : colors.TEXT_SECONDARY}
            fill={item.isDefault ? colors.PRIMARY : 'transparent'}
            size={16}
          />
        </Pressable>
        <Pressable
          onPress={() => openEdit(item)}
          hitSlop={10}
          style={styles.iconBtn}
        >
          <Pencil color={colors.TEXT_SECONDARY} size={16} />
        </Pressable>
        <Pressable
          onPress={() => confirmDelete(item)}
          hitSlop={10}
          style={styles.iconBtn}
        >
          <Trash2 color={colors.ERROR} size={16} />
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <ScreenHeader
        title={t('savedAddresses.title')}
        rightSlot={
          <Pressable onPress={openAdd} hitSlop={12}>
            <Plus color={colors.PRIMARY} size={20} />
          </Pressable>
        }
      />

      {isLoading ? (
        <SkeletonList />
      ) : (
        <FlatList
          data={addresses ?? []}
          keyExtractor={a => a.id}
          contentContainerStyle={styles.list}
          renderItem={renderItem}
          ListEmptyComponent={
            <EmptyState
              variant="bookmark"
              title={t('savedAddresses.noSavedAddresses')}
              message={t('savedAddresses.bookmarkHint')}
            />
          }
        />
      )}

      <AddressFormModal
        visible={formVisible}
        onClose={() => setFormVisible(false)}
        initial={editing}
      />
    </View>
  );
};

export default SavedAddressesScreen;

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
    cardDefault: { borderColor: colors.PRIMARY },
    cardIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.BACKGROUND,
    },
    cardLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    cardLabel: {
      fontFamily: fonts.SEMI_BOLD_PRIMARY,
      fontSize: 14,
      color: colors.TEXT_PRIMARY,
    },
    cardArea: {
      fontFamily: fonts.PRIMARY,
      fontSize: 12,
      color: colors.TEXT_SECONDARY,
      marginTop: 2,
    },
    iconBtn: { padding: 6 },
    defaultBadge: {
      backgroundColor: colors.PRIMARY_LIGHT,
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    defaultBadgeText: {
      fontFamily: fonts.BOLD_PRIMARY,
      fontSize: 9.5,
      color: colors.PRIMARY,
    },
  });
