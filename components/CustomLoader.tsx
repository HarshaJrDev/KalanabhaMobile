// CustomLoader.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, ActivityIndicator, Animated } from 'react-native';

interface Props {
    visible: boolean;
    message?: string;
}

export const CustomLoader = ({ visible, message = 'Loading...' }: Props) => {
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
                        <ActivityIndicator size="large" color="#007AFF" />
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

const styles = StyleSheet.create({
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
        borderColor: 'rgba(0, 122, 255, 0.3)',
        borderTopColor: '#007AFF',
        position: 'absolute',
    },
    spinner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#007AFF',
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
        backgroundColor: '#007AFF',
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
        fontWeight: '600',
        marginTop: 24,
        textAlign: 'center',
    },
});