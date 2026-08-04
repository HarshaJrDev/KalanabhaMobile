import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    StyleSheet,
    View,
    Text,
    RefreshControl,
    ActivityIndicator,
    StatusBar,
    Dimensions,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Animated, {
    FadeIn,
    FadeOut,
    SlideInDown,
    Layout,
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { DriverHeader } from '../../../components/DriverHeader';
import { LogisticsCardList, LogisticsItem } from '../../../components/LogisticsCardList';
import { AlertCircle, RefreshCw } from 'lucide-react-native';
import { parseFirestoreDate } from '../../../utils/firestoreDate';

import { registerFCMToken, setupFCMListeners } from '../../../utils/cm';
import { safeNumber } from '../../../utils/parsers';
import { useDriverLiveLocation } from '../../../src/location/useDriverLiveLocation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HomeScreenProps { }

const HomeScreen: React.FC<HomeScreenProps> = () => {
    // ━━━━━ States
    const [shipments, setShipments] = useState<LogisticsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [todayEarnings, setTodayEarnings] = useState(0);
    const [deliveredToday, setDeliveredToday] = useState(0);
    const [user, setUser] = useState<any>(null);
    const [isOnline, setIsOnline] = useState(true);

    // ━━━━━ Animations
    const headerScale = useSharedValue(0.95);
    const contentOpacity = useSharedValue(0);

    useEffect(() => {
        headerScale.value = withSpring(1, { damping: 12, mass: 1 });
        contentOpacity.value = withSpring(1, { damping: 10, mass: 1 });
    }, []);




    // Rapido-style live tracking: only pings location while this driver has
    // a shipment actively accepted/in_transit — not just because they're
    // online, to avoid draining battery for idle drivers browsing orders.
    const hasActiveDelivery = useMemo(
        () =>
            shipments.some(
                s => s.driverId === user?.uid && (s.status === 'accepted' || s.status === 'in_transit')
            ),
        [shipments, user]
    );
    useDriverLiveLocation(hasActiveDelivery);

    // Register driver FCM token on mount
    useEffect(() => {
        registerFCMToken('driver');
        const unsub = setupFCMListeners((title, body, data) => {
            // Show in-app alert for new orders
            Alert.alert(title, body, [
                { text: 'View', onPress: () => console.log('Navigate to order:', data.shipmentId) },
                { text: 'Dismiss' },
            ]);
        });
        return () => unsub();
    }, []);
    // ━━━━━ Firebase Real-time Subscription
    useEffect(() => {
        const currentUser = auth().currentUser;

        if (!currentUser) {
            setLoading(false);
            setError('Not authenticated');
            return;
        }

        setUser(currentUser);
        setError(null);

        try {
            const q = firestore()
                .collection('shipments')
                .where('status', 'in', ['searching', 'accepted', 'in_transit'])
                .orderBy('createdAt', 'desc')
                .limit(50);
            const unsubscribeShipments = q.onSnapshot(
                (snapshot) => {
                    if (!snapshot?.docs) {
                        setShipments([]);
                        setLoading(false);
                        return;
                    }

                    const data: LogisticsItem[] = [];
                    let earnings = 0;
                    let deliveredCount = 0;

                    snapshot.docs.forEach((doc) => {
                        try {
                            const shipmentData = doc.data();

                            if (!shipmentData || typeof shipmentData !== 'object') {
                                return;
                            }

                            const shipment: LogisticsItem = {
                                id: doc.id,

                                goodsType:
                                    shipmentData.goodsType ??
                                    shipmentData.package?.type ??
                                    'Unknown',

                                weightKg: safeNumber(
                                    shipmentData.package?.weight ?? shipmentData.weightKg
                                ),

                                pickup: shipmentData.pickup ?? {
                                    address:
                                        shipmentData.sender?.address ??
                                        shipmentData.from ??
                                        'Unknown',
                                    lat: safeNumber(shipmentData.sender?.lat),
                                    lng: safeNumber(shipmentData.sender?.lng),
                                },

                                drop: shipmentData.drop ?? {
                                    address:
                                        shipmentData.receiver?.address ??
                                        shipmentData.to ??
                                        'Unknown',
                                    lat: safeNumber(shipmentData.receiver?.lat),
                                    lng: safeNumber(shipmentData.receiver?.lng),
                                },

                                price: safeNumber(shipmentData.price),
                                distanceKm: safeNumber(shipmentData.distanceKm),

                                status: shipmentData.status ?? 'pending',

                                createdAt:
                                    parseFirestoreDate(shipmentData.createdAt) ??
                                    new Date().toISOString(),

                                expiresAt: parseFirestoreDate(shipmentData.expiresAt),

                                etaMinutes: safeNumber(
                                    shipmentData.etaMinutes,
                                    Math.random() * 45 + 10
                                ),

                                driverName:
                                    shipmentData.dispatch?.driverName ?? 'Unassigned',

                                driverId: shipmentData.dispatch?.driverId,
                                driverRating: safeNumber(
                                    shipmentData.dispatch?.driverRating,
                                    4.8
                                ),
                                driverPhone: shipmentData.dispatch?.driverPhone,

                                customerName:
                                    shipmentData.sender?.name ??
                                    shipmentData.userMeta?.displayName ??
                                    'Customer',

                                customerPhone:
                                    shipmentData.sender?.phone ??
                                    shipmentData.userMeta?.phoneNumber,
                            };

                            data.push(shipment);

                            if (
                                shipmentData.dispatch?.driverId ===
                                currentUser.uid
                            ) {
                                earnings += shipmentData.price ?? 0;

                                if (shipment.status === 'delivered') {
                                    deliveredCount++;
                                }
                            }
                        } catch (docError) {
                            console.error(
                                '[HomeScreen] Error processing document:',
                                docError
                            );
                        }
                    });

                    setShipments(data);
                    setTodayEarnings(earnings);
                    setDeliveredToday(deliveredCount);
                    setLoading(false);
                    setError(null);
                },
                (error) => {
                    console.error('[HomeScreen] Firestore error:', error);
                    setError(error?.message || 'Failed to load shipments');
                    setLoading(false);
                    setShipments([]);
                }
            );

            return () => unsubscribeShipments();
        } catch (err) {
            console.error('[HomeScreen] Setup error:', err);
            setError('Failed to initialize');
            setLoading(false);
        }
    }, []);

    // ━━━━━ Pull to Refresh
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        // Simulate refresh delay
        setTimeout(() => setRefreshing(false), 1200);
    }, []);

    // ━━━━━ Retry handler
    const onRetry = useCallback(() => {
        setError(null);
        setLoading(true);
        // This will re-trigger the useEffect
        window.location.reload?.();
    }, []);

    // ━━━━━ Animated styles
    const headerAnimStyle = useAnimatedStyle(() => ({
        transform: [{ scale: headerScale.value }],
    }));

    const contentAnimStyle = useAnimatedStyle(() => ({
        opacity: contentOpacity.value,
    }));

    // ━━━━━ Loading State
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
                <Animated.View entering={FadeIn} style={styles.loadingContent}>
                    <ActivityIndicator size="large" color="#2563EB" />
                    <Text style={styles.loadingText}>Loading your orders...</Text>
                    <Text style={styles.loadingSubtext}>Syncing with Firestore</Text>
                </Animated.View>
            </View>
        );
    }

    // ━━━━━ Error State
    if (error && shipments.length === 0) {
        return (
            <View style={styles.errorContainer}>
                <StatusBar barStyle="dark-content" backgroundColor="#FEF2F2" />
                <Animated.View entering={FadeIn} style={styles.errorContent}>
                    <View style={styles.errorIcon}>
                        <AlertCircle size={48} color="#EF4444" />
                    </View>
                    <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
                    <Text style={styles.errorMessage}>{error}</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={onRetry}
                    // entering={SlideInDown.delay(200)}
                    >
                        <RefreshCw size={18} color="#FFF" />
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        );
    }

    return (
        <>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
            <View style={styles.container}>
                {/* 🚚 Driver Header */}
                <Animated.View style={[headerAnimStyle, { width: '100%' }]}>
                    <DriverHeader
                        earnings={todayEarnings}
                        deliveredToday={deliveredToday}
                        isOnline={isOnline}
                        style={styles.header}
                    />
                </Animated.View>

                {/* 📦 Orders Section */}
                <Animated.View style={[{ flex: 1 }, contentAnimStyle]}>
                    <View style={styles.ordersSection}>
                        <View style={styles.sectionHeader}>
                            <View>
                                <Text style={styles.sectionTitle}>
                                    📦 Nearby Orders
                                </Text>
                                <Text style={styles.subtitle}>
                                    {shipments.length} available • Real-time updates
                                </Text>
                            </View>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{shipments.length}</Text>
                            </View>
                        </View>

                        {shipments.length === 0 ? (
                            <Animated.View
                                entering={FadeIn.delay(300)}
                                style={styles.emptyState}
                            >
                                <Text style={styles.emptyEmoji}>📭</Text>
                                <Text style={styles.emptyTitle}>No orders nearby</Text>
                                <Text style={styles.emptyMessage}>
                                    Check back soon for new deliveries in your area
                                </Text>
                            </Animated.View>
                        ) : (
                            <LogisticsCardList
                                data={shipments}
                                refreshControl={
                                    <RefreshControl
                                        refreshing={refreshing}
                                        onRefresh={onRefresh}
                                        colors={['#2563EB']}
                                        tintColor="#2563EB"
                                        progressBackgroundColor="#F0F0F0"
                                    />
                                }
                            />
                        )}
                    </View>
                </Animated.View>

                {/* 📊 Live Stats Footer */}
                {shipments.length > 0 && (
                    <Animated.View
                        entering={SlideInDown.delay(400)}
                        style={styles.statsFooterWrap}
                    >
                        <LinearGradient
                            colors={['#2563EB', '#1E40AF']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.statsFooter}
                        >
                            <View style={styles.statItem}>
                                <Text style={styles.statEmoji}>📦</Text>
                                <Text style={styles.statNumber}>{shipments.length}</Text>
                                <Text style={styles.statLabel}>Available</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statEmoji}>✅</Text>
                                <Text style={styles.statNumber}>{deliveredToday}</Text>
                                <Text style={styles.statLabel}>Delivered</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statEmoji}>💰</Text>
                                <Text style={styles.statNumber}>₹{todayEarnings.toLocaleString()}</Text>
                                <Text style={styles.statLabel}>Earnings</Text>
                            </View>
                        </LinearGradient>
                    </Animated.View>
                )}
            </View>
        </>
    );
};

export default HomeScreen;

// ━━━━━ STYLES
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },

    // Loading States
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
        fontWeight: '600',
    },
    loadingSubtext: {
        fontSize: 13,
        color: '#9CA3AF',
    },

    // Error States
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
        fontWeight: '700',
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
        fontWeight: '600',
    },

    // Header
    header: {
        marginBottom: 0,
    },

    // Orders Section
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
        fontWeight: '800',
        color: '#1C1C1E',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#8E8E93',
        fontWeight: '500',
    },
    badge: {
        backgroundColor: '#2563EB',
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 12,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
    },

    // Empty State
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyEmoji: {
        fontSize: 56,
        marginBottom: 12,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1C1C1E',
        marginBottom: 8,
    },
    emptyMessage: {
        fontSize: 14,
        color: '#8E8E93',
        textAlign: 'center',
        maxWidth: 240,
    },

    // Stats Footer
    statsFooterWrap: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    statsFooter: {
        flexDirection: 'row',
        backgroundColor: '#2563EB',
        paddingVertical: 18,
        paddingHorizontal: 16,
        borderRadius: 20,
        elevation: 5,
        shadowColor: '#2563EB',
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
        fontWeight: '900',
        color: '#FFF',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginHorizontal: 8,
    },
});