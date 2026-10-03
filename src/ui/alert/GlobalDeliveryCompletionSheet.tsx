














import React, { useRef, useState } from 'react';
import { Modal, View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { CheckCircle2, Circle, X } from 'lucide-react-native';
import { launchCamera } from 'react-native-image-picker';
import { useAppTheme } from '@theme/ThemeContext';
import {
    verifyDeliveryOtp,
    uploadShipmentPod,
    saveDeliverySignature,
    completeDelivery,
} from '@features/shipments/api/shipments.api';
import { SignaturePad, SignatureClearButton, type Point } from '@components/SignaturePad';
import { showToast } from './toastStore';
import { useDeliveryCompletionStore } from './deliveryCompletionStore';
import { normalizeError } from '@utils/error';
import { ensureCameraPermission } from '@utils/cameraPermission';
import { useTranslation } from 'react-i18next';

export const GlobalDeliveryCompletionSheet: React.FC = () => {
    const { colors, fonts } = useAppTheme();
    const { t } = useTranslation();
    const styles = React.useMemo(() => makeStyles(colors, fonts), [colors, fonts]);

    const open = useDeliveryCompletionStore((s) => s.open);
    const shipmentId = useDeliveryCompletionStore((s) => s.shipmentId);
    const resolve = useDeliveryCompletionStore((s) => s.resolve);

    const [otp, setOtp] = useState('');
    const [otpVerified, setOtpVerified] = useState(false);
    const [verifyingOtp, setVerifyingOtp] = useState(false);
    const [otpError, setOtpError] = useState<string | null>(null);

    // Real backend behavior: podFileKey is a single field — each upload
    // OVERWRITES the previous one (kalanabhaBackend ShipmentsRepository.
    // setPod), there's no multi-photo model. A counter here would be
    
    
    
    const [photoUploaded, setPhotoUploaded] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    const [signatureCaptured, setSignatureCaptured] = useState(false);
    const [savingSignature, setSavingSignature] = useState(false);
    const [strokes, setStrokes] = useState<Point[][]>([]);
    const padRef = useRef<{ clear: () => void; getStrokes: () => Point[][] }>(null);

    const [completing, setCompleting] = useState(false);

    
    
    
    const [packageCondition, setPackageCondition] = useState<'GOOD' | 'DAMAGED'>('GOOD');
    const [deliveryNote, setDeliveryNote] = useState('');

    const reset = () => {
        setOtp('');
        setOtpVerified(false);
        setOtpError(null);
        setPhotoUploaded(false);
        setSignatureCaptured(false);
        setStrokes([]);
        padRef.current?.clear();
        setPackageCondition('GOOD');
        setDeliveryNote('');
    };

    const close = (completed: boolean) => {
        useDeliveryCompletionStore.setState({ open: false, shipmentId: null, resolve: null });
        reset();
        resolve?.(completed);
    };

    const handleVerifyOtp = async () => {
        if (!shipmentId || otp.length !== 4) return;
        setVerifyingOtp(true);
        setOtpError(null);
        try {
            await verifyDeliveryOtp(shipmentId, otp);
            setOtpVerified(true);
        } catch (err) {
            setOtpError(normalizeError(err) || t('deliveryCompletion.incorrectOtp'));
        } finally {
            setVerifyingOtp(false);
        }
    };

    const handleTakePhoto = async () => {
        if (!shipmentId) return;

        
        
        
        
        const hasCameraPermission = await ensureCameraPermission();
        if (!hasCameraPermission) {
            showToast(t('deliveryCompletion.cameraPermissionRequired'), 'error');
            return;
        }

        launchCamera({ mediaType: 'photo', quality: 0.8, saveToPhotos: false }, async (response) => {
            if (response.didCancel) return;
            const asset = response.assets?.[0];
            if (response.errorCode || !asset?.uri) {
                
                
                
                
                
                if (__DEV__) console.warn('[DeliveryCompletionSheet] camera error', response.errorCode, response.errorMessage);
                showToast(
                    response.errorCode ? t('deliveryCompletion.couldNotCapturePhoto', { reason: response.errorMessage ?? response.errorCode }) : t('deliveryCompletion.couldNotCapturePhotoRetry'),
                    'error',
                );
                return;
            }
            setUploadingPhoto(true);
            try {
                await uploadShipmentPod(shipmentId, asset.uri, asset.fileName ?? 'proof-of-delivery.jpg', asset.type ?? 'image/jpeg');
                setPhotoUploaded(true);
            } catch (err) {
                showToast(normalizeError(err) || t('deliveryCompletion.photoUploadFailed'), 'error');
            } finally {
                setUploadingPhoto(false);
            }
        });
    };

    const handleSaveSignature = async () => {
        if (!shipmentId) return;
        const current = padRef.current?.getStrokes() ?? strokes;
        if (current.length === 0) {
            showToast(t('deliveryCompletion.drawSignatureFirst'), 'error');
            return;
        }
        setSavingSignature(true);
        try {
            await saveDeliverySignature(shipmentId, current);
            setSignatureCaptured(true);
        } catch (err) {
            showToast(normalizeError(err) || t('deliveryCompletion.couldNotSaveSignature'), 'error');
        } finally {
            setSavingSignature(false);
        }
    };

    const canComplete = otpVerified && photoUploaded && !completing;

    const handleCompleteTrip = async () => {
        if (!shipmentId || !canComplete) return;
        setCompleting(true);
        try {
            await completeDelivery(shipmentId, otp, packageCondition, deliveryNote.trim() || undefined);
            showToast(t('deliveryCompletion.deliveryCompleted'), 'success');
            close(true);
        } catch (err) {
            showToast(normalizeError(err) || t('deliveryCompletion.unableToComplete'), 'error');
        } finally {
            setCompleting(false);
        }
    };

    return (
        <Modal visible={open} transparent animationType="slide" onRequestClose={() => close(false)}>
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{t('deliveryCompletion.completeDelivery')}</Text>
                        <Pressable onPress={() => close(false)} hitSlop={12}>
                            <X size={22} color={colors.TEXT_SECONDARY} />
                        </Pressable>
                    </View>
                    <Text style={styles.subtitle}>{t('deliveryCompletion.subtitle')}</Text>

                    {}
                    <View style={styles.stepCard}>
                        <View style={styles.stepHeaderRow}>
                            <Text style={styles.stepTitle}>{t('deliveryCompletion.step1Title')}</Text>
                            {otpVerified && <CheckCircle2 size={18} color={colors.SUCCESS} />}
                        </View>
                        {!otpVerified ? (
                            <>
                                <Text style={styles.stepHint}>{t('deliveryCompletion.askReceiverOtp')}</Text>
                                <View style={styles.otpRow}>
                                    <TextInput
                                        style={styles.otpInput}
                                        value={otp}
                                        onChangeText={(t) => {
                                            setOtp(t.replace(/[^0-9]/g, '').slice(0, 4));
                                            setOtpError(null);
                                        }}
                                        keyboardType="number-pad"
                                        maxLength={4}
                                        placeholder="0000"
                                        placeholderTextColor={colors.GRAY}
                                    />
                                    <Pressable
                                        style={[styles.smallBtn, (otp.length !== 4 || verifyingOtp) && styles.smallBtnDisabled]}
                                        disabled={otp.length !== 4 || verifyingOtp}
                                        onPress={handleVerifyOtp}
                                    >
                                        {verifyingOtp ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.smallBtnText}>{t('deliveryCompletion.verifyOtp')}</Text>}
                                    </Pressable>
                                </View>
                                {otpError && <Text style={styles.errorText}>{otpError}</Text>}
                            </>
                        ) : (
                            <Text style={styles.doneText}>{t('deliveryCompletion.verified')}</Text>
                        )}
                    </View>

                    {}
                    <View style={styles.stepCard}>
                        <View style={styles.stepHeaderRow}>
                            <Text style={styles.stepTitle}>{t('deliveryCompletion.step2Title')}</Text>
                            {photoUploaded && <CheckCircle2 size={18} color={colors.SUCCESS} />}
                        </View>
                        <Text style={styles.stepHint}>{t('deliveryCompletion.captureProof')}</Text>
                        <Pressable style={styles.smallBtnOutline} onPress={handleTakePhoto} disabled={uploadingPhoto}>
                            {uploadingPhoto ? (
                                <ActivityIndicator size="small" color={colors.PRIMARY} />
                            ) : (
                                <Text style={styles.smallBtnOutlineText}>{photoUploaded ? t('deliveryCompletion.retakePhoto') : t('deliveryCompletion.takePhoto')}</Text>
                            )}
                        </Pressable>
                        {photoUploaded && <Text style={styles.doneText}>{t('deliveryCompletion.photoAddedHint')}</Text>}
                    </View>

                    {}
                    <View style={styles.stepCard}>
                        <View style={styles.stepHeaderRow}>
                            <Text style={styles.stepTitle}>{t('deliveryCompletion.step3Title')}</Text>
                            {signatureCaptured ? <CheckCircle2 size={18} color={colors.SUCCESS} /> : <Text style={styles.optionalTag}>{t('deliveryCompletion.optional')}</Text>}
                        </View>
                        {!signatureCaptured ? (
                            <>
                                <SignaturePad ref={padRef} onChange={setStrokes} />
                                <View style={styles.signatureActionsRow}>
                                    <SignatureClearButton onPress={() => padRef.current?.clear()} disabled={savingSignature} />
                                    <Pressable style={styles.smallBtn} onPress={handleSaveSignature} disabled={savingSignature}>
                                        {savingSignature ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.smallBtnText}>{t('deliveryCompletion.saveSignature')}</Text>}
                                    </Pressable>
                                </View>
                            </>
                        ) : (
                            <Text style={styles.doneText}>{t('deliveryCompletion.captured')}</Text>
                        )}
                    </View>

                    {}
                    <View style={styles.stepCard}>
                        <View style={styles.stepHeaderRow}>
                            <Text style={styles.stepTitle}>{t('deliveryCompletion.step4Title')}</Text>
                            <Text style={styles.optionalTag}>{t('deliveryCompletion.optional')}</Text>
                        </View>
                        <View style={styles.conditionRow}>
                            <Pressable
                                style={[styles.conditionBtn, packageCondition === 'GOOD' && styles.conditionBtnActive]}
                                onPress={() => setPackageCondition('GOOD')}
                            >
                                <Text style={[styles.conditionBtnText, packageCondition === 'GOOD' && styles.conditionBtnTextActive]}>
                                    {t('deliveryCompletion.conditionGood')}
                                </Text>
                            </Pressable>
                            <Pressable
                                style={[styles.conditionBtn, packageCondition === 'DAMAGED' && styles.conditionBtnActiveDamaged]}
                                onPress={() => setPackageCondition('DAMAGED')}
                            >
                                <Text style={[styles.conditionBtnText, packageCondition === 'DAMAGED' && styles.conditionBtnTextActive]}>
                                    {t('deliveryCompletion.conditionDamaged')}
                                </Text>
                            </Pressable>
                        </View>
                        {packageCondition === 'DAMAGED' && (
                            <TextInput
                                style={styles.noteInput}
                                value={deliveryNote}
                                onChangeText={setDeliveryNote}
                                placeholder={t('deliveryCompletion.deliveryNotePlaceholder')}
                                placeholderTextColor={colors.GRAY}
                                multiline
                            />
                        )}
                    </View>

                    {}
                    <View style={styles.validationCard}>
                        <Text style={styles.validationTitle}>{t('deliveryCompletion.finalValidation')}</Text>
                        <ValidationRow label={t('deliveryCompletion.otpVerifiedLabel')} done={otpVerified} colors={colors} />
                        <ValidationRow label={t('deliveryCompletion.deliveryPhotoAddedLabel')} done={photoUploaded} colors={colors} />
                        <ValidationRow label={t('deliveryCompletion.customerSignatureLabel')} done={signatureCaptured} colors={colors} muted />
                    </View>

                    <Pressable style={[styles.completeBtn, !canComplete && styles.completeBtnDisabled]} disabled={!canComplete} onPress={handleCompleteTrip}>
                        {completing ? <ActivityIndicator color="#fff" /> : <Text style={styles.completeBtnText}>{t('deliveryCompletion.completeTrip')}</Text>}
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
};

