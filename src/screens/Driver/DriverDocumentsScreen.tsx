// DriverDocumentsScreen.tsx — Driver
//
// Real backend contract (kalanabhaBackend DriverDocumentsController) that
// had no mobile screen at all before this — admin could review documents,
// but nothing let a driver actually upload one from the app. One card per
// document type; tapping an unfilled one launches the camera/gallery
// picker and uploads straight to POST /files/driver-documents.
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, FileText, CheckCircle2, Clock, XCircle, Camera, Image as ImageIcon } from 'lucide-react-native';
import { useAppTheme } from '@theme/ThemeContext';
import { useMyDriverDocuments, useUploadDriverDocument } from '@features/driverDocuments/hooks';
import { DRIVER_DOCUMENT_TYPES, DRIVER_DOCUMENT_TYPE_LABEL, type DriverDocumentType, type DriverDocument } from '@features/driverDocuments/types';
import { showToast } from '@ui/alert/toastStore';

const STATUS_META: Record<DriverDocument['status'], { label: string; icon: typeof CheckCircle2 }> = {
    PENDING: { label: 'Pending review', icon: Clock },
    UNDER_REVIEW: { label: 'Under review', icon: Clock },
    APPROVED: { label: 'Approved', icon: CheckCircle2 },
    REJECTED: { label: 'Rejected — re-upload', icon: XCircle },
    EXPIRED: { label: 'Expired — re-upload', icon: XCircle },
};

const DriverDocumentsScreen = () => {
    const navigation = useNavigation();
    const { colors, fonts, spacing, radius } = useAppTheme();
    const styles = useMemo(() => makeStyles(colors, fonts, spacing, radius), [colors, fonts, spacing, radius]);

    const { data: documents, isLoading } = useMyDriverDocuments();
    const { mutate: upload, isPending: uploading } = useUploadDriverDocument();
    const [pickerFor, setPickerFor] = useState<DriverDocumentType | null>(null);

    // Latest row per type — a re-upload after rejection creates a new row
    // rather than overwriting the old one, so this picks whichever the
    // driver would actually care about seeing.
    const latestByType = useMemo(() => {
        const map: Partial<Record<DriverDocumentType, DriverDocument>> = {};
        (documents ?? []).forEach((d) => {
            const existing = map[d.type];
            if (!existing || new Date(d.uploadedAt) > new Date(existing.uploadedAt)) {
                map[d.type] = d;
            }
        });
        return map;
    }, [documents]);

    const doUpload = (type: DriverDocumentType, asset: { uri?: string; fileName?: string; type?: string }) => {
        if (!asset.uri) return;
        setPickerFor(null);
        upload(
            { type, fileUri: asset.uri, fileName: asset.fileName ?? `${type.toLowerCase()}.jpg`, mimeType: asset.type ?? 'image/jpeg' },
            {
                onSuccess: () => showToast('Document uploaded — pending review', 'success'),
                onError: () => showToast('Upload failed — try again', 'error'),
            },
        );
    };

    const handlePick = (type: DriverDocumentType, source: 'camera' | 'gallery') => {
        const launch = source === 'camera' ? launchCamera : launchImageLibrary;
        launch({ mediaType: 'photo', quality: 0.8 }, (response) => {
            if (response.didCancel || !response.assets?.[0]) return;
            doUpload(type, response.assets[0]);
        });
    };

    return (
        <View style={styles.root}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
                    <ArrowLeft color={colors.TEXT_PRIMARY} size={22} />
                </Pressable>
                <Text style={styles.headerTitle}>My Documents</Text>
                <View style={{ width: 40 }} />
            </View>

            {isLoading ? (
                <View style={styles.centerState}>
                    <ActivityIndicator size="large" color={colors.PRIMARY} />
                </View>
            ) : (
                <FlatList
                    data={DRIVER_DOCUMENT_TYPES}
                    keyExtractor={(t) => t}
                    contentContainerStyle={styles.list}
                    ListHeaderComponent={
                        <Text style={styles.helperText}>
                            Upload each document once — admin reviews and approves/rejects it. Only you and admin/ops staff can view what you upload.
                        </Text>
                    }
                    renderItem={({ item: type }) => {
                        const doc = latestByType[type];
                        const meta = doc ? STATUS_META[doc.status] : null;
                        const StatusIcon = meta?.icon;
                        const isOpen = pickerFor === type;

                        return (
                            <View style={styles.card}>
                                <Pressable
                                    style={styles.cardRow}
                                    onPress={() => setPickerFor(isOpen ? null : type)}
                                    disabled={uploading}
                                >
                                    <View style={styles.iconWrap}>
                                        <FileText color={colors.PRIMARY} size={20} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.cardTitle}>{DRIVER_DOCUMENT_TYPE_LABEL[type]}</Text>
                                        {meta && StatusIcon ? (
                                            <View style={styles.statusRow}>
                                                <StatusIcon
                                                    size={13}
                                                    color={doc?.status === 'APPROVED' ? colors.SUCCESS : doc?.status === 'REJECTED' || doc?.status === 'EXPIRED' ? colors.ERROR : colors.WARNING}
                                                />
                                                <Text style={styles.statusText}>{meta.label}</Text>
                                            </View>
                                        ) : (
                                            <Text style={styles.notUploadedText}>Not uploaded yet</Text>
                                        )}
                                        {doc?.status === 'REJECTED' && doc.rejectionReason && (
                                            <Text style={styles.rejectionText}>Reason: {doc.rejectionReason}</Text>
                                        )}
                                    </View>
                                </Pressable>

                                {isOpen && (
                                    <View style={styles.pickerRow}>
                                        <Pressable style={styles.pickerBtn} onPress={() => handlePick(type, 'camera')} disabled={uploading}>
                                            <Camera size={16} color={colors.PRIMARY} />
                                            <Text style={styles.pickerBtnText}>Camera</Text>
                                        </Pressable>
                                        <Pressable style={styles.pickerBtn} onPress={() => handlePick(type, 'gallery')} disabled={uploading}>
                                            <ImageIcon size={16} color={colors.PRIMARY} />
                                            <Text style={styles.pickerBtnText}>Gallery</Text>
                                        </Pressable>
                                        {uploading && <ActivityIndicator size="small" color={colors.PRIMARY} />}
                                    </View>
                                )}
                            </View>
                        );
                    }}
                />
            )}
        </View>
    );
};

