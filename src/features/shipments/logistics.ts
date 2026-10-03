import { useCallback } from 'react';
import Geolocation from 'react-native-geolocation-service';
import { launchCamera } from 'react-native-image-picker';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { Shipment, ShipmentStatus } from '@shipment/types';
import { useAuthStore } from '@features/store/authStore';
import { confirmDialog } from '@ui/alert/confirmStore';
import { requestCompleteDelivery } from '@ui/alert/deliveryCompletionStore';
import { requestOtp } from '@ui/alert/deliveryOtpStore';
import { showToast } from '@ui/alert/toastStore';
import { ensureCameraPermission } from '@utils/cameraPermission';
import { normalizeError } from '@utils/error';
import { ensureLocationPermission } from '@utils/locationPermission';
import {
    acceptShipment,
    arriveAtShipment,
    completeDelivery,
    cancelShipment,
    driverCancelShipment,
    failDeliveryShipment,
    saveDeliverySignature,
    startDelivery,
    uploadShipmentPod,
    uploadPickupProof,
    verifyDeliveryOtp,
} from './api/shipments.api';
import { shipmentKeys } from './hooks';

type UserRole = 'customer' | 'driver';

interface LogisticsLocation {
    address: string;
    lat: number;
    lng: number;
}

export interface LogisticsItem {
    id: string;
    trackingId: string;
    goodsType: string;
    weightKg?: number;
    pickup: LogisticsLocation;
    drop: LogisticsLocation;
    price: number;
    distanceKm: number;
    status: ShipmentStatus;
    createdAt: string;
    driverName?: string;
    driverRating?: number;
    driverId: string;
    driverPhone?: string;
    etaMinutes?: number;
    expiresAt?: string;
    customerName?: string;
    customerPhone?: string;
    category?: string;
    helpersCount?: number;
    arrivalState?: Shipment['arrivalState'];
    deliveryInstructions?: string | null;
}

export const useUserRole = (): UserRole => {
    const role = useAuthStore((s) => s.user?.role);
    return role === 'DRIVER' ? 'driver' : 'customer';
};

export const toLogisticsItem = (
    shipment: Shipment,
    customerFallback: string,
): LogisticsItem => ({
    id: shipment.id,
    trackingId: shipment.trackingId,
    goodsType: shipment.goodsType,
    weightKg: shipment.weightKg,
    pickup: shipment.pickup,
    drop: shipment.drop,
    price: shipment.price,
    distanceKm: shipment.distanceKm,
    status: shipment.status,
    createdAt: shipment.createdAt,
    driverName: shipment.dispatch?.driverName,
    driverRating: shipment.dispatch?.driverRating,
    driverId: shipment.dispatch?.driverId ?? '',
    driverPhone: shipment.dispatch?.driverPhone,
    customerName: shipment.sender?.name ?? customerFallback,
    customerPhone: shipment.sender?.phone,
    category: shipment.category,
    helpersCount: shipment.helpersCount,
    arrivalState: shipment.arrivalState,
    deliveryInstructions: shipment.deliveryInstructions,
});

const invalidateShipmentCaches = (
    queryClient: ReturnType<typeof useQueryClient>,
    id?: string,
) => {
    queryClient.invalidateQueries({ queryKey: shipmentKeys.mine() });
    queryClient.invalidateQueries({ queryKey: shipmentKeys.history() });
    queryClient.invalidateQueries({ queryKey: shipmentKeys.searching() });
    queryClient.invalidateQueries({ queryKey: shipmentKeys.driverMine() });
    queryClient.invalidateQueries({ queryKey: shipmentKeys.admin() });
    if (id) {
        queryClient.invalidateQueries({ queryKey: shipmentKeys.detail(id) });
    }
};

export const useCustomerShipmentActions = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const onCancel = useCallback(async (id: string) => {
        try {
            await cancelShipment(id);
            invalidateShipmentCaches(queryClient, id);
            showToast(t('logisticsCard.orderCancelled'), 'success');
        } catch (err) {
            showToast(normalizeError(err), 'error');
        }
    }, [queryClient, t]);

    return { onCancel };
};

