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
    Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowRight } from 'lucide-react-native';
import { RootStackParamList } from '../navigation/types';
import { useAppTheme } from '@theme/ThemeContext';

const { width, height } = Dimensions.get('window');

// Three real, brand-illustrated scenes cropped from the single K-mascot
// artwork the user supplied (assets/images/home/onboarding-logistics-hero.png)
// — the truck+pin+city, the phone/route+vehicle-lineup, and the courier+
// trust-badges each already existed as one composite; this splits that
// same real art into a dedicated image per slide instead of reusing one
// crop three times.
const SLIDE_IMAGES = [
    require('../../../assets/images/home/onboarding-1-delivery.png'),
    require('../../../assets/images/home/onboarding-2-tracking.png'),
    require('../../../assets/images/home/onboarding-3-trust.png'),
];

type OnBoardingScreenProp = NativeStackNavigationProp<RootStackParamList, 'OnBoarding'>;

// Traditional, centered onboarding layout: big illustration on top, then
// a centered title/subtitle block, dots + Next/Get Started pinned to the
// bottom — no boxed card, no extra chip row (the mascot art on slide 3
// already carries its own "Safe & Secure / Fast Booking / Trusted
// Service" badges baked into the image, so a second row of badge chips
// underneath was pure duplication, not "more content"). Slide order/
// navigation/skip logic is unchanged.
const SLIDES = [
    {
        key: '1',
        titleLine1: 'Deliver',
        titleLine2: 'Without ',
        accent: 'Limits',
        description: 'Book trucks, pickups and more for all your moving needs',
    },
    {
        key: '2',
        titleLine1: 'Choose',
        titleLine2: 'What ',
        accent: 'You Need',
        description: 'From small parcels to heavy loads, we have the right vehicle for you',
    },
    {
        key: '3',
        titleLine1: 'Move to a',
        titleLine2: 'Better ',
        accent: 'Tomorrow',
        description: 'Reliable. Affordable. On your terms.',
    },
] satisfies { key: string; titleLine1: string; titleLine2: string; accent: string; description: string }[];

const OnBoarding = () => {
    const navigation = useNavigation<OnBoardingScreenProp>();
    const { colors, fonts, fontSize, spacing, radius, isDark } = useAppTheme();
    const styles = useMemo(() => makeStyles(colors, fonts, fontSize, spacing, radius, width, height), [colors, fonts, fontSize, spacing, radius]);
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

    const renderItem = ({ item, index }: { item: typeof SLIDES[0]; index: number }) => (
        <View style={styles.slide}>
            {/* Full-bleed hero panel, edge-to-edge (not boxed/margined like
                a card) — a soft brand-tinted backdrop behind the real
                K-mascot artwork so the illustration reads as a full
                "hero" section of the screen rather than a small graphic
                floating mid-page. */}
            <View style={styles.illustrationWrap}>
                <Image source={SLIDE_IMAGES[index]} resizeMode="contain" style={styles.heroImage} />
            </View>

            <View style={styles.textArea}>
                <Text style={styles.title}>
                    {item.titleLine1}
                    {'\n'}
                    {item.titleLine2}
                    <Text style={styles.titleAccent}>{item.accent}</Text>
                </Text>
                <Text style={styles.description}>{item.description}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.root}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.BACKGROUND} />

            <View style={styles.topBar}>
                <View style={styles.brandRow}>
                    <View style={styles.brandMark}>
                        <Text style={styles.brandMarkText}>K</Text>
                    </View>
                    <View>
                        <Text style={styles.brandName}>Kalanabha</Text>
                        <Text style={styles.brandTagline}>Move Anything, Anywhere</Text>
                    </View>
                </View>
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
                style={styles.slidesList}
            />

            <View style={styles.bottomBar}>
                <View style={styles.progressGroup}>
                    <Text style={styles.progressCounter}>{currentIdx + 1} / {SLIDES.length}</Text>
                    <View style={styles.dots}>
                        {SLIDES.map((_, i) => {
                            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
                            const dotW = scrollX.interpolate({ inputRange, outputRange: [6, 18, 6], extrapolate: 'clamp' });
                            const dotColor = i === currentIdx ? colors.PRIMARY : colors.BORDER;
                            return <Animated.View key={i} style={[styles.dot, { width: dotW, backgroundColor: dotColor }]} />;
                        })}
                    </View>
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
    screenWidth: number,
    screenHeight: number,
) => StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.BACKGROUND },
    slidesList: { flex: 1 },

    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        paddingTop: Platform.OS === 'ios' ? 56 : 36,
    },
    brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    brandMark: {
        width: 34, height: 34, borderRadius: 10, backgroundColor: colors.PRIMARY,
        alignItems: 'center', justifyContent: 'center',
    },
    brandMarkText: { color: '#fff', fontSize: 17, fontFamily: fonts.BOLD_PRIMARY },
    brandName: { fontFamily: fonts.BOLD_PRIMARY, fontSize: fontSize.md, color: colors.PRIMARY, lineHeight: 18 },
    brandTagline: { fontFamily: fonts.MEDIUM_PRIMARY, fontSize: 10, color: colors.TEXT_SECONDARY },
    skipText: {
        fontFamily: fonts.SEMI_BOLD_PRIMARY,
        fontSize: fontSize.md,
        color: colors.TEXT_SECONDARY,
    },

    slide: { width: screenWidth, flex: 1 },

    // Full-bleed, edge-to-edge — no horizontal padding — so the real
    // K-mascot artwork reads as a proper hero section, sized to leave
    // clear room below for a traditionally centered title/subtitle block
    // rather than crowding it to one side.
    illustrationWrap: {
        width: '100%',
        height: screenHeight * 0.4,
        backgroundColor: colors.PRIMARY_LIGHT,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    heroImage: { width: '84%', height: '84%' },

    textArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xl,
    },

    title: {
        fontFamily: fonts.BOLD_PRIMARY,
        fontSize: 26,
        color: colors.TEXT_PRIMARY,
        textAlign: 'center',
        lineHeight: 32,
        marginBottom: spacing.sm,
    },
    titleAccent: { color: colors.PRIMARY },
    description: {
        fontFamily: fonts.MEDIUM_PRIMARY,
        fontSize: fontSize.md,
        color: colors.TEXT_SECONDARY,
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: spacing.md,
    },

    bottomBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.xl,
        paddingBottom: Platform.OS === 'ios' ? 40 : 28,
        paddingTop: spacing.md,
    },
    progressGroup: { gap: 8 },
    progressCounter: { fontFamily: fonts.MEDIUM_PRIMARY, fontSize: fontSize.sm, color: colors.TEXT_SECONDARY },
    dots: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dot: { height: 6, borderRadius: 3 },
    nextBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        backgroundColor: colors.PRIMARY,
        borderRadius: 999,
        paddingVertical: 14,
        paddingHorizontal: 26,
    },
    nextBtnText: {
        fontFamily: fonts.BOLD_PRIMARY,
        fontSize: fontSize.lg,
        color: '#fff',
    },
});
