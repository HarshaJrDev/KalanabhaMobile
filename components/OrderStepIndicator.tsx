import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import StepIndicator from 'react-native-step-indicator';
import LinearGradient from 'react-native-linear-gradient';



// Firebase
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { RF, W } from '../utils/responsive';
import COLOR from '../utils/color';
import FONTS from '../utils/fonts';
import Sender from '../Screens/addOrder/sender';
import Package from '../Screens/addOrder/Package';
import OrderDetails from '../Screens/addOrder/OrderDetails';
import Reciver from '../Screens/addOrder/Receiver';

const LABELS = ['Sender', 'Receiver', 'Package', 'Order Details'];

const STEP_ICONS = ['📤', '📥', '📦', '📋'];

const STEP_DESCRIPTIONS = [
    "Enter sender's details",
    "Enter receiver's details",
    'Add package info',
    'Review your order',
];

const CUSTOM_STYLES = {
    stepIndicatorSize: W(28),
    currentStepIndicatorSize: W(34),
    separatorStrokeWidth: W(2),
    currentStepStrokeWidth: W(3),
    stepStrokeCurrentColor: COLOR.PRIMARY,
    stepStrokeWidth: W(2.5),
    stepStrokeFinishedColor: COLOR.PRIMARY,
    stepStrokeUnFinishedColor: '#D1D5DB',
    separatorFinishedColor: COLOR.PRIMARY,
    separatorUnFinishedColor: '#D1D5DB',
    stepIndicatorFinishedColor: COLOR.PRIMARY,
    stepIndicatorUnFinishedColor: '#ffffff',
    stepIndicatorCurrentColor: '#ffffff',
    stepIndicatorLabelFontSize: RF(12),
    currentStepIndicatorLabelFontSize: RF(13),
    stepIndicatorLabelCurrentColor: COLOR.PRIMARY,
    stepIndicatorLabelFinishedColor: '#ffffff',
    stepIndicatorLabelUnFinishedColor: '#9CA3AF',
    labelColor: '#9CA3AF',
    labelSize: RF(11),
    currentStepLabelColor: COLOR.PRIMARY,
    labelAlign: 'center' as const,
    labelFontFamily: FONTS.MEDIUM_PRIMARY,
};

// Order data aggregator - collect data across steps
type OrderData = {
    sender?: any;
    receiver?: any;
    package?: any;
    orderDetails?: any;
};

