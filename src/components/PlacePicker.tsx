// PlacePicker.tsx — real search + recents + saved-address favorites +
// "use current location" over the admin-managed ServiceArea list.
//
// Extracted from addOrders.tsx (where it was originally built for the
// Sender/Receiver pickup/drop steps) so it can also back the Home screen's
// "Tap to set location" pill — same real picker everywhere a locality gets
// picked, not two competing implementations. Deliberately still scoped to
// the real ServiceArea list (an admin-managed "where the platform actually
// operates" constraint), not free-text/geocoded addresses.
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView } from 'react-native';
import { ChevronLeft, MapPin, Search, Navigation2, Clock, Bookmark, BookmarkPlus, Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@theme/ThemeContext';
import { useLocationSearch, recordRecentServiceArea } from '@features/location/useLocationSearch';
import { useSavedAddresses, useCreateSavedAddress } from '@features/savedAddresses/hooks';
import type { ServiceArea } from '@features/settings/types';
import { showToast } from '@ui/alert/toastStore';
import { normalizeError } from '@utils/error';
import FONTS from '@utils/fonts';

const RADIUS = { sm: 8, md: 12, lg: 16, xl: 22, full: 999 };

// Small, self-contained copy of addOrders.tsx's private color mapping —
// not exported there, and not worth coupling this file to that one just
// to share a 19-line token map.
const makeColors = (BRAND: ReturnType<typeof useAppTheme>['colors']) => ({
    primary: BRAND.PRIMARY,
    text: BRAND.TEXT_PRIMARY,
    textMuted: BRAND.GRAY,
    textSecondary: BRAND.TEXT_SECONDARY,
    border: BRAND.BORDER,
    danger: BRAND.ERROR,
    bg: BRAND.BACKGROUND,
    surface: BRAND.SURFACE,
    placeholder: '#C4CACD',
});
type PickerColors = ReturnType<typeof makeColors>;

interface Props {
    label: string;
    value: ServiceArea | null;
    areas: ServiceArea[];
    onSelect: (place: ServiceArea) => void;
    placeholder?: string;
    error?: string;
    // When provided, replaces the default trigger row entirely (used by
    // HomeHeader's location pill) — the label/error text is skipped too,
    // since a custom trigger owns its own presentation.
    renderTrigger?: (opts: { value: ServiceArea | null; label: string; open: () => void }) => React.ReactNode;
}

const PlacePicker: React.FC<Props> = ({ label, value, areas, onSelect, placeholder, error, renderTrigger }) => {
    const { colors: BRAND } = useAppTheme();
    const { t } = useTranslation();
    const COLORS = useMemo(() => makeColors(BRAND), [BRAND]);
    const triggerStyles = useMemo(() => makeTriggerStyles(COLORS), [COLORS]);
    const pickerStyles = useMemo(() => makePickerStyles(COLORS), [COLORS]);
    const [open, setOpen] = useState(false);
    const { query, setQuery, results: filtered, recents, locateNearestServiceArea, locatingCurrentPosition } = useLocationSearch(areas);
    const { data: savedAddresses } = useSavedAddresses();
    const { mutate: createSavedAddress, isPending: savingAddress } = useCreateSavedAddress();
    const [saveLabelFor, setSaveLabelFor] = useState<ServiceArea | null>(null);
    const [saveLabel, setSaveLabel] = useState('');

    const handleSelect = (place: ServiceArea) => {
        recordRecentServiceArea(place.id);
        onSelect(place);
        setOpen(false);
        setQuery('');
    };

    const handleUseCurrentLocation = async () => {
        const nearest = await locateNearestServiceArea();
        if (nearest) {
            handleSelect(nearest);
        } else {
            showToast(t('addOrder.toastNoServiceableLocality'), 'error');
        }
    };

    const handleConfirmSave = () => {
        if (!saveLabelFor || !saveLabel.trim()) return;
        createSavedAddress(
            { label: saveLabel.trim(), serviceAreaId: saveLabelFor.id },
            {
                onSuccess: () => {
                    showToast(t('addOrder.toastAddressSaved'), 'success');
                    setSaveLabelFor(null);
                    setSaveLabel('');
                },
                onError: (err) => showToast(normalizeError(err) || t('addOrder.toastCouldNotSaveAddress'), 'error'),
            },
        );
    };

    return (
        <View>
            {renderTrigger ? (
                renderTrigger({ value, label, open: () => setOpen(true) })
            ) : (
                <View style={triggerStyles.wrapper}>
                    <Text style={triggerStyles.label}>{label}</Text>
                    <TouchableOpacity
                        style={[triggerStyles.row, !!error && triggerStyles.rowError]}
                        onPress={() => setOpen(true)}
                        activeOpacity={0.7}
                    >
                        <MapPin color={value ? COLORS.primary : COLORS.textMuted} width={16} height={16} style={triggerStyles.icon} />
                        <Text
                            style={[triggerStyles.input, { paddingVertical: 0 }, !value && { color: COLORS.placeholder }]}
                            numberOfLines={1}
                        >
                            {value ? `${value.name}, ${value.city}` : (placeholder ?? t('addOrder.placePickerDefaultPlaceholder'))}
                        </Text>
                        <ChevronLeft color={COLORS.textMuted} width={16} height={16} style={{ transform: [{ rotate: '-90deg' }] }} />
                    </TouchableOpacity>
                    {error ? <Text style={triggerStyles.error}>{error}</Text> : null}
                </View>
            )}

            <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
                <View style={pickerStyles.modalContainer}>
                    <View style={pickerStyles.modalHeader}>
                        <Text style={pickerStyles.modalTitle}>{label}</Text>
                        <TouchableOpacity onPress={() => setOpen(false)} style={pickerStyles.closeBtn}>
                            <Text style={pickerStyles.closeBtnText}>{t('addOrder.close')}</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={pickerStyles.searchRow}>
                        <Search size={16} color={COLORS.textMuted} />
                        <TextInput
                            style={pickerStyles.searchInput}
                            value={query}
                            onChangeText={setQuery}
                            placeholder={t('addOrder.searchLocalityPlaceholder')}
                            placeholderTextColor={COLORS.placeholder}
                            autoFocus
                        />
                    </View>

                    <TouchableOpacity style={pickerStyles.currentLocationRow} onPress={handleUseCurrentLocation} disabled={locatingCurrentPosition}>
                        <Navigation2 size={16} color={COLORS.primary} />
                        <Text style={pickerStyles.currentLocationText}>
                            {locatingCurrentPosition ? t('addOrder.findingLocation') : t('addOrder.useCurrentLocation')}
                        </Text>
                    </TouchableOpacity>

                    <ScrollView keyboardShouldPersistTaps="handled">
                        {!query.trim() && savedAddresses && savedAddresses.length > 0 && (
                            <View>
                                <Text style={pickerStyles.cityLabel}>{t('addOrder.savedSectionLabel')}</Text>
                                {savedAddresses.map((s) => (
                                    <TouchableOpacity
                                        key={`saved-${s.id}`}
                                        style={pickerStyles.placeRow}
                                        onPress={() => handleSelect({
                                            id: s.serviceArea.id,
                                            name: s.serviceArea.name,
                                            city: s.serviceArea.city,
                                            pincode: s.serviceArea.pincode,
                                            lat: s.serviceArea.lat,
                                            lng: s.serviceArea.lng,
                                            active: true,
                                        } as ServiceArea)}
                                    >
                                        <Bookmark size={15} color={COLORS.primary} />
                                        <View style={{ flex: 1, marginLeft: 10 }}>
                                            <Text style={pickerStyles.placeName}>{s.label}</Text>
                                            <Text style={pickerStyles.placePincode}>{s.serviceArea.name}, {s.serviceArea.city}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                        {!query.trim() && recents.length > 0 && (
                            <View>
                                <Text style={pickerStyles.cityLabel}>{t('addOrder.recentSectionLabel')}</Text>
                                {recents.map((p) => (
                                    <TouchableOpacity key={`recent-${p.id}`} style={pickerStyles.placeRow} onPress={() => handleSelect(p)}>
                                        <Clock size={15} color={COLORS.textMuted} />
                                        <View style={{ flex: 1, marginLeft: 10 }}>
                                            <Text style={pickerStyles.placeName}>{p.name}</Text>
                                            <Text style={pickerStyles.placePincode}>{p.city}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                        {Object.keys(filtered).length === 0 && (
                            <Text style={pickerStyles.emptyText}>{t('addOrder.noMatchingLocality')}</Text>
                        )}
                        {Object.entries(filtered).map(([city, places]) => (
                            <View key={city}>
                                <Text style={pickerStyles.cityLabel}>{city}</Text>
                                {places.map((p) => (
                                    <TouchableOpacity
                                        key={p.id}
                                        style={pickerStyles.placeRow}
                                        onPress={() => handleSelect(p)}
                                    >
                                        <MapPin size={15} color={COLORS.primary} />
                                        <View style={{ flex: 1, marginLeft: 10 }}>
                                            <Text style={pickerStyles.placeName}>{p.name}</Text>
                                            <Text style={pickerStyles.placePincode}>{p.pincode}</Text>
                                        </View>
                                        {value?.id === p.id && <Check size={16} color={COLORS.primary} />}
                                        <TouchableOpacity
                                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                            style={{ marginLeft: 8 }}
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                setSaveLabel('');
                                                setSaveLabelFor(p);
                                            }}
                                        >
                                            <BookmarkPlus size={17} color={COLORS.textMuted} />
                                        </TouchableOpacity>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ))}
                    </ScrollView>
                </View>

                <Modal visible={!!saveLabelFor} transparent animationType="fade" onRequestClose={() => setSaveLabelFor(null)}>
                    <View style={pickerStyles.saveOverlay}>
                        <View style={pickerStyles.saveCard}>
                            <Text style={pickerStyles.modalTitle}>{t('addOrder.saveAddressTitle')}</Text>
                            <Text style={[pickerStyles.placePincode, { marginTop: 4, marginBottom: 12 }]}>
                                {saveLabelFor ? `${saveLabelFor.name}, ${saveLabelFor.city}` : ''}
                            </Text>
                            <TextInput
                                style={pickerStyles.searchInput}
                                value={saveLabel}
                                onChangeText={setSaveLabel}
                                placeholder={t('addOrder.saveAddressLabelPlaceholder')}
                                placeholderTextColor={COLORS.placeholder}
                                autoFocus
                            />
                            <View style={pickerStyles.saveActions}>
                                <TouchableOpacity style={pickerStyles.closeBtn} onPress={() => setSaveLabelFor(null)}>
                                    <Text style={pickerStyles.closeBtnText}>{t('addOrder.cancel')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={pickerStyles.closeBtn}
                                    disabled={!saveLabel.trim() || savingAddress}
                                    onPress={handleConfirmSave}
                                >
                                    <Text style={pickerStyles.closeBtnText}>{savingAddress ? t('addOrder.saving') : t('addOrder.save')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </Modal>
        </View>
    );
};

export default PlacePicker;

const makeTriggerStyles = (COLORS: PickerColors) => StyleSheet.create({
    wrapper: { marginBottom: 14 },
    label: { fontSize: 12, fontFamily: FONTS.SEMI_BOLD_PRIMARY, color: COLORS.textSecondary, marginBottom: 5, letterSpacing: 0.3 },
    row: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1.5, borderColor: COLORS.border,
        borderRadius: RADIUS.md, paddingHorizontal: 12, height: 48,
        backgroundColor: COLORS.surface,
    },
    rowError: { borderColor: COLORS.danger },
    icon: { marginRight: 8 },
    input: { flex: 1, fontSize: 14, color: COLORS.text, height: '100%' },
    error: { color: COLORS.danger, fontSize: 11, marginTop: 3 },
});

const makePickerStyles = (COLORS: PickerColors) => StyleSheet.create({
    modalContainer: { flex: 1, backgroundColor: COLORS.bg },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
        borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.surface,
    },
    modalTitle: { fontSize: 16, fontFamily: FONTS.BOLD_PRIMARY, color: COLORS.text },
    closeBtn: { paddingHorizontal: 10, paddingVertical: 6 },
    closeBtnText: { color: COLORS.primary, fontSize: 14, fontFamily: FONTS.SEMI_BOLD_PRIMARY },
    searchRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        margin: 16, paddingHorizontal: 14, height: 46,
        backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
        borderWidth: 1.5, borderColor: COLORS.border,
    },
    currentLocationRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        marginHorizontal: 16, marginBottom: 12, paddingVertical: 10,
    },
    currentLocationText: { color: COLORS.primary, fontSize: 14, fontFamily: FONTS.SEMI_BOLD_PRIMARY },
    saveOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
    saveCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: 20 },
    saveActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 },
    searchInput: { flex: 1, fontSize: 14, color: COLORS.text },
    cityLabel: {
        fontSize: 12, fontFamily: FONTS.BOLD_PRIMARY, color: COLORS.textMuted,
        letterSpacing: 0.4, textTransform: 'uppercase',
        paddingHorizontal: 20, marginTop: 14, marginBottom: 6,
    },
    placeRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: COLORS.border,
    },
    placeName: { fontSize: 14, fontFamily: FONTS.SEMI_BOLD_PRIMARY, color: COLORS.text },
    placePincode: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
    emptyText: { textAlign: 'center', color: COLORS.textMuted, marginTop: 40, fontSize: 13 },
});