export const useDriverShipmentActions = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const onAccept = useCallback(async (id: string) => {
        try {
            await acceptShipment(id);
            invalidateShipmentCaches(queryClient, id);
            showToast(t('logisticsCard.orderAccepted'), 'success');
        } catch (err) {
            showToast(normalizeError(err) || t('logisticsCard.orderAlreadyTaken'), 'error');
        }
    }, [queryClient, t]);

    const onArrive = useCallback((id: string, coords?: { latitude: number; longitude: number }) => {
        const submit = (latitude: number, longitude: number) => {
            arriveAtShipment(id, latitude, longitude)
                .then(() => {
                    invalidateShipmentCaches(queryClient, id);
                    showToast(t('logisticsCard.arrivalRecorded'), 'success');
                })
                .catch((err) => showToast(normalizeError(err) || t('logisticsCard.couldNotRecordArrival'), 'error'));
        };

        if (coords) {
            submit(coords.latitude, coords.longitude);
            return;
        }

        (async () => {
            const granted = await ensureLocationPermission();
            if (!granted) {
                showToast(t('logisticsCard.couldNotGetLocation'), 'error');
                return;
            }
            Geolocation.getCurrentPosition(
                (position) => submit(position.coords.latitude, position.coords.longitude),
                () => showToast(t('logisticsCard.couldNotGetLocation'), 'error'),
                { enableHighAccuracy: true, timeout: 15000 },
            );
        })();
    }, [queryClient, t]);

    const onStartDelivery = useCallback((id: string) => {
        (async () => {
            const otp = await requestOtp('pickup');
            if (!otp) return;

            const hasCameraPermission = await ensureCameraPermission();
            if (!hasCameraPermission) {
                showToast(t('logisticsCard.cameraPermissionPickup'), 'error');
                return;
            }

            launchCamera({ mediaType: 'photo', quality: 0.8, saveToPhotos: false }, async (response) => {
                if (response.didCancel) return;
                const asset = response.assets?.[0];
                if (response.errorCode || !asset?.uri) {
                    if (__DEV__) console.warn('[onStartDelivery] camera error', response.errorCode, response.errorMessage);
                    showToast(
                        response.errorCode
                            ? t('logisticsCard.couldNotCapturePhoto', { reason: response.errorMessage ?? response.errorCode })
                            : t('logisticsCard.couldNotCapturePhotoRetry'),
                        'error',
                    );
                    return;
                }

                try {
                    await uploadPickupProof(id, asset.uri, asset.fileName ?? 'pickup-proof.jpg', asset.type ?? 'image/jpeg');
                } catch (err) {
                    showToast(normalizeError(err) || t('logisticsCard.pickupProofUploadFailed'), 'error');
                    return;
                }

                try {
                    await startDelivery(id, otp);
                    invalidateShipmentCaches(queryClient, id);
                    showToast(t('logisticsCard.deliveryInProgress'), 'success');
                } catch (err) {
                    showToast(normalizeError(err) || t('logisticsCard.incorrectOtpOrFailed'), 'error');
                }
            });
        })();
    }, [queryClient, t]);

    const onCompleteDelivery = useCallback((id: string) => {
        requestCompleteDelivery(id).then((completed) => {
            if (!completed) return;
            invalidateShipmentCaches(queryClient, id);
            showToast(t('logisticsCard.deliveryCompleted'), 'success');
        });
    }, [queryClient, t]);

    const onDriverCancel = useCallback(async (id: string) => {
        const confirmed = await confirmDialog({
            title: t('logisticsCard.driverCancelTitle'),
            message: t('logisticsCard.driverCancelConfirm'),
            confirmText: t('logisticsCard.driverCancelConfirmBtn'),
            destructive: true,
        });
        if (!confirmed) return;

        try {
            await driverCancelShipment(id);
            invalidateShipmentCaches(queryClient, id);
            showToast(t('logisticsCard.driverCancelled'), 'success');
        } catch (err) {
            showToast(normalizeError(err), 'error');
        }
    }, [queryClient, t]);

    const onFailDelivery = useCallback(async (
        id: string,
        reason: 'CUSTOMER_UNREACHABLE' | 'WRONG_ADDRESS' | 'REFUSED' | 'OTHER',
        note?: string,
    ) => {
        try {
            await failDeliveryShipment(id, reason, note);
            invalidateShipmentCaches(queryClient, id);
            showToast(t('logisticsCard.deliveryFailedRecorded'), 'info');
        } catch (err) {
            showToast(normalizeError(err), 'error');
        }
    }, [queryClient, t]);

    return { onAccept, onArrive, onStartDelivery, onCompleteDelivery, onDriverCancel, onFailDelivery };
};

export const useShipmentDeliveryCompletionActions = () => {
    const queryClient = useQueryClient();

    const verifyOtp = useCallback(
        (shipmentId: string, otp: string) => verifyDeliveryOtp(shipmentId, otp),
        [],
    );

    const uploadPod = useCallback(
        (shipmentId: string, fileUri: string, fileName: string, mimeType: string) =>
            uploadShipmentPod(shipmentId, fileUri, fileName, mimeType),
        [],
    );

    const saveSignature = useCallback(
        (shipmentId: string, strokes: { x: number; y: number }[][]) =>
            saveDeliverySignature(shipmentId, strokes),
        [],
    );

    const complete = useCallback(async (
        shipmentId: string,
        otp: string,
        packageCondition?: 'GOOD' | 'DAMAGED',
        deliveryNote?: string,
    ) => {
        const shipment = await completeDelivery(shipmentId, otp, packageCondition, deliveryNote);
        invalidateShipmentCaches(queryClient, shipmentId);
        return shipment;
    }, [queryClient]);

    return { verifyOtp, uploadPod, saveSignature, complete };
};
