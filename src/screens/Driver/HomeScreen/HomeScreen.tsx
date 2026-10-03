import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    StyleSheet,
    View,
    Text,
    RefreshControl,
    StatusBar,
    ScrollView,
    TouchableOpacity,
    Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSearchingShipments, useMyShipmentsAsDriver, useAcceptShipment, useCompleteShipmentStop } from '@features/shipments/hooks';
import {
    toLogisticsItem,
    useDriverShipmentActions,
    type LogisticsItem,
} from '@features/shipments/logistics';
import Animated, {
    FadeIn,
    SlideInDown,
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { DriverHeader } from '@components/DriverHeader';
import { LogisticsCardList } from '@components/LogisticsCardList';
import {
    AlertCircle,
    RefreshCw,
    Package,
    CheckCircle2,
    Wallet,
    MessageCircle,
    Fuel,
    FileText,
    ShieldAlert,
    MapPin,
    Navigation,
    X,
    Radar,
} from 'lucide-react-native';

import { registerFCMToken } from '@utils/cm';
import { useTranslation } from 'react-i18next';
import { useDriverLiveLocation } from '@location/useDriverLiveLocation';
import { openGoogleMapsDirections } from '@utils/navigation';
import { LiveTrackingMap } from '@components/LiveTrackingMap';
import { TurnByTurnRouteLine, TurnByTurnBanner } from '@components/TurnByTurnNav';
import { useTurnByTurnRoute } from '@features/navigation/useTurnByTurnRoute';
import { useAuthStore } from '@features/store/authStore';
import { showToast } from '@ui/alert/toastStore';
import { Linking } from 'react-native';
import { useVehicleConfigs, useServiceAreas, useBusinessSettings } from '@features/settings/hooks';
import { ensureServiceAreaTilesCached } from '@location/offlineMapCache';
import { getOfflineMapsEnabled } from '@services/storage';
import VehicleVisual from '@components/VehicleVisual';
import FONTS from '@utils/fonts';
import { SkeletonDashboard } from '@components/ui';
import { useTabBarContentPadding } from '../../navigation/useTabBarStyle';



const DRIVE_MORE_TRUCK = require('../../../../assets/images/home/delivery-truck-hero.png');





const SUPPORT_EMAIL = 'support@kalanabha.com';

interface HomeScreenProps { }



const HomeScreen: React.FC<HomeScreenProps> = () => {
    
    const navigation = useNavigation();
    const { t } = useTranslation();
    const {
        data: searchingShipments,
        isLoading: loading,
        isRefetching: refreshing,
        error: shipmentsError,
        refetch: refetchShipments,
    } = useSearchingShipments();

    
    
    
    
    const { data: myShipments, refetch: refetchMyShipments } = useMyShipmentsAsDriver();
    const activeDelivery = useMemo(
        () => myShipments?.find((s) => s.status === 'accepted' || s.status === 'in_transit'),
        [myShipments],
    );
    const driverActions = useDriverShipmentActions();
    
    
    
    const { mutate: completeStop, isPending: completingStop } = useCompleteShipmentStop(activeDelivery?.id ?? '');
    const nextPendingStop = useMemo(
        () => activeDelivery?.stops?.find((s) => s.status !== 'COMPLETED') ?? null,
        [activeDelivery],
    );

    const shipments = useMemo<LogisticsItem[]>(
        () => (searchingShipments ?? []).map((shipment) => toLogisticsItem(
            shipment,
            t('driverHome.customerFallback'),
        )),
        [searchingShipments, t],
    );
    const error = shipmentsError ? shipmentsError.message : null;

    
    
    
    
    
    
    const todaysDeliveries = useMemo(() => {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        return (myShipments ?? []).filter(
            (s) => s.status === 'delivered' && new Date(s.updatedAt) >= startOfToday,
        );
    }, [myShipments]);
    const todayEarnings = useMemo(
        () => todaysDeliveries.reduce((sum, s) => sum + s.price, 0),
        [todaysDeliveries],
    );
    const deliveredToday = todaysDeliveries.length;
    
    
    
    const isOnline = useAuthStore((s) => s.user?.isOnline ?? false);
    const documentsVerified = useAuthStore((s) => s.user?.documentsVerified ?? false);

    
    
    
    
    
    const { data: vehicleConfigsData } = useVehicleConfigs();
    const vehicleForType = useCallback(
        (vehicleType: string) => vehicleConfigsData?.find((v) => v.name.toLowerCase() === vehicleType.toLowerCase()) ?? { name: vehicleType, imageUrl: null },
        [vehicleConfigsData],
    );

    
    
    
    
    const { data: driverServiceAreas } = useServiceAreas();
    const { data: businessSettings } = useBusinessSettings();
    useEffect(() => {
        const active = (driverServiceAreas ?? []).filter((a) => a.active);
        if (active.length > 0 && getOfflineMapsEnabled()) {
            ensureServiceAreaTilesCached(active);
        }
        
    }, [driverServiceAreas]);

    
    
    
    
    
    
    const incomingRequest = searchingShipments?.[0];
    const remainingShipments = useMemo(
        () => shipments.filter((s) => s.id !== incomingRequest?.id),
        [shipments, incomingRequest],
    );
    const { mutate: acceptIncoming, isPending: acceptingIncoming } = useAcceptShipment(incomingRequest?.id ?? '');
    const [dismissedIncomingId, setDismissedIncomingId] = useState<string | null>(null);

    // Real countdown to the shipment's real, admin-set expiry
    
    
    
    const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
    useEffect(() => {
        if (!incomingRequest?.expiresAt) {
            setRemainingSeconds(null);
            return;
        }
        const expiresAtMs = new Date(incomingRequest.expiresAt).getTime();
        let interval: ReturnType<typeof setInterval> | null = null;
        const tick = () => {
            const nextRemainingSeconds = Math.max(0, Math.round((expiresAtMs - Date.now()) / 1000));
            setRemainingSeconds(nextRemainingSeconds);
            if (nextRemainingSeconds === 0) {
                refetchShipments();
                if (interval) {
                    clearInterval(interval);
                }
            }
        };
        tick();
        interval = setInterval(tick, 1000);
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [incomingRequest?.expiresAt, refetchShipments]);

    const countdownLabel = remainingSeconds === null
        ? null
        : `${String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:${String(remainingSeconds % 60).padStart(2, '0')}`;
    const isIncomingExpired = remainingSeconds !== null && remainingSeconds <= 0;
    const showIncomingCard = !!incomingRequest && incomingRequest.id !== dismissedIncomingId && !isIncomingExpired;

    const handleAcceptIncoming = () => {
        if (!incomingRequest) return;
        acceptIncoming(undefined, {
            onSuccess: () => showToast(t('driverHome.orderAcceptedToast'), 'success'),
            onError: () => showToast(t('driverHome.orderAlreadyTakenToast'), 'error'),
        });
    };

    const handleSos = () => {
        
        
        
        const emergencyPhone = businessSettings?.find((s) => s.key === 'emergency_contact_phone')?.value;
        if (emergencyPhone) {
            Linking.openURL(`tel:${emergencyPhone}`).catch(() =>
                showToast(t('driverHome.noEmailAppToast'), 'error'),
            );
            return;
        }
        Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Driver%20SOS`).catch(() =>
            showToast(t('driverHome.noEmailAppToast'), 'error'),
        );
    };

    
    const headerScale = useSharedValue(0.95);
    const contentOpacity = useSharedValue(0);

    useEffect(() => {
        headerScale.value = withSpring(1, { damping: 12, mass: 1 });
        contentOpacity.value = withSpring(1, { damping: 10, mass: 1 });
        
        
    }, [contentOpacity, headerScale]);




    
    
    
    
    
    
    
    const driverPosition = useDriverLiveLocation(!!activeDelivery);
    
    
    const navRoute = useTurnByTurnRoute(
        driverPosition,
        activeDelivery ? (activeDelivery.status === 'accepted' ? activeDelivery.pickup : activeDelivery.drop) : null,
    );
    const activeDeliverySteps = useMemo(() => {
        if (!activeDelivery) return [];
        const pickupDone = activeDelivery.status === 'in_transit' || activeDelivery.status === 'delivered';
        const deliveryDone = activeDelivery.status === 'delivered';
        return [
            { label: 'Accepted', done: true, active: activeDelivery.status === 'accepted' && !activeDelivery.pickupProofUploadedAt },
            { label: 'Pickup OTP', done: pickupDone, active: activeDelivery.status === 'accepted' },
            { label: 'In transit', done: pickupDone, active: activeDelivery.status === 'in_transit' },
            { label: 'Delivery OTP', done: deliveryDone, active: activeDelivery.status === 'in_transit' },
        ];
    }, [activeDelivery]);

    
    
    
    
    
    
    
    useEffect(() => {
        registerFCMToken('driver');
    }, []);

    
    const onRefresh = useCallback(() => {
        refetchShipments();
        refetchMyShipments();
    }, [refetchShipments, refetchMyShipments]);

    
    const onRetry = useCallback(() => {
        refetchShipments();
    }, [refetchShipments]);

    
    const headerAnimStyle = useAnimatedStyle(() => ({
        transform: [{ scale: headerScale.value }],
    }));

    const contentAnimStyle = useAnimatedStyle(() => ({
        opacity: contentOpacity.value,
    }));
    const tabBarPadding = useTabBarContentPadding();

    
    if (loading) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
                <SkeletonDashboard />
            </View>
        );
    }

    
    if (error && shipments.length === 0) {
        return (
            <View style={styles.errorContainer}>
                <StatusBar barStyle="dark-content" backgroundColor="#FEF2F2" />
                <Animated.View entering={FadeIn} style={styles.errorContent}>
                    <View style={styles.errorIcon}>
                        <AlertCircle size={48} color="#EF4444" />
                    </View>
                    <Text style={styles.errorTitle}>{t('driverHome.errorTitle')}</Text>
                    <Text style={styles.errorMessage}>{error}</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={onRetry}
                    
                    >
                        <RefreshCw size={18} color="#FFF" />
                        <Text style={styles.retryText}>{t('common.retry')}</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        );
    }

    return (
        <>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
            <View style={styles.container}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#FF7518']}
                            tintColor="#FF7518"
                            progressBackgroundColor="#F0F0F0"
                        />
                    }
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarPadding }]}
                >
                {}
                <Animated.View style={[headerAnimStyle, { width: '100%' }]}>
                    <DriverHeader
                        earnings={todayEarnings}
                        deliveredToday={deliveredToday}
                        isOnline={isOnline}
                        style={styles.header}
                        onSos={handleSos}
                    />
                </Animated.View>

                {}
                {activeDelivery && (
                    <View style={styles.activeDeliveryCard}>
                        <TouchableOpacity
                            style={styles.activeDeliveryRow}
                            onPress={() => (navigation as any).navigate('ShipmentChat', { shipmentId: activeDelivery.id })}
                        >
                            <VehicleVisual
                                vehicle={vehicleForType(activeDelivery.vehicleType)}
                                size={40}
                                iconSize={18}
                                borderRadius={10}
                                backgroundColor="#FFF1E8"
                                iconColor="#FF7518"
                            />
                            <View style={styles.activeDeliveryContent}>
                                <Text style={styles.activeDeliveryTitle}>
                                    {t('driverHome.activeDeliveryLabel', { trackingId: activeDelivery.trackingId })}
                                </Text>
                                <Text style={styles.activeDeliverySub} numberOfLines={1}>
                                    {activeDelivery.from} → {activeDelivery.to}
                                </Text>
                                <Text style={styles.arrivalStatusText}>
                                    {activeDelivery.status === 'accepted' ? t('driverHome.pickupVerificationPending') : t('driverHome.inTransitStatus')}
                                </Text>
                                {!!activeDelivery.deliveryInstructions && (
                                    <Text style={styles.deliveryInstructionsText} numberOfLines={1}>
                                        {t('driverHome.deliveryInstructionsLabel')}: {activeDelivery.deliveryInstructions}
                                    </Text>
                                )}
                            </View>
                            <View style={styles.chatPill}>
                                <MessageCircle color="#fff" size={14} />
                                <Text style={styles.chatPillText}>{t('driverHome.chat')}</Text>
                            </View>
                        </TouchableOpacity>
                        <View style={styles.deliveryFlowWrap}>
                            {activeDeliverySteps.map((step, index) => (
                                <React.Fragment key={step.label}>
                                    {index > 0 && <View style={[styles.deliveryFlowLine, step.done && styles.deliveryFlowLineDone]} />}
                                    <View style={styles.deliveryFlowStep}>
                                        <View
                                            style={[
                                                styles.deliveryFlowDot,
                                                step.done && styles.deliveryFlowDotDone,
                                                step.active && styles.deliveryFlowDotActive,
                                            ]}
                                        >
                                            {step.done ? <CheckCircle2 size={13} color="#fff" /> : <Text style={styles.deliveryFlowDotText}>{index + 1}</Text>}
                                        </View>
                                        <Text
                                            style={[
                                                styles.deliveryFlowLabel,
                                                step.done && styles.deliveryFlowLabelDone,
                                                step.active && styles.deliveryFlowLabelActive,
                                            ]}
                                            numberOfLines={1}
                                        >
                                            {step.label}
                                        </Text>
                                    </View>
                                </React.Fragment>
                            ))}
                        </View>
                        {}
                        <View style={styles.embeddedMapWrap}>
                            <LiveTrackingMap
                                pickup={activeDelivery.status === 'accepted' ? activeDelivery.pickup : undefined}
                                drop={activeDelivery.pickup ? activeDelivery.drop : undefined}
                                driver={driverPosition}
                                height={180}
                            >
                                <TurnByTurnRouteLine route={navRoute.route} />
                            </LiveTrackingMap>
                            <TurnByTurnBanner loading={navRoute.loading} nextStep={navRoute.nextStep} />
                        </View>
                        <TouchableOpacity
                            style={styles.openMapsRow}
                            onPress={() => openGoogleMapsDirections(activeDelivery.pickup, activeDelivery.drop)}
                        >
                            <Navigation color="#FF7518" size={13} />
                            <Text style={styles.openMapsText}>{t('driverHome.openDirectionsInMaps')}</Text>
                        </TouchableOpacity>

                        {}
                        {activeDelivery.status === 'accepted' && (
                            <TouchableOpacity style={styles.arrivalCtaBtn} onPress={() => driverActions.onStartDelivery(activeDelivery.id)}>
                                <Text style={styles.arrivalCtaText}>{t('driverHome.verifyPickup')}</Text>
                            </TouchableOpacity>
                        )}
                        {activeDelivery.status === 'in_transit' && (
                            <TouchableOpacity style={styles.arrivalCtaBtn} onPress={() => driverActions.onCompleteDelivery(activeDelivery.id)}>
                                <Text style={styles.arrivalCtaText}>{t('driverHome.completeDelivery')}</Text>
                            </TouchableOpacity>
                        )}

                        {}
                        {!!activeDelivery.stops?.length && (
                            <View style={styles.stopsListWrap}>
                                {activeDelivery.stops.map((stop) => {
                                    const isNext = nextPendingStop?.id === stop.id;
                                    const isDone = stop.status === 'COMPLETED';
                                    return (
                                        <View key={stop.id} style={styles.stopListRow}>
                                            <Text style={[styles.stopListSeq, isDone && styles.stopListSeqDone]}>
                                                {isDone ? '✓' : stop.sequence}
                                            </Text>
                                            <Text style={styles.stopListAddress} numberOfLines={1}>{stop.address}</Text>
                                            {isNext && (
                                                <TouchableOpacity
                                                    style={styles.stopCompleteBtn}
                                                    disabled={completingStop}
                                                    onPress={() => completeStop(stop.id)}
                                                >
                                                    <Text style={styles.stopCompleteBtnText}>{t('driverHome.completeStop')}</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </View>
                )}

                {}
                {showIncomingCard && incomingRequest && (
                    <Animated.View entering={FadeIn} style={styles.incomingCard}>
                        <View style={styles.incomingHeaderRow}>
                            <Text style={styles.incomingHeaderText}>
                                {incomingRequest.category === 'HOUSE_SHIFTING' ? t('driverHome.incomingMoveRequest') : t('driverHome.incomingLoadRequest')}
                            </Text>
                            {countdownLabel !== null && (
                                <View style={styles.incomingCountdownPill}>
                                    <Text style={styles.incomingCountdownText}>{countdownLabel}</Text>
                                </View>
                            )}
                            <TouchableOpacity onPress={() => setDismissedIncomingId(incomingRequest.id)} hitSlop={8}>
                                <X size={16} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.incomingPriceRow}>
                            <Text style={styles.incomingPrice}>₹{incomingRequest.price}</Text>
                            <View style={styles.incomingPaymentPill}>
                                <Text style={styles.incomingPaymentPillText}>
                                    {incomingRequest.paymentMode === 'cod' ? t('driverHome.paymentCod') : incomingRequest.paymentMode === 'prepaid' ? t('driverHome.paymentUpi') : t('driverHome.paymentCredit')}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.incomingStatsRow}>
                            <View style={styles.incomingStat}>
                                <Text style={styles.incomingStatLabel}>{t('driverHome.totalRun')}</Text>
                                <Text style={styles.incomingStatValue}>{incomingRequest.distanceKm.toFixed(1)} km</Text>
                            </View>
                            <View style={styles.incomingStat}>
                                <Text style={styles.incomingStatLabel}>{t('driverHome.tripNet')}</Text>
                                <Text style={styles.incomingStatValue}>
                                    ₹{(incomingRequest.price / Math.max(incomingRequest.distanceKm, 0.1)).toFixed(1)}/km
                                </Text>
                            </View>
                        </View>

                        <View style={styles.incomingSenderRow}>
                            <View style={styles.incomingSenderAvatar}>
                                <Text style={styles.incomingSenderInitials}>
                                    {(incomingRequest.sender?.name ?? '?').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
                                </Text>
                            </View>
                            <Text style={styles.incomingSenderName} numberOfLines={1}>
                                {incomingRequest.sender?.name ?? t('driverHome.customerFallback')}
                            </Text>
                        </View>

                        <View style={styles.incomingVehicleRow}>
                            <VehicleVisual
                                vehicle={vehicleForType(incomingRequest.vehicleType)}
                                size={28}
                                iconSize={14}
                                borderRadius={8}
                                backgroundColor="#FFF1E8"
                                iconColor="#FF7518"
                            />
                            {incomingRequest.category === 'HOUSE_SHIFTING' ? (
                                
                                
                                
                                <Text style={styles.incomingVehicleText}>
                                    {t('driverHome.helpersNeeded', { vehicle: incomingRequest.vehicleType, count: incomingRequest.helpersCount, plural: incomingRequest.helpersCount === 1 ? '' : 's' })}
                                </Text>
                            ) : (
                                <Text style={styles.incomingVehicleText}>
                                    {t('driverHome.upToKgVehicle', { vehicle: incomingRequest.vehicleType, weight: incomingRequest.package?.weight ?? incomingRequest.weightKg })}
                                </Text>
                            )}
                            <Text style={styles.incomingPackageText} numberOfLines={1}>
                                {incomingRequest.package?.category ?? incomingRequest.goodsType}
                            </Text>
                            {}
                            {incomingRequest.fragile && (
                                <View style={styles.incomingFragileBadge}>
                                    <ShieldAlert size={11} color="#B45309" />
                                    <Text style={styles.incomingFragileBadgeText}>{t('driverHome.fragileHandleWithCare')}</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.incomingRouteRow}>
                            <MapPin size={13} color="#16A34A" />
                            <Text style={styles.incomingRouteText} numberOfLines={1}>{incomingRequest.pickup.address}</Text>
                        </View>
                        <View style={styles.incomingRouteRow}>
                            <MapPin size={13} color="#FF7518" />
                            <Text style={styles.incomingRouteText} numberOfLines={1}>{incomingRequest.drop.address}</Text>
                        </View>

                        <View style={styles.incomingActionsRow}>
                            <TouchableOpacity
                                style={styles.declineBtn}
                                onPress={() => setDismissedIncomingId(incomingRequest.id)}
                            >
                                <Text style={styles.declineBtnText}>{t('driverHome.decline')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.acceptBtn}
                                onPress={handleAcceptIncoming}
                                disabled={acceptingIncoming}
                            >
                                <Text style={styles.acceptBtnText}>
                                    {acceptingIncoming ? t('driverHome.accepting') : t('driverHome.acceptLoad')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                )}

                {}
                <View style={styles.quickRow}>
                    <TouchableOpacity
                        style={[styles.quickCard, { backgroundColor: '#FEF3C7' }]}
                        onPress={() => (navigation as any).navigate('FuelStations')}
                    >
                        <View style={[styles.quickIconWrap, { backgroundColor: '#FDE68A' }]}>
                            <Fuel color="#B45309" size={18} />
                        </View>
                        <Text style={styles.quickCardTitle}>{t('driverHome.findFuelStations')}</Text>
                        <Text style={styles.quickCardSub}>{t('driverHome.nearbyPetrolBunks')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.quickCard, { backgroundColor: documentsVerified ? '#DCFCE7' : '#FEF3C7' }]}
                        onPress={() => (navigation as any).navigate('DriverDocuments')}
                    >
                        <View style={[styles.quickIconWrap, { backgroundColor: documentsVerified ? '#BBF7D0' : '#FDE68A' }]}>
                            <FileText color={documentsVerified ? '#16A34A' : '#B45309'} size={18} />
                        </View>
                        <Text style={styles.quickCardTitle}>{t('driverHome.myDocuments')}</Text>
                        <Text style={styles.quickCardSub}>
                            {documentsVerified ? t('driverHome.verified') : t('driverHome.uploadForAdminReview')}
                        </Text>
                    </TouchableOpacity>
                </View>

                {}
                <LinearGradient
                    colors={['#FF7518', '#E9600A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.driveMoreBanner}
                >
                    <View style={styles.driveMoreText}>
                        <Text style={styles.driveMoreTitle}>{t('driverHome.driveMoreEarnMore')}</Text>
                        <Text style={styles.driveMoreSub}>{t('driverHome.driveMoreSubtext')}</Text>
                    </View>
                    <Image source={DRIVE_MORE_TRUCK} resizeMode="contain" style={styles.driveMoreImage} />
                </LinearGradient>

                {}
                <Animated.View style={contentAnimStyle}>
                    <View style={styles.ordersSection}>
                        <View style={styles.sectionHeader}>
                            <View>
                                <Text style={styles.sectionTitle}>
                                    {t('driverHome.nearbyOrders')}
                                </Text>
                                <Text style={styles.subtitle}>
                                    {t('driverHome.availableRealtimeUpdates', { count: remainingShipments.length })}
                                </Text>
                            </View>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{remainingShipments.length}</Text>
                            </View>
                        </View>

                        {remainingShipments.length === 0 ? (
                            <Animated.View
                                entering={FadeIn.delay(300)}
                                style={styles.emptyState}
                            >
                                <View style={styles.emptyIconPanel}>
                                    <View style={styles.emptyIconRing}>
                                        <Radar size={34} color="#FF7518" />
                                    </View>
                                    <View style={styles.emptyPulseDot} />
                                </View>
                                <Text style={styles.emptyTitle}>{t('driverHome.noOrdersNearby')}</Text>
                                <Text style={styles.emptyMessage}>
                                    {t('driverHome.checkBackSoon')}
                                </Text>
                                <TouchableOpacity style={styles.emptyRefreshButton} onPress={onRefresh}>
                                    <RefreshCw size={15} color="#FF7518" />
                                    <Text style={styles.emptyRefreshText}>{t('common.retry')}</Text>
                                </TouchableOpacity>
                            </Animated.View>
                        ) : (
                            <LogisticsCardList
                                data={remainingShipments}
                                scrollEnabled={false}
                            />
                        )}
                    </View>
                </Animated.View>

                {}
                {shipments.length > 0 && (
                    <Animated.View
                        entering={SlideInDown.delay(400)}
                        style={styles.statsFooterWrap}
                    >
                        <LinearGradient
                            colors={['#FF7518', '#E9600A']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.statsFooter}
                        >
                            <View style={styles.statItem}>
                                <Package color="#fff" size={24} style={styles.statEmoji} />
                                <Text style={styles.statNumber}>{shipments.length}</Text>
                                <Text style={styles.statLabel}>{t('driverHome.statAvailable')}</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <CheckCircle2 color="#fff" size={24} style={styles.statEmoji} />
                                <Text style={styles.statNumber}>{deliveredToday}</Text>
                                <Text style={styles.statLabel}>{t('driverHome.statDelivered')}</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Wallet color="#fff" size={24} style={styles.statEmoji} />
                                <Text style={styles.statNumber}>₹{todayEarnings.toLocaleString()}</Text>
                                <Text style={styles.statLabel}>{t('driverHome.statEarnings')}</Text>
                            </View>
                        </LinearGradient>
                    </Animated.View>
                )}
                </ScrollView>
            </View>
        </>
    );
};

export default HomeScreen;


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    scrollContent: {
        flexGrow: 1,
    },

    
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
    },
    loadingContent: {
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#1F2937',
        fontFamily: FONTS.SEMI_BOLD_PRIMARY,
    },
    loadingSubtext: {
        fontSize: 13,
        color: '#9CA3AF',
    },

    
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
    },
    errorContent: {
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    errorIcon: {
        marginBottom: 16,
    },
    errorTitle: {
        fontSize: 20,
        fontFamily: FONTS.BOLD_PRIMARY,
        color: '#DC2626',
        marginBottom: 8,
        textAlign: 'center',
    },
    errorMessage: {
        fontSize: 14,
        color: '#7F1D1D',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#DC2626',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    retryText: {
        color: '#FFF',
        fontSize: 15,
        fontFamily: FONTS.SEMI_BOLD_PRIMARY,
    },

    
    header: {
        marginBottom: 0,
    },

    
    sosBtn: {
        position: 'absolute',
        top: 14,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#DC2626',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    sosBtnText: { color: '#fff', fontSize: 11, fontFamily: FONTS.BOLD_PRIMARY },

    activeDeliveryCard: {
        marginHorizontal: 16,
        marginTop: 12,
        backgroundColor: '#FFF',
        borderRadius: 14,
        padding: 14,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
    },
    activeDeliveryRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    activeDeliveryIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFE8D6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeDeliveryContent: { flex: 1 },
    activeDeliveryTitle: { fontSize: 13, fontFamily: FONTS.BOLD_PRIMARY, color: '#111827' },
    activeDeliverySub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    chatPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FF7518',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
    },
    chatPillText: { color: '#fff', fontSize: 12, fontFamily: FONTS.BOLD_PRIMARY },
    deliveryFlowWrap: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 14,
        paddingVertical: 12,
        paddingHorizontal: 10,
        backgroundColor: '#FFF7ED',
        borderRadius: 12,
    },
    deliveryFlowStep: {
        width: 64,
        alignItems: 'center',
        gap: 5,
    },
    deliveryFlowDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#FED7AA',
    },
    deliveryFlowDotActive: {
        borderColor: '#FF7518',
        backgroundColor: '#FFFFFF',
    },
    deliveryFlowDotDone: {
        backgroundColor: '#22C55E',
        borderColor: '#22C55E',
    },
    deliveryFlowDotText: {
        fontSize: 11,
        fontFamily: FONTS.BOLD_PRIMARY,
        color: '#9CA3AF',
    },
    deliveryFlowLabel: {
        fontSize: 9.5,
        fontFamily: FONTS.SEMI_BOLD_PRIMARY,
        color: '#9CA3AF',
        textAlign: 'center',
    },
    deliveryFlowLabelActive: {
        color: '#FF7518',
    },
    deliveryFlowLabelDone: {
        color: '#15803D',
    },
    deliveryFlowLine: {
        flex: 1,
        height: 2,
        backgroundColor: '#FED7AA',
        marginTop: 11,
        marginHorizontal: -12,
    },
    deliveryFlowLineDone: {
        backgroundColor: '#22C55E',
    },
    embeddedMapWrap: { marginTop: 10 },
    openMapsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    openMapsText: { fontSize: 12, fontFamily: FONTS.BOLD_PRIMARY, color: '#FF7518' },
    arrivalStatusText: { fontSize: 11, fontFamily: FONTS.SEMI_BOLD_PRIMARY, color: '#FF7518', marginTop: 4 },
    deliveryInstructionsText: { fontSize: 11, color: '#6B7280', marginTop: 2 },
    arrivalCtaBtn: {
        marginTop: 10,
        backgroundColor: '#FF7518',
        borderRadius: 10,
        paddingVertical: 11,
        alignItems: 'center',
    },
    arrivalCtaText: { color: '#fff', fontSize: 13, fontFamily: FONTS.BOLD_PRIMARY },
    stopsListWrap: { marginTop: 10, gap: 8 },
    stopListRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    stopListSeq: {
        width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFF1E8',
        color: '#FF7518', fontSize: 11, fontFamily: FONTS.BOLD_PRIMARY,
        textAlign: 'center', textAlignVertical: 'center', lineHeight: 20,
    },
    stopListSeqDone: { backgroundColor: '#DCFCE7', color: '#16A34A' },
    stopListAddress: { flex: 1, fontSize: 12, color: '#333' },
    stopCompleteBtn: { backgroundColor: '#FF7518', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10 },
    stopCompleteBtnText: { color: '#fff', fontSize: 11, fontFamily: FONTS.BOLD_PRIMARY },
    devSimulateBtn: {
        marginTop: 8,
        borderRadius: 10,
        paddingVertical: 9,
        alignItems: 'center',
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#9CA3AF',
    },
    devSimulateText: { color: '#6B7280', fontSize: 11, fontFamily: FONTS.SEMI_BOLD_PRIMARY },

    
    incomingCard: {
        marginHorizontal: 16,
        marginTop: 12,
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1.5,
        borderColor: '#FF7518',
        elevation: 3,
        shadowColor: '#FF7518',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
    },
    incomingHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    incomingHeaderText: { fontSize: 11, fontFamily: FONTS.BOLD_PRIMARY, color: '#FF7518', letterSpacing: 0.5, flex: 1 },
    incomingCountdownPill: { backgroundColor: '#FFF1E6', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginRight: 8 },
    incomingCountdownText: { fontSize: 11, fontFamily: FONTS.BOLD_PRIMARY, color: '#FF7518', letterSpacing: 0.5 },
    incomingPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    incomingPrice: { fontSize: 26, fontFamily: FONTS.BOLD_PRIMARY, color: '#111827' },
    incomingPaymentPill: { backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    incomingPaymentPillText: { fontSize: 11, fontFamily: FONTS.BOLD_PRIMARY, color: '#6B7280' },
    incomingStatsRow: { flexDirection: 'row', gap: 20, marginBottom: 12 },
    incomingStat: {},
    incomingStatLabel: { fontSize: 10, color: '#9CA3AF', letterSpacing: 0.3 },
    incomingStatValue: { fontSize: 14, fontFamily: FONTS.BOLD_PRIMARY, color: '#111827', marginTop: 2 },
    incomingSenderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    incomingSenderAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#FFE8D6', alignItems: 'center', justifyContent: 'center' },
    incomingSenderInitials: { fontSize: 11, fontFamily: FONTS.BOLD_PRIMARY, color: '#FF7518' },
    incomingSenderName: { fontSize: 13, fontFamily: FONTS.BOLD_PRIMARY, color: '#111827', flex: 1 },
    incomingVehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
    incomingVehicleText: { fontSize: 12, color: '#374151', fontFamily: FONTS.SEMI_BOLD_PRIMARY, textTransform: 'capitalize' },
    incomingPackageText: { fontSize: 12, color: '#6B7280' },
    incomingFragileBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#FEF3C7', borderRadius: 8,
        paddingHorizontal: 8, paddingVertical: 4, marginTop: 6, alignSelf: 'flex-start',
    },
    incomingFragileBadgeText: { fontSize: 11, color: '#B45309', fontFamily: FONTS.SEMI_BOLD_PRIMARY },
    incomingInsuredPill: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#F0FDF4', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
    incomingInsuredText: { fontSize: 10, fontFamily: FONTS.BOLD_PRIMARY, color: '#16A34A' },
    incomingRouteRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    incomingRouteText: { flex: 1, fontSize: 12, color: '#374151' },
    incomingActionsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
    declineBtn: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    declineBtnText: { fontSize: 13, fontFamily: FONTS.BOLD_PRIMARY, color: '#6B7280' },
    acceptBtn: {
        flex: 2,
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#FF7518',
    },
    acceptBtnText: { fontSize: 13, fontFamily: FONTS.BOLD_PRIMARY, color: '#fff' },

    quickRow: {
        flexDirection: 'row',
        gap: 10,
        marginHorizontal: 16,
        marginTop: 12,
    },
    quickCard: {
        flex: 1,
        borderRadius: 14,
        padding: 14,
    },
    quickIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    quickCardTitle: { fontSize: 13, fontFamily: FONTS.BOLD_PRIMARY, color: '#111827' },
    quickCardSub: { fontSize: 11, fontFamily: FONTS.MEDIUM_PRIMARY, color: '#57534E', marginTop: 3, lineHeight: 15 },

    
    
    
    driveMoreBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: 16,
        padding: 18,
        overflow: 'hidden',
    },
    driveMoreText: { flex: 1, paddingRight: 10 },
    driveMoreTitle: { fontSize: 17, fontFamily: FONTS.BOLD_PRIMARY, color: '#fff', lineHeight: 22 },
    driveMoreSub: { fontSize: 12, fontFamily: FONTS.MEDIUM_PRIMARY, color: 'rgba(255,255,255,0.9)', marginTop: 6, lineHeight: 16 },
    driveMoreImage: { width: 110, height: 90 },

    
    ordersSection: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 22,
        fontFamily: FONTS.BOLD_PRIMARY,
        color: '#1C1C1E',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#8E8E93',
        fontFamily: FONTS.MEDIUM_PRIMARY,
    },
    badge: {
        backgroundColor: '#FF7518',
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 12,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 14,
        fontFamily: FONTS.BOLD_PRIMARY,
    },

    
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 44,
        paddingHorizontal: 22,
        backgroundColor: '#FFF',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    emptyIconPanel: {
        width: 96,
        height: 96,
        borderRadius: 24,
        backgroundColor: '#FFF7ED',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 18,
        position: 'relative',
    },
    emptyIconRing: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 1,
        borderColor: '#FED7AA',
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyPulseDot: {
        position: 'absolute',
        top: 20,
        right: 22,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#22C55E',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    emptyTitle: {
        fontSize: 18,
        fontFamily: FONTS.BOLD_PRIMARY,
        color: '#1C1C1E',
        marginBottom: 8,
    },
    emptyMessage: {
        fontSize: 14,
        color: '#8E8E93',
        textAlign: 'center',
        maxWidth: 240,
    },
    emptyRefreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 18,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#FFF1E8',
    },
    emptyRefreshText: {
        fontSize: 13,
        fontFamily: FONTS.BOLD_PRIMARY,
        color: '#FF7518',
    },

    
    statsFooterWrap: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    statsFooter: {
        flexDirection: 'row',
        backgroundColor: '#FF7518',
        paddingVertical: 18,
        paddingHorizontal: 16,
        borderRadius: 20,
        elevation: 5,
        shadowColor: '#FF7518',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statEmoji: {
        fontSize: 24,
        marginBottom: 4,
    },
    statNumber: {
        fontSize: 18,
        fontFamily: FONTS.BOLD_PRIMARY,
        color: '#FFF',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        fontFamily: FONTS.SEMI_BOLD_PRIMARY,
        letterSpacing: 0.5,
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginHorizontal: 8,
    },
});
