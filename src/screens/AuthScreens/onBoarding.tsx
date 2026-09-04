import React, { useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    StatusBar,
    Dimensions,
    FlatList,
    Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Zap, MapPin, ShieldCheck, ArrowRight, type LucideIcon } from 'lucide-react-native';
import { RootStackParamList } from '../navigation/types';
import { useAppTheme } from '@theme/ThemeContext';

const { width } = Dimensions.get('window');

type OnBoardingScreenProp = NativeStackNavigationProp<RootStackParamList, 'OnBoarding'>;

// Kalanabha's own visual language — light surface + a soft orange-tinted
// illustration card per slide, replacing the previous full-bleed colorful
// gradients (blue/green/orange per slide) that didn't match the brand's
// "clean, minimal, orange used strategically" direction (§4/§9 of the
// brand spec). Slide content/order/navigation logic is unchanged.
const SLIDES = [
    {
        key: '1',
        icon: Zap,
        title: 'Move Anything,\nAnywhere',
        description: 'Fast, safe & reliable delivery at your fingertips.',
    },
    {
        key: '2',
        icon: MapPin,
        title: 'Real-time\nTracking',
        description: 'Track your package in real-time from pickup to delivery.',
    },
    {
        key: '3',
        icon: ShieldCheck,
        title: 'Secure &\nReliable',
        description: 'Verified delivery partners and secure payments.',
    },
] satisfies { key: string; icon: LucideIcon; title: string; description: string }[];

const OnBoarding = () => {
    const navigation = useNavigation<OnBoardingScreenProp>();
    const { colors, fonts, fontSize, spacing, radius, isDark } = useAppTheme();
    const styles = useMemo(() => makeStyles(colors, fonts, fontSize, spacing, radius, width), [colors, fonts, fontSize, spacing, radius]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const scrollX = useRef(new Animated.Value(0)).current;

    const goNext = () => {
        if (currentIdx < SLIDES.length - 1) {
            const next = currentIdx + 1;
            flatListRef.current?.scrollToIndex({ index: next, animated: true });
            setCurrentIdx(next);
        } else {
            navigation.reset({ index: 0, routes: [{ name: 'SelectAccount' }] });
        }
    };

    const goSkip = () => {
        navigation.reset({ index: 0, routes: [{ name: 'SelectAccount' }] });
    };

    const renderItem = ({ item }: { item: typeof SLIDES[0] }) => (
        <View style={styles.slide}>
            <View style={styles.illustrationCard}>
                <View style={styles.illustrationCircle}>
                    <item.icon color={colors.PRIMARY} size={56} strokeWidth={1.75} />
                </View>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
        </View>
    );

    return (
        <View style={styles.root}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.BACKGROUND} />

            <View style={styles.topBar}>
                <View style={{ width: 40 }} />
                <TouchableOpacity onPress={goSkip} hitSlop={10}>
                    <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
            </View>

            <Animated.FlatList
                ref={flatListRef}
                data={SLIDES}
                renderItem={renderItem}
                horizontal
                pagingEnabled
                scrollEnabled={false}
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.key}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
                    useNativeDriver: false,
                })}
                style={{ flex: 1 }}
            />

            <View style={styles.bottomBar}>
                <View style={styles.dots}>
                    {SLIDES.map((_, i) => {
                        const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
                        const dotW = scrollX.interpolate({ inputRange, outputRange: [6, 22, 6], extrapolate: 'clamp' });
                        const dotColor = i === currentIdx ? colors.PRIMARY : colors.BORDER;
                        return <Animated.View key={i} style={[styles.dot, { width: dotW, backgroundColor: dotColor }]} />;
                    })}
                </View>

                <TouchableOpacity style={styles.nextBtn} onPress={goNext} activeOpacity={0.85}>
                    <Text style={styles.nextBtnText}>
                        {currentIdx === SLIDES.length - 1 ? 'Get Started' : 'Next'}
                    </Text>
                    <ArrowRight color="#fff" size={18} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default OnBoarding;

// Computed from useAppTheme() so this screen repaints correctly in dark
// mode instead of staying pinned to the light palette baked at import.
const makeStyles = (
    colors: ReturnType<typeof useAppTheme>['colors'],
    fonts: ReturnType<typeof useAppTheme>['fonts'],
    fontSize: ReturnType<typeof useAppTheme>['fontSize'],
    spacing: ReturnType<typeof useAppTheme>['spacing'],
    radius: ReturnType<typeof useAppTheme>['radius'],
    width: number,
) => StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.BACKGROUND },

    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        paddingTop: Platform.OS === 'ios' ? 56 : 36,
    },
    skipText: {
        fontFamily: fonts.SEMI_BOLD_PRIMARY,
        fontSize: fontSize.md,
        color: colors.TEXT_SECONDARY,
    },

    slide: { width, flex: 1, alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.xl },

    illustrationCard: {
        width: '100%',
        aspectRatio: 1,
        maxHeight: 280,
        backgroundColor: colors.SURFACE,
        borderRadius: radius.lg + 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xl,
        borderWidth: 1,
        borderColor: colors.BORDER,
    },
    illustrationCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: colors.PRIMARY_LIGHT,
        alignItems: 'center',
        justifyContent: 'center',
    },

    title: {
        fontFamily: fonts.BOLD_PRIMARY,
        fontSize: 26,
        color: colors.TEXT_PRIMARY,
        textAlign: 'center',
        lineHeight: 32,
        marginBottom: spacing.sm,
    },
    description: {
        fontFamily: fonts.MEDIUM_PRIMARY,
        fontSize: fontSize.lg,
        color: colors.TEXT_SECONDARY,
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: spacing.md,
    },

    bottomBar: {
        paddingHorizontal: spacing.xl,
        paddingBottom: Platform.OS === 'ios' ? 40 : 28,
        gap: spacing.xl,
    },
    dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7 },
    dot: { height: 6, borderRadius: 3 },
    nextBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        backgroundColor: colors.PRIMARY,
        borderRadius: radius.md,
        paddingVertical: 16,
    },
    nextBtnText: {
        fontFamily: fonts.BOLD_PRIMARY,
        fontSize: fontSize.xl,
        color: '#fff',
    },
});
