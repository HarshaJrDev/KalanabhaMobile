import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, StatusBar, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    withDelay,
    Easing,
} from 'react-native-reanimated';
import { Truck, Package, Zap, ShieldCheck } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAppTheme } from '@theme/ThemeContext';

const { width } = Dimensions.get('window');
type Nav = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

// Kalanabha's own visual identity — a clean cream/white surface with the
// brand orange used strategically (mark + progress bar only), not a
// borrowed stock-photo backdrop. No network image dependency either,
// which also means no flash-of-unstyled-content while a Splash screen
// waits on a slow connection to fetch a background.
const FEATURES = [
    { icon: Package, label: 'Move Anything' },
    { icon: Zap, label: 'Real-time Tracking' },
    { icon: ShieldCheck, label: 'Secure & Reliable' },
];

const Splash = () => {
    const navigation = useNavigation<Nav>();
    const { colors, fonts, fontSize, spacing, radius, isDark } = useAppTheme();
    const styles = useMemo(() => makeStyles(colors, fonts, fontSize, spacing, radius, width), [colors, fonts, fontSize, spacing, radius]);

    const logoScale = useSharedValue(0.7);
    const logoOpacity = useSharedValue(0);
    const wordmarkOpacity = useSharedValue(0);
    const wordmarkY = useSharedValue(16);
    const progress = useSharedValue(0);

    useEffect(() => {
        logoOpacity.value = withTiming(1, { duration: 400 });
        logoScale.value = withSpring(1, { damping: 9, mass: 0.6 });
        wordmarkOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));
        wordmarkY.value = withDelay(200, withSpring(0, { damping: 12 }));
        progress.value = withTiming(1, { duration: 1600, easing: Easing.out(Easing.cubic) });

        const timer = setTimeout(() => navigation.replace('OnBoarding'), 1700);
        return () => clearTimeout(timer);
    }, []);

    const logoStyle = useAnimatedStyle(() => ({
        opacity: logoOpacity.value,
        transform: [{ scale: logoScale.value }],
    }));

    const wordmarkStyle = useAnimatedStyle(() => ({
        opacity: wordmarkOpacity.value,
        transform: [{ translateY: wordmarkY.value }],
    }));

    const progressStyle = useAnimatedStyle(() => ({
        width: `${progress.value * 100}%`,
    }));

    return (
        <View style={styles.root}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.BACKGROUND} />

            <View style={styles.center}>
                <Animated.View style={[styles.logo, logoStyle]}>
                    <Truck color="#fff" size={30} strokeWidth={2.25} />
                </Animated.View>

                <Animated.View style={wordmarkStyle}>
                    <Text style={styles.wordmark}>KALANABHA</Text>
                    <Text style={styles.tagline}>Move Anything, Anywhere</Text>
                </Animated.View>
            </View>

            <View style={styles.featureRow}>
                {FEATURES.map((f) => {
                    const Icon = f.icon;
                    return (
                        <View key={f.label} style={styles.featurePill}>
                            <Icon color={colors.PRIMARY} size={14} />
                            <Text style={styles.featureText}>{f.label}</Text>
                        </View>
                    );
                })}
            </View>

            <View style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, progressStyle]} />
            </View>
        </View>
    );
};

export default Splash;

// Computed from useAppTheme() (rather than a module-level StyleSheet baked
// with the light palette) so Splash repaints correctly in dark mode.
const makeStyles = (
    colors: ReturnType<typeof useAppTheme>['colors'],
    fonts: ReturnType<typeof useAppTheme>['fonts'],
    fontSize: ReturnType<typeof useAppTheme>['fontSize'],
    spacing: ReturnType<typeof useAppTheme>['spacing'],
    radius: ReturnType<typeof useAppTheme>['radius'],
    width: number,
) => StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: colors.BACKGROUND,
        alignItems: 'center',
        justifyContent: 'center',
    },
    center: {
        alignItems: 'center',
        gap: spacing.lg,
    },
    logo: {
        width: 72,
        height: 72,
        borderRadius: radius.lg + 8,
        backgroundColor: colors.PRIMARY,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.PRIMARY,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    wordmark: {
        fontFamily: fonts.BOLD_PRIMARY,
        fontSize: 28,
        color: colors.PRIMARY,
        textAlign: 'center',
        letterSpacing: 1,
    },
    tagline: {
        fontFamily: fonts.MEDIUM_PRIMARY,
        fontSize: fontSize.md,
        color: colors.TEXT_SECONDARY,
        textAlign: 'center',
        marginTop: 2,
    },
    featureRow: {
        position: 'absolute',
        bottom: 96,
        flexDirection: 'row',
        gap: spacing.sm,
        flexWrap: 'wrap',
        justifyContent: 'center',
        paddingHorizontal: spacing.xl,
    },
    featurePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: colors.SURFACE,
        borderWidth: 1,
        borderColor: colors.BORDER,
        borderRadius: 999,
        paddingHorizontal: spacing.md,
        paddingVertical: 6,
    },
    featureText: {
        fontFamily: fonts.MEDIUM_PRIMARY,
        fontSize: fontSize.xs,
        color: colors.TEXT_PRIMARY,
    },
    progressTrack: {
        position: 'absolute',
        bottom: 56,
        width: width * 0.4,
        height: 3,
        backgroundColor: colors.BORDER,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: colors.PRIMARY,
    },
});
