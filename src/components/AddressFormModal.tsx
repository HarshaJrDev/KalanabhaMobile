





import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Briefcase, Home as HomeIcon, Hotel, MapPin, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@theme/ThemeContext';
import PlacePicker from './PlacePicker';
import { useServiceAreas } from '@features/settings/hooks';
import { useCreateSavedAddress, useUpdateSavedAddress } from '@features/savedAddresses/hooks';
import type { SavedAddress, SavedAddressType } from '@features/savedAddresses/types';
import type { ServiceArea } from '@features/settings/types';
import { normalizeError } from '@utils/error';
import { showToast } from '@ui/alert/toastStore';

const TYPE_ICON: Record<SavedAddressType, typeof HomeIcon> = {
    HOME: HomeIcon,
    WORK: Briefcase,
    HOTEL: Hotel,
    OTHER: MapPin,
};
const TYPE_OPTIONS: SavedAddressType[] = ['HOME', 'WORK', 'HOTEL', 'OTHER'];

interface Props {
    visible: boolean;
    onClose: () => void;
        initial?: SavedAddress | null;
        initialArea?: ServiceArea | null;
}

export const AddressFormModal: React.FC<Props> = ({ visible, onClose, initial, initialArea }) => {
    const { colors, fonts, spacing, radius } = useAppTheme();
    const { t } = useTranslation();
    const styles = useMemo(() => makeStyles(colors, fonts, spacing, radius), [colors, fonts, spacing, radius]);
    const { data: areas } = useServiceAreas();

    const [area, setArea] = useState<ServiceArea | null>(null);
    const [label, setLabel] = useState('');
    const [type, setType] = useState<SavedAddressType>('HOME');
    const [isDefault, setIsDefault] = useState(false);
    const [houseNo, setHouseNo] = useState('');
    const [floor, setFloor] = useState('');
    const [addressLine, setAddressLine] = useState('');
    const [landmark, setLandmark] = useState('');
    const [contactName, setContactName] = useState('');
    const [contactPhone, setContactPhone] = useState('');

    const createAddress = useCreateSavedAddress();
    const updateAddress = useUpdateSavedAddress(initial?.id ?? '');
    const saving = createAddress.isPending || updateAddress.isPending;

    // Reset/pre-fill whenever the modal opens for a (possibly different)
    // address, rather than once on mount — this instance stays alive
    // across multiple opens from the parent screen.
    useEffect(() => {
        if (!visible) return;
        if (initial) {
            setArea({
                id: initial.serviceArea.id,
                name: initial.serviceArea.name,
                city: initial.serviceArea.city,
                pincode: initial.serviceArea.pincode,
                lat: initial.serviceArea.lat,
                lng: initial.serviceArea.lng,
                active: true,
            } as ServiceArea);
            setLabel(initial.label);
            setType(initial.type);
            setIsDefault(initial.isDefault);
            setHouseNo(initial.houseNo ?? '');
            setFloor(initial.floor ?? '');
            setAddressLine(initial.addressLine ?? '');
            setLandmark(initial.landmark ?? '');
            setContactName(initial.contactName ?? '');
            setContactPhone(initial.contactPhone ?? '');
        } else {
            setArea(initialArea ?? null);
            setLabel('');
            setType('HOME');
            setIsDefault(false);
            setHouseNo('');
            setFloor('');
            setAddressLine('');
            setLandmark('');
            setContactName('');
            setContactPhone('');
        }
    }, [visible, initial, initialArea]);

    const canSave = !!area && !!label.trim();

    const handleSave = () => {
        if (!area || !label.trim()) return;
        const payload = {
            label: label.trim(),
            type,
            isDefault,
            serviceAreaId: area.id,
            houseNo: houseNo.trim() || undefined,
            floor: floor.trim() || undefined,
            addressLine: addressLine.trim() || undefined,
            landmark: landmark.trim() || undefined,
            contactName: contactName.trim() || undefined,
            contactPhone: contactPhone.trim() || undefined,
        };
        const onSuccess = () => {
            showToast(initial ? t('savedAddresses.addressUpdated') : t('savedAddresses.addressSaved'), 'success');
            onClose();
        };
        const onError = (err: unknown) => showToast(normalizeError(err) || 'Could not save address', 'error');

        if (initial) {
            updateAddress.mutate(payload, { onSuccess, onError });
        } else {
            createAddress.mutate(payload, { onSuccess, onError });
        }
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{initial ? t('savedAddresses.editAddress') : t('savedAddresses.addAddress')}</Text>
                    <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
                        <X color={colors.TEXT_PRIMARY} size={20} />
                    </Pressable>
                </View>

                <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
                    <Text style={styles.fieldLabel}>{t('savedAddresses.category')}</Text>
                    <View style={styles.typeRow}>
                        {TYPE_OPTIONS.map((opt) => {
                            const TypeIcon = TYPE_ICON[opt];
                            const active = type === opt;
                            return (
                                <Pressable
                                    key={opt}
                                    onPress={() => setType(opt)}
                                    style={[styles.typeChip, active && styles.typeChipActive]}
                                >
                                    <TypeIcon color={active ? '#fff' : colors.TEXT_SECONDARY} size={14} />
                                    <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>
                                        {t(`savedAddresses.type${opt.charAt(0)}${opt.slice(1).toLowerCase()}`)}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    <Text style={styles.fieldLabel}>{t('savedAddresses.labelPlaceholder')}</Text>
                    <TextInput
                        style={styles.input}
                        value={label}
                        onChangeText={setLabel}
                        placeholder={t('savedAddresses.labelPlaceholder')}
                        placeholderTextColor={colors.GRAY}
                    />

                    <Text style={styles.fieldLabel}>{t('savedAddresses.locality')}</Text>
                    <PlacePicker
                        label={t('savedAddresses.locality')}
                        value={area}
                        areas={areas ?? []}
                        onSelect={setArea}
                        renderTrigger={({ open }) => (
                            <Pressable style={styles.input} onPress={open}>
                                <Text style={area ? styles.inputText : styles.inputPlaceholder} numberOfLines={1}>
                                    {area ? `${area.name}, ${area.city}` : t('savedAddresses.selectLocality')}
                                </Text>
                            </Pressable>
                        )}
                    />

                    <View style={styles.rowFields}>
                        <View style={styles.rowField}>
                            <Text style={styles.fieldLabel}>{t('savedAddresses.houseNo')}</Text>
                            <TextInput style={styles.input} value={houseNo} onChangeText={setHouseNo} placeholder={t('savedAddresses.houseNoPlaceholder')} placeholderTextColor={colors.GRAY} />
                        </View>
                        <View style={styles.rowField}>
                            <Text style={styles.fieldLabel}>{t('savedAddresses.floor')}</Text>
                            <TextInput style={styles.input} value={floor} onChangeText={setFloor} placeholder={t('savedAddresses.floorPlaceholder')} placeholderTextColor={colors.GRAY} />
                        </View>
                    </View>

                    <Text style={styles.fieldLabel}>{t('savedAddresses.street')}</Text>
                    <TextInput style={styles.input} value={addressLine} onChangeText={setAddressLine} placeholder={t('savedAddresses.streetPlaceholder')} placeholderTextColor={colors.GRAY} />

                    <Text style={styles.fieldLabel}>{t('savedAddresses.landmark')}</Text>
                    <TextInput style={styles.input} value={landmark} onChangeText={setLandmark} placeholder={t('savedAddresses.landmarkPlaceholder')} placeholderTextColor={colors.GRAY} />

                    <View style={styles.rowFields}>
                        <View style={styles.rowField}>
                            <Text style={styles.fieldLabel}>{t('savedAddresses.contactName')}</Text>
                            <TextInput style={styles.input} value={contactName} onChangeText={setContactName} placeholder={t('savedAddresses.contactNamePlaceholder')} placeholderTextColor={colors.GRAY} />
                        </View>
                        <View style={styles.rowField}>
                            <Text style={styles.fieldLabel}>{t('savedAddresses.contactPhone')}</Text>
                            <TextInput style={styles.input} value={contactPhone} onChangeText={setContactPhone} placeholder={t('savedAddresses.contactPhonePlaceholder')} placeholderTextColor={colors.GRAY} keyboardType="phone-pad" />
                        </View>
                    </View>

                    <Pressable style={styles.defaultToggleRow} onPress={() => setIsDefault((v) => !v)}>
                        <View style={[styles.checkbox, isDefault && styles.checkboxActive]} />
                        <Text style={styles.defaultToggleText}>{t('savedAddresses.setAsDefault')}</Text>
                    </Pressable>

                    <Pressable style={[styles.saveBtn, (!canSave || saving) && styles.saveBtnDisabled]} disabled={!canSave || saving} onPress={handleSave}>
                        <Text style={styles.saveBtnText}>{saving ? t('savedAddresses.saving') : t('common.save')}</Text>
                    </Pressable>
                </ScrollView>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const makeStyles = (
    colors: ReturnType<typeof useAppTheme>['colors'],
    fonts: ReturnType<typeof useAppTheme>['fonts'],
    spacing: ReturnType<typeof useAppTheme>['spacing'],
    radius: ReturnType<typeof useAppTheme>['radius'],
) => StyleSheet.create({
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: spacing.lg, paddingTop: 56, paddingBottom: spacing.md,
        borderBottomWidth: 1, borderBottomColor: colors.BORDER, backgroundColor: colors.SURFACE,
    },
    headerTitle: { fontFamily: fonts.BOLD_PRIMARY, fontSize: 16, color: colors.TEXT_PRIMARY },
    closeBtn: { padding: 4 },
    form: { padding: spacing.lg, paddingBottom: 48 },
    fieldLabel: { fontFamily: fonts.SEMI_BOLD_PRIMARY, fontSize: 12, color: colors.TEXT_SECONDARY, marginBottom: 6, marginTop: 14 },
    input: {
        height: 46, paddingHorizontal: 14, justifyContent: 'center',
        backgroundColor: colors.BACKGROUND, borderRadius: radius.md,
        borderWidth: 1.5, borderColor: colors.BORDER,
        color: colors.TEXT_PRIMARY, fontFamily: fonts.PRIMARY, fontSize: 14,
    },
    inputText: { color: colors.TEXT_PRIMARY, fontFamily: fonts.PRIMARY, fontSize: 14 },
    inputPlaceholder: { color: colors.GRAY, fontFamily: fonts.PRIMARY, fontSize: 14 },
    rowFields: { flexDirection: 'row', gap: 12 },
    rowField: { flex: 1 },

    typeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    typeChip: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 12, paddingVertical: 8,
        borderRadius: radius.md, borderWidth: 1, borderColor: colors.BORDER,
    },
    typeChipActive: { backgroundColor: colors.PRIMARY, borderColor: colors.PRIMARY },
    typeChipText: { fontFamily: fonts.MEDIUM_PRIMARY, fontSize: 12.5, color: colors.TEXT_SECONDARY },
    typeChipTextActive: { color: '#fff', fontFamily: fonts.SEMI_BOLD_PRIMARY },

    defaultToggleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20 },
    checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: colors.BORDER },
    checkboxActive: { backgroundColor: colors.PRIMARY, borderColor: colors.PRIMARY },
    defaultToggleText: { fontFamily: fonts.MEDIUM_PRIMARY, fontSize: 13.5, color: colors.TEXT_PRIMARY },

    saveBtn: { marginTop: 28, height: 50, borderRadius: radius.md, backgroundColor: colors.PRIMARY, alignItems: 'center', justifyContent: 'center' },
    saveBtnDisabled: { opacity: 0.5 },
    saveBtnText: { fontFamily: fonts.BOLD_PRIMARY, fontSize: 15, color: '#fff' },
});
