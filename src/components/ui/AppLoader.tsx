// AppLoader.tsx — canonical full-screen loading overlay. Extracted verbatim
// from CustomLoader.tsx (single source of truth for this pattern).
import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, ActivityIndicator, Animated } from 'react-native';
import { useAppTheme } from '@theme/ThemeContext';
import FONTS from '@utils/fonts';

export interface AppLoaderProps {
    visible: boolean;
    message?: string;
}

export const AppLoader = ({ visible, message = 'Loading...' }: AppLoaderProps) => {
    const { colors } = useAppTheme();
    const styles = useMemo(() => makeStyles(colors.PRIMARY), [colors.PRIMARY]);
    const scaleValue = new Animated.Value(0);
    const rotateValue = new Animated.Value(0);
    const fadeAnim = new Animated.Value(0);

    useEffect(() => {
        if (visible) {
            // Enter animation
            Animated.parallel([
                Animated.spring(scaleValue, {
                    toValue: 1,
                    tension: 100,
                    friction: 8,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();

            // Continuous spinner rotation
            Animated.loop(
                Animated.timing(rotateValue, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                })
            ).start();
        } else {
            // Exit animation
            Animated.parallel([
                Animated.spring(scaleValue, {
                    toValue: 0,
                    tension: 100,
                    friction: 8,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    const rotate = rotateValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <Animated.View
                    style={[
                        styles.container,
                        {
                            transform: [{ scale: scaleValue }, { rotate }],
                            opacity: fadeAnim,
                        },
                    ]}
                >
                    {/* Outer ring */}
                    <View style={styles.outerRing} />

                    {/* Inner spinner */}
                    <Animated.View style={[styles.spinner, { transform: [{ rotate }] }]}>
                        <ActivityIndicator size="large" color={colors.PRIMARY} />
                    </Animated.View>

                    {/* Dots */}
                    <View style={styles.dots}>
                        <View style={[styles.dot, styles.dot1]} />
                        <View style={[styles.dot, styles.dot2]} />
                        <View style={[styles.dot, styles.dot3]} />
                    </View>
                </Animated.View>

                <Animated.View style={{ opacity: fadeAnim }}>
                    <Text style={styles.message}>{message}</Text>
                </Animated.View>
            </View>
        </Modal>
    );
};

// Rebranded from a hardcoded iOS-blue (#007AFF) spinner to the app's own
// brand orange (§4/§7) — computed per-render from useAppTheme() so it also
// tracks a future primary-color change (e.g. dark mode) automatically.
const makeStyles = (primary: string) =>
    StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        container: {
            width: 100,
            height: 100,
            justifyContent: 'center',
            alignItems: 'center',
        },
        outerRing: {
            width: 100,
            height: 100,
            borderRadius: 50,
            borderWidth: 4,
            borderColor: `${primary}4D`,
            borderTopColor: primary,
            position: 'absolute',
        },
        spinner: {
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 8,
            elevation: 10,
        },
        dots: {
            position: 'absolute',
            width: 100,
            height: 100,
            justifyContent: 'center',
            alignItems: 'center',
        },
        dot: {
            position: 'absolute',
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: primary,
        },
        dot1: {
            top: 10,
        },
        dot2: {
            right: 10,
        },
        dot3: {
            bottom: 10,
        },
        message: {
            color: 'white',
            fontSize: 16,
            fontFamily: FONTS.SEMI_BOLD_PRIMARY,
            marginTop: 24,
            textAlign: 'center',
        },
    });

export default AppLoader;