const OrderStepIndicator = () => {
    const [currentPosition, setCurrentPosition] = useState(0);
    const [orderData, setOrderData] = useState<OrderData>({});
    const [submitting, setSubmitting] = useState(false);

    const slideAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    const animateStep = useCallback((nextPosition: number, direction: 'forward' | 'back') => {
        const slideOut = direction === 'forward' ? -W(30) : W(30);
        const slideIn = direction === 'forward' ? W(30) : -W(30);

        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: slideOut, duration: 150, useNativeDriver: true }),
        ]).start(() => {
            setCurrentPosition(nextPosition);
            slideAnim.setValue(slideIn);
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
                Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 9, useNativeDriver: true }),
            ]).start();
        });

        // Progress bar animation
        Animated.timing(progressAnim, {
            toValue: nextPosition / (LABELS.length - 1),
            duration: 350,
            useNativeDriver: false,
        }).start();
    }, [fadeAnim, slideAnim, progressAnim]);

    const goToNext = useCallback((stepData?: any) => {
        if (currentPosition < LABELS.length - 1) {
            // Save step data
            const stepKeys: (keyof OrderData)[] = ['sender', 'receiver', 'package', 'orderDetails'];
            if (stepData) {
                setOrderData(prev => ({ ...prev, [stepKeys[currentPosition]]: stepData }));
            }
            animateStep(currentPosition + 1, 'forward');
        }
    }, [currentPosition, animateStep]);

    const goToPrevious = useCallback(() => {
        if (currentPosition > 0) {
            animateStep(currentPosition - 1, 'back');
        }
    }, [currentPosition, animateStep]);

    const handleStepPress = useCallback((position: number) => {
        if (position < currentPosition) {
            animateStep(position, 'back');
        }
    }, [currentPosition, animateStep]);

    const submitOrder = useCallback(async (finalData?: any) => {
        try {
            setSubmitting(true);
            const user = auth().currentUser;
            if (!user) throw new Error('Not authenticated');

            const completeOrder = {
                ...orderData,
                orderDetails: finalData || orderData.orderDetails,
                userId: user.uid,
                status: 'pending',
                createdAt: firestore.FieldValue.serverTimestamp(),
                trackingId: `KL${Date.now()}`,
                updatedAt: firestore.FieldValue.serverTimestamp(),
            };

            const docRef = await firestore().collection('shipments').add(completeOrder);
            console.log('Order created with ID:', docRef.id);

            // You can navigate to order confirmation here
            // navigation.navigate('OrderConfirmation', { orderId: docRef.id });
        } catch (err) {
            console.error('Order submission failed:', err);
        } finally {
            setSubmitting(false);
        }
    }, [orderData]);

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    const renderStepContent = () => {
        switch (currentPosition) {
            case 0: return <Sender onNext={goToNext} />;
            case 1: return <Reciver onNext={goToNext} onBack={goToPrevious} />;
            case 2: return <Package onNext={goToNext} onBack={goToPrevious} />;
            case 3: return (
                <OrderDetails
                    onBack={goToPrevious}
                    onSubmit={submitOrder}
                    submitting={submitting}
                />
            );
            default: return null;
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLOR.PRIMARY} />

            {/* Header */}
            <LinearGradient
                colors={[COLOR.PRIMARY, '#1e3a8a']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <Text style={styles.headerTitle}>New Order</Text>
                <Text style={styles.headerSubtitle}>
                    Step {currentPosition + 1} of {LABELS.length}: {STEP_DESCRIPTIONS[currentPosition]}
                </Text>

                {/* Linear Progress */}
                <View style={styles.progressTrack}>
                    <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
                </View>
            </LinearGradient>

            {/* Step Indicator Card */}
            <View style={styles.indicatorCard}>
                <StepIndicator
                    customStyles={CUSTOM_STYLES}
                    currentPosition={currentPosition}
                    labels={LABELS}
                    stepCount={LABELS.length}
                    direction="horizontal"
                    onPress={handleStepPress}
                    renderStepIndicator={({ position, stepStatus }) => (
                        <Text style={{
                            fontSize: stepStatus === 'current' ? RF(15) : RF(12),
                            opacity: stepStatus === 'unfinished' ? 0.4 : 1,
                        }}>
                            {stepStatus === 'finished' ? '✓' : STEP_ICONS[position]}
                        </Text>
                    )}
                />
            </View>

            {/* Step Content with animation */}
            <Animated.View
                style={[
                    styles.contentContainer,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateX: slideAnim }],
                    },
                ]}
            >
                {renderStepContent()}
            </Animated.View>
        </View>
    );
};

export default OrderStepIndicator;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F4FF',
    },
    header: {
        paddingHorizontal: S(20),
        paddingTop: H(50),
        paddingBottom: H(20),
        borderBottomLeftRadius: W(20),
        borderBottomRightRadius: W(20),
    },
    headerTitle: {
        color: '#fff',
        fontSize: RF(22),
        fontFamily: FONTS.BOLD_PRIMARY,
        letterSpacing: 0.5,
    },
    headerSubtitle: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: RF(13),
        fontFamily: FONTS.PRIMARY,
        marginTop: H(4),
        marginBottom: H(16),
    },
    progressTrack: {
        height: H(4),
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#fff',
        borderRadius: 2,
    },
    indicatorCard: {
        backgroundColor: '#fff',
        marginHorizontal: S(16),
        marginTop: H(-10),
        borderRadius: W(16),
        paddingVertical: H(16),
        paddingHorizontal: S(8),
        shadowColor: '#1e3a8a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    contentContainer: {
        flex: 1,
        marginHorizontal: S(16),
        marginTop: H(16),
    },
});