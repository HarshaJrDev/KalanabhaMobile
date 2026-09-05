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
import { ArrowRight, Truck, Bike, Package, Shield, ShieldCheck, Radar, type LucideIcon } from 'lucide-react-native';
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

// Matches the brand's own onboarding mockup: full-bleed illustration (no
// bordered "card"), a two-line headline with one accent word in brand
// orange, and a bottom row pairing the dot/counter progress with the
// Next/Get Started pill — replacing the previous icon-badge + boxed-card
// layout. Slide order/navigation/skip logic is unchanged.
// Chip copy is grounded in the app's real capabilities, not invented
// marketing claims: bike/van/truck + house-shifting are the actual
// VehicleConfig categories every booking flow reads, and the trust line
// echoes Home.tsx's own "Kalanabha Transit Shield" banner text verbatim.
const SLIDES = [
    {
        key: '1',
        titleLine1: 'Deliver',
        titleLine2: 'Without ',
        accent: 'Limits',
        description: 'Book trucks, pickups and more for all your moving needs',
        chips: [
            { icon: Bike, label: 'Bike' },
            { icon: Truck, label: 'Van & Truck' },
            { icon: Package, label: 'House Shifting' },
        ],
    },
    {
        key: '2',
        titleLine1: 'Choose',
        titleLine2: 'What ',
        accent: 'You Need',
        description: 'From small parcels to heavy loads, we have the right vehicle for you',
        chips: [
            { icon: Radar, label: 'Live Tracking' },
            { icon: Package, label: 'Real-Time Updates' },
        ],
    },
    {
        key: '3',
        titleLine1: 'Move to a',
        titleLine2: 'Better ',
        accent: 'Tomorrow',
        description: 'Reliable. Affordable. On your terms.',
        chips: [
            { icon: Shield, label: 'Insured' },
            { icon: ShieldCheck, label: 'Verified Pilots' },
        ],
    },
] satisfies {
    key: string; titleLine1: string; titleLine2: string; accent: string; description: string;
    chips: { icon: LucideIcon; label: string }[];
}[];

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

                <View style={styles.chipRow}>
                    {item.chips.map((chip) => (
                        <View key={chip.label} style={styles.chip}>
                            <chip.icon size={13} color={colors.PRIMARY} strokeWidth={2.2} />
                            <Text style={styles.chipText}>{chip.label}</Text>
                        </View>
                    ))}
                </View>
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

    // Full-bleed, edge-to-edge — no horizontal padding — and sized off
    // screen height (not just width) so it reads as a real hero section
    // rather than a bounded illustration box.
    illustrationWrap: {
        width: '100%',
        height: screenHeight * 0.46,
        backgroundColor: colors.PRIMARY_LIGHT,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    heroImage: { width: '92%', height: '92%' },

    textArea: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.xl },

    title: {
        fontFamily: fonts.BOLD_PRIMARY,
        fontSize: 28,
        color: colors.TEXT_PRIMARY,
        textAlign: 'left',
        lineHeight: 34,
        marginBottom: spacing.sm,
    },
    titleAccent: { color: colors.PRIMARY },
    description: {
        fontFamily: fonts.MEDIUM_PRIMARY,
        fontSize: fontSize.md,
        color: colors.TEXT_SECONDARY,
        textAlign: 'left',
        lineHeight: 20,
        marginBottom: spacing.md,
    },

    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: colors.SURFACE,
        borderWidth: 1,
        borderColor: colors.BORDER,
    },
    chipText: { fontFamily: fonts.SEMI_BOLD_PRIMARY, fontSize: 12, color: colors.TEXT_PRIMARY },

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
