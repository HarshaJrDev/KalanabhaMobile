import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    Dimensions,
    ImageBackground,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    interpolate,
    runOnJS,
} from 'react-native-reanimated';
import { Package, Truck, Map, Link2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

const { width } = Dimensions.get('window');

type Nav = NativeStackNavigationProp<RootStackParamList, 'Splash'>;


const SEQUENCE = [
    { label: 'Kalanabha', sub: 'Welcome', icon: Package },
    { label: 'Logistics', sub: 'Smart Delivery', icon: Truck },
    { label: 'Transport', sub: 'Across India', icon: Map },
    { label: 'Supply Chain', sub: 'End to End', icon: Link2 },
];

const DURATION = 900;

const FONTS = {
    BOLD: 'Montserrat-Bold',
    SEMI: 'Montserrat-SemiBold',
    MEDIUM: 'Montserrat-Medium',
};

// ───────────────── SCREEN ─────────────────
export default function Splash() {
    const navigation = useNavigation<Nav>();
    const [index, setIndex] = useState(0);

    // UI-thread animations
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(30);
    const scale = useSharedValue(0.9);

    const progress = useSharedValue(0);

    // animate word
    useEffect(() => {
        opacity.value = 0;
        translateY.value = 30;
        scale.value = 0.9;

        opacity.value = withTiming(1, { duration: 300 });
        translateY.value = withSpring(0);
        scale.value = withSpring(1);

        const timer = setTimeout(() => {
            if (index < SEQUENCE.length - 1) {
                runOnJS(setIndex)(index + 1);
            } else {
                navigation.replace('SelectAccount');
            }
        }, DURATION);

        return () => clearTimeout(timer);
    }, [index]);

    // progress animation
    useEffect(() => {
        progress.value = withTiming(1, {
            duration: SEQUENCE.length * DURATION,
        });
    }, []);

    const animatedWord = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [
            { translateY: translateY.value },
            { scale: scale.value },
        ],
    }));

    const progressStyle = useAnimatedStyle(() => ({
        width: `${interpolate(progress.value, [0, 1], [0, 100])}%`,
    }));

    const CurrentIcon = SEQUENCE[index].icon;

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" translucent />

            <ImageBackground
                source={{
                    uri: 'https://images.pexels.com/photos/1427107/pexels-photo-1427107.jpeg',
                }}
                style={StyleSheet.absoluteFillObject}
                blurRadius={18}
            />

            <LinearGradient
                colors={['#1A1F6B', '#2B3FD4']}
                style={StyleSheet.absoluteFillObject}
            />

            {/* LOGO */}
            <View style={styles.logoWrap}>
                <LinearGradient
                    colors={['#FF6B2C', '#F59E0B']}
                    style={styles.logo}
                >
                    <Truck color="#fff" size={28} />
                </LinearGradient>
            </View>

            {/* WORD */}
            <Animated.View style={[styles.center, animatedWord]}>
                <CurrentIcon color="#fff" size={32} />

                <Text style={styles.title}>
                    {SEQUENCE[index].label}
                </Text>

                <Text style={styles.sub}>
                    {SEQUENCE[index].sub}
                </Text>
            </Animated.View>

            {/* PROGRESS */}
            <View style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, progressStyle]} />
            </View>

            {/* TAGLINE */}
            <Text style={styles.tagline}>
                Move Anything. Anywhere.
            </Text>
        </View>
    );
}

// ───────────────── STYLES ─────────────────
const styles = StyleSheet.create({
    root: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    logoWrap: {
        position: 'absolute',
        top: 120,
    },

    logo: {
        width: 64,
        height: 64,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },

    center: {
        alignItems: 'center',
        gap: 10,
    },

    title: {
        fontFamily: FONTS.BOLD,
        fontSize: 34,
        color: '#fff',
    },

    sub: {
        fontFamily: FONTS.MEDIUM,
        fontSize: 14,
        color: '#ccc',
    },

    progressTrack: {
        position: 'absolute',
        bottom: 90,
        width: width * 0.5,
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 2,
        overflow: 'hidden',
    },

    progressFill: {
        height: '100%',
        backgroundColor: '#FF6B2C',
    },

    tagline: {
        position: 'absolute',
        bottom: 40,
        fontFamily: FONTS.SEMI,
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
    },
});