const ValidationRow: React.FC<{ label: string; done: boolean; colors: ReturnType<typeof useAppTheme>['colors']; muted?: boolean }> = ({
    label,
    done,
    colors,
    muted,
}) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
        {done ? <CheckCircle2 size={16} color={colors.SUCCESS} /> : <Circle size={16} color={muted ? colors.GRAY : colors.WARNING} />}
        <Text style={{ fontSize: 13, color: done ? colors.TEXT_PRIMARY : colors.TEXT_SECONDARY }}>{label}</Text>
    </View>
);

const makeStyles = (colors: ReturnType<typeof useAppTheme>['colors'], fonts: ReturnType<typeof useAppTheme>['fonts']) =>
    StyleSheet.create({
        overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
        sheet: { backgroundColor: colors.BACKGROUND, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '90%' },
        header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        title: { fontSize: 17, fontFamily: fonts.BOLD_PRIMARY, color: colors.TEXT_PRIMARY },
        subtitle: { fontSize: 12, color: colors.TEXT_SECONDARY, marginTop: 4, marginBottom: 14 },
        stepCard: { backgroundColor: colors.SURFACE, borderRadius: 12, borderWidth: 1, borderColor: colors.BORDER, padding: 14, marginBottom: 12 },
        stepHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        stepTitle: { fontSize: 14, fontFamily: fonts.SEMI_BOLD_PRIMARY, color: colors.TEXT_PRIMARY },
        stepHint: { fontSize: 12, color: colors.TEXT_SECONDARY, marginTop: 4, marginBottom: 10 },
        doneText: { fontSize: 12, color: colors.SUCCESS, marginTop: 8, fontWeight: '600' },
        optionalTag: { fontSize: 11, color: colors.GRAY },
        otpRow: { flexDirection: 'row', gap: 8 },
        otpInput: {
            flex: 1,
            borderWidth: 1,
            borderColor: colors.BORDER,
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 10,
            fontSize: 18,
            letterSpacing: 6,
            textAlign: 'center',
            color: colors.TEXT_PRIMARY,
        },
        errorText: { fontSize: 12, color: colors.ERROR, marginTop: 6 },
        smallBtn: { backgroundColor: colors.PRIMARY, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
        smallBtnDisabled: { opacity: 0.5 },
        smallBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
        smallBtnOutline: { borderWidth: 1, borderColor: colors.PRIMARY, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
        smallBtnOutlineText: { color: colors.PRIMARY, fontSize: 13, fontWeight: '700' },
        signatureActionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
        conditionRow: { flexDirection: 'row', gap: 10 },
        conditionBtn: { flex: 1, borderWidth: 1, borderColor: colors.BORDER, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
        conditionBtnActive: { backgroundColor: colors.SUCCESS, borderColor: colors.SUCCESS },
        conditionBtnActiveDamaged: { backgroundColor: colors.ERROR, borderColor: colors.ERROR },
        conditionBtnText: { fontSize: 13, fontWeight: '700', color: colors.TEXT_SECONDARY },
        conditionBtnTextActive: { color: '#fff' },
        noteInput: { borderWidth: 1, borderColor: colors.BORDER, borderRadius: 10, padding: 10, marginTop: 10, minHeight: 60, textAlignVertical: 'top', color: colors.TEXT_PRIMARY, fontSize: 13 },
        validationCard: { backgroundColor: colors.SURFACE, borderRadius: 12, borderWidth: 1, borderColor: colors.BORDER, padding: 14, marginBottom: 16 },
        validationTitle: { fontSize: 13, fontFamily: fonts.SEMI_BOLD_PRIMARY, color: colors.TEXT_PRIMARY, marginBottom: 2 },
        completeBtn: { backgroundColor: colors.PRIMARY, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
        completeBtnDisabled: { opacity: 0.4 },
        completeBtnText: { color: '#fff', fontSize: 14, fontFamily: fonts.BOLD_PRIMARY, letterSpacing: 0.5 },
    });