export default DriverDocumentsScreen;

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

    centerState: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    list: { padding: spacing.lg, gap: spacing.sm },
    helperText: {
        fontFamily: fonts.PRIMARY, fontSize: 12, color: colors.TEXT_SECONDARY,
        marginBottom: spacing.md, lineHeight: 17,
    },
    card: {
        backgroundColor: colors.SURFACE, borderRadius: radius.lg,
        borderWidth: 1, borderColor: colors.BORDER, marginBottom: spacing.sm,
        overflow: 'hidden',
    },
    cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
    iconWrap: {
        width: 40, height: 40, borderRadius: 14,
        backgroundColor: colors.PRIMARY_LIGHT, alignItems: 'center', justifyContent: 'center',
    },
    cardTitle: { fontFamily: fonts.SEMI_BOLD_PRIMARY, fontSize: 14, color: colors.TEXT_PRIMARY },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
    statusText: { fontFamily: fonts.PRIMARY, fontSize: 12, color: colors.TEXT_SECONDARY },
    notUploadedText: { fontFamily: fonts.PRIMARY, fontSize: 12, color: colors.TEXT_SECONDARY, marginTop: 3 },
    rejectionText: { fontFamily: fonts.PRIMARY, fontSize: 11, color: colors.ERROR, marginTop: 3 },

    pickerRow: {
        flexDirection: 'row', alignItems: 'center', gap: spacing.md,
        paddingHorizontal: spacing.md, paddingBottom: spacing.md,
    },
    pickerBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: colors.PRIMARY_LIGHT, borderRadius: radius.md,
        paddingHorizontal: spacing.md, paddingVertical: spacing.sm - 2,
    },
    pickerBtnText: { fontFamily: fonts.SEMI_BOLD_PRIMARY, fontSize: 12, color: colors.PRIMARY },
});
