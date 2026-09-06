// GlobalDeliveryCompletionSheet.tsx — Driver
//
// Mounted once at the app root (App.tsx), same pattern as GlobalToast /
// GlobalDeliveryOtpModal. Replaces the previous "OTP prompt -> camera ->
// API call" sequence for delivery completion with a real 3-step sheet
// (OTP, Photos, Signature) + a final-validation checklist, per the
// product decision that Complete Delivery must be reachable immediately
// after accept — no GPS/geofence involved anywhere in this sheet. Every
// step calls a real backend endpoint; the UI state (✓ marks) is just a
// reflection of what actually succeeded server-side, never a client-side
// assumption. The final "Complete Trip" call independently re-validates
// OTP + photo itself (kalanabhaBackend 81263b1) regardless of what this
// sheet thinks it already confirmed.
//
// Pickup verification is untouched — this sheet is delivery-only.
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

export const GlobalDeliveryCompletionSheet: React.FC = () => {
    const { colors, fonts } = useAppTheme();
    const styles = React.useMemo(() => makeStyles(colors, fonts), [colors, fonts]);

    const open = useDeliveryCompletionStore((s) => s.open);
    const shipmentId = useDeliveryCompletionStore((s) => s.shipmentId);
    const resolve = useDeliveryCompletionStore((s) => s.resolve);

    const [otp, setOtp] = useState('');
    const [otpVerified, setOtpVerified] = useState(false);
    const [verifyingOtp, setVerifyingOtp] = useState(false);
    const [otpError, setOtpError] = useState<string | null>(null);

    const [photoCount, setPhotoCount] = useState(0);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    const [signatureCaptured, setSignatureCaptured] = useState(false);
    const [savingSignature, setSavingSignature] = useState(false);
    const [strokes, setStrokes] = useState<Point[][]>([]);
    const padRef = useRef<{ clear: () => void; getStrokes: () => Point[][] }>(null);

    const [completing, setCompleting] = useState(false);

    const reset = () => {
        setOtp('');
        setOtpVerified(false);
        setOtpError(null);
        setPhotoCount(0);
        setSignatureCaptured(false);
        setStrokes([]);
        padRef.current?.clear();
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
            setOtpError(normalizeError(err) || 'Incorrect OTP');
        } finally {
            setVerifyingOtp(false);
        }
    };

    const handleTakePhoto = async () => {
        if (!shipmentId) return;

        // Real, confirmed failure otherwise (found live on the pickup
        // flow, same launchCamera call shape): AndroidManifest.xml
        // declares CAMERA, so react-native-image-picker won't request it
        // for us — see cameraPermission.ts.
        const hasCameraPermission = await ensureCameraPermission();
        if (!hasCameraPermission) {
            showToast('Camera permission is required to capture delivery proof', 'error');
            return;
        }

        launchCamera({ mediaType: 'photo', quality: 0.8, saveToPhotos: false }, async (response) => {
            if (response.didCancel) return;
            const asset = response.assets?.[0];
            if (response.errorCode || !asset?.uri) {
                // Surface the real reason (camera_unavailable/permission/
                // others) instead of a generic message — this is exactly
                // the class of error an emulator with no configured
                // camera or a denied permission throws, and the generic
                // toast was hiding which one it actually was.
                if (__DEV__) console.warn('[DeliveryCompletionSheet] camera error', response.errorCode, response.errorMessage);
                showToast(
                    response.errorCode ? `Could not capture a photo — ${response.errorMessage ?? response.errorCode}` : 'Could not capture a photo — try again',
                    'error',
                );
                return;
            }
            setUploadingPhoto(true);
            try {
                await uploadShipmentPod(shipmentId, asset.uri, asset.fileName ?? 'proof-of-delivery.jpg', asset.type ?? 'image/jpeg');
                setPhotoCount((c) => c + 1);
            } catch (err) {
                showToast(normalizeError(err) || 'Photo upload failed — try again', 'error');
            } finally {
                setUploadingPhoto(false);
            }
        });
    };

    const handleSaveSignature = async () => {
        if (!shipmentId) return;
        const current = padRef.current?.getStrokes() ?? strokes;
        if (current.length === 0) {
            showToast('Draw a signature first', 'error');
            return;
        }
        setSavingSignature(true);
        try {
            await saveDeliverySignature(shipmentId, current);
            setSignatureCaptured(true);
        } catch (err) {
            showToast(normalizeError(err) || 'Could not save signature — try again', 'error');
        } finally {
            setSavingSignature(false);
        }
    };

    const canComplete = otpVerified && photoCount > 0 && !completing;

    const handleCompleteTrip = async () => {
        if (!shipmentId || !canComplete) return;
        setCompleting(true);
        try {
            await completeDelivery(shipmentId, otp);
            showToast('Delivery completed!', 'success');
            close(true);
        } catch (err) {
            showToast(normalizeError(err) || 'Unable to complete delivery — please complete all required steps', 'error');
        } finally {
            setCompleting(false);
        }
    };

    return (
        <Modal visible={open} transparent animationType="slide" onRequestClose={() => close(false)}>
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Complete Delivery</Text>
                        <Pressable onPress={() => close(false)} hitSlop={12}>
                            <X size={22} color={colors.TEXT_SECONDARY} />
                        </Pressable>
                    </View>
                    <Text style={styles.subtitle}>Complete all required steps before finishing this trip.</Text>

                    {/* Step 1 — Delivery OTP */}
                    <View style={styles.stepCard}>
                        <View style={styles.stepHeaderRow}>
                            <Text style={styles.stepTitle}>① Delivery OTP</Text>
                            {otpVerified && <CheckCircle2 size={18} color={colors.SUCCESS} />}
                        </View>
                        {!otpVerified ? (
                            <>
                                <Text style={styles.stepHint}>Ask the receiver for their 4-digit delivery code</Text>
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
                                        {verifyingOtp ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.smallBtnText}>Verify OTP</Text>}
                                    </Pressable>
                                </View>
                                {otpError && <Text style={styles.errorText}>{otpError}</Text>}
                            </>
                        ) : (
                            <Text style={styles.doneText}>Verified</Text>
                        )}
                    </View>

                    {/* Step 2 — Delivery Photos */}
                    <View style={styles.stepCard}>
                        <View style={styles.stepHeaderRow}>
                            <Text style={styles.stepTitle}>② Delivery Photos</Text>
                            {photoCount > 0 && <CheckCircle2 size={18} color={colors.SUCCESS} />}
                        </View>
                        <Text style={styles.stepHint}>Capture proof of delivery</Text>
                        <Pressable style={styles.smallBtnOutline} onPress={handleTakePhoto} disabled={uploadingPhoto}>
                            {uploadingPhoto ? (
                                <ActivityIndicator size="small" color={colors.PRIMARY} />
                            ) : (
                                <Text style={styles.smallBtnOutlineText}>{photoCount > 0 ? 'Take Another Photo' : 'Take Photo'}</Text>
                            )}
                        </Pressable>
                        {photoCount > 0 && <Text style={styles.doneText}>{photoCount} photo{photoCount > 1 ? 's' : ''} added</Text>}
                    </View>

                    {/* Step 3 — Customer Signature (optional) */}
                    <View style={styles.stepCard}>
                        <View style={styles.stepHeaderRow}>
                            <Text style={styles.stepTitle}>③ Customer Signature</Text>
                            {signatureCaptured ? <CheckCircle2 size={18} color={colors.SUCCESS} /> : <Text style={styles.optionalTag}>Optional</Text>}
                        </View>
                        {!signatureCaptured ? (
                            <>
                                <SignaturePad ref={padRef} onChange={setStrokes} />
                                <View style={styles.signatureActionsRow}>
                                    <SignatureClearButton onPress={() => padRef.current?.clear()} disabled={savingSignature} />
                                    <Pressable style={styles.smallBtn} onPress={handleSaveSignature} disabled={savingSignature}>
                                        {savingSignature ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.smallBtnText}>Save Signature</Text>}
                                    </Pressable>
                                </View>
                            </>
                        ) : (
                            <Text style={styles.doneText}>Captured</Text>
                        )}
                    </View>

                    {/* Final validation */}
                    <View style={styles.validationCard}>
                        <Text style={styles.validationTitle}>Final Validation</Text>
                        <ValidationRow label="OTP Verified" done={otpVerified} colors={colors} />
                        <ValidationRow label="Delivery Photos Added" done={photoCount > 0} colors={colors} />
                        <ValidationRow label="Customer Signature (optional)" done={signatureCaptured} colors={colors} muted />
                    </View>

                    <Pressable style={[styles.completeBtn, !canComplete && styles.completeBtnDisabled]} disabled={!canComplete} onPress={handleCompleteTrip}>
                        {completing ? <ActivityIndicator color="#fff" /> : <Text style={styles.completeBtnText}>COMPLETE TRIP</Text>}
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
        validationCard: { backgroundColor: colors.SURFACE, borderRadius: 12, borderWidth: 1, borderColor: colors.BORDER, padding: 14, marginBottom: 16 },
        validationTitle: { fontSize: 13, fontFamily: fonts.SEMI_BOLD_PRIMARY, color: colors.TEXT_PRIMARY, marginBottom: 2 },
        completeBtn: { backgroundColor: colors.PRIMARY, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
        completeBtnDisabled: { opacity: 0.4 },
        completeBtnText: { color: '#fff', fontSize: 14, fontFamily: fonts.BOLD_PRIMARY, letterSpacing: 0.5 },
    });
