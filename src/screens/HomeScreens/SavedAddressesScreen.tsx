// SavedAddressesScreen.tsx — Customer
//
// Real "manage saved addresses" list (My Addresses) backed by
// kalanabhaBackend's saved-addresses CRUD (Prisma model + controller,
// see src/features/savedAddresses). Creation already happens inline
// from the New Order picker (addOrders.tsx's PlacePicker "bookmark"
// affordance); this screen is where the list actually lives — rename
// (label only, the ServiceArea itself is fixed once saved) and delete.
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Bookmark, Pencil, Trash2 } from 'lucide-react-native';
import { useAppTheme } from '@theme/ThemeContext';
import { useSavedAddresses, useUpdateSavedAddress, useDeleteSavedAddress } from '@features/savedAddresses/hooks';
import type { SavedAddress } from '@features/savedAddresses/types';
import { normalizeError } from '@utils/error';
import { showToast } from '@ui/alert/toastStore';

const SavedAddressesScreen = () => {
    const navigation = useNavigation();
    const { colors, fonts, spacing, radius } = useAppTheme();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => makeStyles(colors, fonts, spacing, radius, insets), [colors, fonts, spacing, radius, insets]);

    const { data: addresses, isLoading } = useSavedAddresses();
    const [renaming, setRenaming] = useState<SavedAddress | null>(null);
    const [renameLabel, setRenameLabel] = useState('');
    const updateAddress = useUpdateSavedAddress(renaming?.id ?? '');
    const deleteAddress = useDeleteSavedAddress();

    const openRename = (address: SavedAddress) => {
        setRenaming(address);
        setRenameLabel(address.label);
    };

    const confirmRename = () => {
        if (!renaming || !renameLabel.trim()) return;
        updateAddress.mutate(
            { label: renameLabel.trim() },
            {
                onSuccess: () => {
                    showToast('Address updated', 'success');
                    setRenaming(null);
                },
                onError: (err) => showToast(normalizeError(err) || 'Could not update address', 'error'),
            },
        );
    };

    const confirmDelete = (address: SavedAddress) => {
        Alert.alert('Remove address', `Remove "${address.label}" from your saved addresses?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove',
                style: 'destructive',
                onPress: () => {
                    deleteAddress.mutate(address.id, {
                        onSuccess: () => showToast('Address removed', 'success'),
                        onError: (err) => showToast(normalizeError(err) || 'Could not remove address', 'error'),
                    });
                },
            },
        ]);
    };

    const renderItem = ({ item }: { item: SavedAddress }) => (
        <View style={styles.card}>
            <View style={styles.cardIconWrap}>
                <Bookmark color={colors.PRIMARY} size={18} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.cardLabel} numberOfLines={1}>{item.label}</Text>
                <Text style={styles.cardArea} numberOfLines={1}>{item.serviceArea.name}, {item.serviceArea.city}</Text>
            </View>
            <Pressable onPress={() => openRename(item)} hitSlop={10} style={styles.iconBtn}>
                <Pencil color={colors.TEXT_SECONDARY} size={16} />
            </Pressable>
            <Pressable onPress={() => confirmDelete(item)} hitSlop={10} style={styles.iconBtn}>
                <Trash2 color={colors.ERROR} size={16} />
            </Pressable>
        </View>
    );

    return (
        <View style={styles.root}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
                    <ArrowLeft color={colors.TEXT_PRIMARY} size={22} />
                </Pressable>
                <Text style={styles.headerTitle}>Saved Addresses</Text>
                <View style={{ width: 40 }} />
            </View>

            {isLoading ? (
                <View style={styles.centerState}>
                    <ActivityIndicator size="large" color={colors.PRIMARY} />
                </View>
            ) : (
                <FlatList
                    data={addresses ?? []}
                    keyExtractor={(a) => a.id}
                    contentContainerStyle={styles.list}
                    renderItem={renderItem}
                    ListEmptyComponent={
                        <View style={styles.centerState}>
                            <Bookmark color={colors.GRAY} size={40} />
                            <Text style={styles.emptyText}>No saved addresses yet</Text>
                            <Text style={styles.emptySubtext}>Bookmark a locality while picking pickup/drop in New Order</Text>
                        </View>
                    }
                />
            )}

            <Modal visible={!!renaming} transparent animationType="fade" onRequestClose={() => setRenaming(null)}>
                <View style={styles.renameOverlay}>
                    <View style={styles.renameCard}>
                        <Text style={styles.headerTitle}>Rename</Text>
                        <TextInput
                            style={styles.renameInput}
                            value={renameLabel}
                            onChangeText={setRenameLabel}
                            placeholder="Label, e.g. Home, Office"
                            placeholderTextColor={colors.GRAY}
                            autoFocus
                        />
                        <View style={styles.renameActions}>
                            <Pressable style={styles.renameActionBtn} onPress={() => setRenaming(null)}>
                                <Text style={styles.renameActionText}>Cancel</Text>
                            </Pressable>
                            <Pressable
                                style={styles.renameActionBtn}
                                disabled={!renameLabel.trim() || updateAddress.isPending}
                                onPress={confirmRename}
                            >
                                <Text style={styles.renameActionText}>{updateAddress.isPending ? 'Saving…' : 'Save'}</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
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
) => StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.BACKGROUND },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingTop: insets.top + 10,
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

    centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 60, paddingHorizontal: spacing.xl },
    emptyText: { fontFamily: fonts.PRIMARY, fontSize: 13, color: colors.GRAY },
    emptySubtext: { fontFamily: fonts.PRIMARY, fontSize: 12, color: colors.GRAY, textAlign: 'center' },

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
    cardIconWrap: {
        width: 36, height: 36, borderRadius: 18,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: colors.BACKGROUND,
    },
    cardLabel: { fontFamily: fonts.SEMI_BOLD_PRIMARY, fontSize: 14, color: colors.TEXT_PRIMARY },
    cardArea: { fontFamily: fonts.PRIMARY, fontSize: 12, color: colors.TEXT_SECONDARY, marginTop: 2 },
    iconBtn: { padding: 6 },

    renameOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
    renameCard: { backgroundColor: colors.SURFACE, borderRadius: radius.lg, padding: 20 },
    renameInput: {
        marginTop: 12, height: 46, paddingHorizontal: 14,
        backgroundColor: colors.BACKGROUND, borderRadius: radius.md,
        borderWidth: 1.5, borderColor: colors.BORDER,
        color: colors.TEXT_PRIMARY, fontFamily: fonts.PRIMARY,
    },
    renameActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginTop: 16 },
    renameActionBtn: { paddingHorizontal: 10, paddingVertical: 6 },
    renameActionText: { color: colors.PRIMARY, fontSize: 14, fontFamily: fonts.SEMI_BOLD_PRIMARY },
});
