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
import { ArrowRight, ArrowLeft } from 'lucide-react-native';
import { RootStackParamList } from '../navigation/types';
import { useAppTheme } from '@theme/ThemeContext';

const { width, height } = Dimensions.get('window');

// The three real K-mascot illustrations you supplied — each one already
// tells its own story (the delivery scene, the on-time/schedule scene,
// the customer/driver/business path teaser), so the copy below describes
// what each slide MEANS rather than re-captioning what's already drawn
// in the artwork. No chip rows repeating what the image already shows.
const SLIDE_IMAGES = [
    require('../../../assets/images/home/onboarding-1.png'),
    require('../../../assets/images/home/onboarding-2.png'),
    require('../../../assets/images/home/onboarding-3.png'),
];

type OnBoardingScreenProp = NativeStackNavigationProp<RootStackParamList, 'OnBoarding'>;

// A tight three-slide flow, not five — every extra slide is a chance for
// someone to bail before they ever open the app, and these three real
// illustrations already cover the whole story (send it → track it →
// there's a path for you) without padding. Slide 3 deliberately sets up
// the very next screen (SelectAccount's customer/driver choice).
const SLIDES = [
    {
        key: '1',
        title: 'Send it. ',
        accent: 'Anywhere.',
        description: 'Book a pickup for any package and get moving in seconds.',
    },
    {
        key: '2',
        title: 'Always ',
        accent: 'On Time.',
        description: 'Live tracking keeps you posted from pickup to your doorstep.',
    },
    {
        key: '3',
        title: 'Built for ',
        accent: 'Everyone.',
        description: "Sending, driving, or running a business — there's a place for you here.",
    },
] satisfies { key: string; title: string; accent: string; description: string }[];

const OnBoarding = () => {
    const navigation = useNavigation<OnBoardingScreenProp>();
    const { colors, fonts, fontSize, spacing, radius, isDark } = useAppTheme();
    const styles = useMemo(() => makeStyles(colors, fonts, fontSize, spacing, radius, width, height), [colors, fonts, fontSize, spacing, radius]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const scrollX = useRef(new Animated.Value(0)).current;
    const isLast = currentIdx === SLIDES.length - 1;

    const goToIndex = (index: number) => {
        flatListRef.current?.scrollToIndex({ index, animated: true });
        setCurrentIdx(index);
    };

    const goNext = () => {
        if (!isLast) {
            goToIndex(currentIdx + 1);
        } else {
            navigation.reset({ index: 0, routes: [{ name: 'SelectAccount' }] });
        }
    };

    const goBack = () => { if (currentIdx > 0) goToIndex(currentIdx - 1); };
    const goSkip = () => navigation.reset({ index: 0, routes: [{ name: 'SelectAccount' }] });

    const renderItem = ({ item, index }: { item: typeof SLIDES[0]; index: number }) => {
        // A soft two-tone glow behind the artwork instead of a flat
        // tinted box — reads as a considered backdrop rather than a
        // placeholder card, and lets the transparent PNG's own colors
        // (mostly brand orange + skin tones) sit on something with a
        // little depth.
        return (
            <View style={styles.slide}>
                <View style={styles.illustrationWrap}>
                    <View style={styles.glowBack} />
                    <View style={styles.glowFront} />
                    <Image source={SLIDE_IMAGES[index]} resizeMode="contain" style={styles.heroImage} />
                </View>

                <View style={styles.textArea}>
                    <Text style={styles.title}>
                        {item.title}
                        <Text style={styles.titleAccent}>{item.accent}</Text>
                    </Text>
                    <Text style={styles.description}>{item.description}</Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.root}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.BACKGROUND} />

            <View style={styles.topBar}>
                <View style={styles.brandRow}>
                    <View style={styles.brandMark}>
                        <Text style={styles.brandMarkText}>K</Text>
                    </View>
                    <Text style={styles.brandName}>Kalanabha</Text>
                </View>
                {!isLast && (
                    <TouchableOpacity onPress={goSkip} hitSlop={10}>
                        <Text style={styles.skipText}>Skip</Text>
                    </TouchableOpacity>
                )}
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
                <TouchableOpacity
                    onPress={goBack}
                    hitSlop={10}
                    disabled={currentIdx === 0}
                    style={[styles.backBtn, currentIdx === 0 && styles.backBtnHidden]}
                >
                    <ArrowLeft color={colors.TEXT_PRIMARY} size={18} />
                </TouchableOpacity>

                <View style={styles.dots}>
                    {SLIDES.map((_, i) => {
                        const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
                        const dotW = scrollX.interpolate({ inputRange, outputRange: [6, 20, 6], extrapolate: 'clamp' });
                        const dotColor = i === currentIdx ? colors.PRIMARY : colors.BORDER;
                        return <Animated.View key={i} style={[styles.dot, { width: dotW, backgroundColor: dotColor }]} />;
                    })}
                </View>

                <TouchableOpacity style={styles.nextBtn} onPress={goNext} activeOpacity={0.85}>
                    <Text style={styles.nextBtnText}>{isLast ? 'Get Started' : 'Next'}</Text>
                    <ArrowRight color="#fff" size={17} />
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
        height: Platform.OS === 'ios' ? 88 : 68,
    },
    brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    brandMark: {
        width: 30, height: 30, borderRadius: 9, backgroundColor: colors.PRIMARY,
        alignItems: 'center', justifyContent: 'center',
    },
    brandMarkText: { color: '#fff', fontSize: 15, fontFamily: fonts.BOLD_PRIMARY },
    brandName: { fontFamily: fonts.BOLD_PRIMARY, fontSize: fontSize.lg, color: colors.PRIMARY },
    skipText: {
        fontFamily: fonts.SEMI_BOLD_PRIMARY,
        fontSize: fontSize.md,
        color: colors.TEXT_SECONDARY,
    },

    slide: { width: screenWidth, flex: 1 },

    // Full-bleed, edge-to-edge illustration zone sized off screen height —
    // the artwork is the hero, not a graphic wedged between two text
    // blocks. Two overlapping soft circles stand in for a flat tinted
    // box, giving the backdrop a little depth without adding any new
    // "claims" or content.
    illustrationWrap: {
        width: '100%',
        height: screenHeight * 0.5,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    glowBack: {
        position: 'absolute',
        width: screenWidth * 1.3,
        height: screenWidth * 1.3,
        borderRadius: screenWidth * 0.65,
        backgroundColor: colors.PRIMARY_LIGHT,
        top: -screenWidth * 0.55,
    },
    glowFront: {
        position: 'absolute',
        width: screenWidth * 0.9,
        height: screenWidth * 0.9,
        borderRadius: screenWidth * 0.45,
        backgroundColor: colors.BACKGROUND,
        opacity: 0.5,
        bottom: -screenWidth * 0.32,
    },
    heroImage: { width: '80%', height: '92%' },

    textArea: {
        flex: 1,
        paddingHorizontal: spacing.xl + 4,
        paddingTop: spacing.xl,
    },
    title: {
        fontFamily: fonts.BOLD_PRIMARY,
        fontSize: 32,
        color: colors.TEXT_PRIMARY,
        lineHeight: 38,
        letterSpacing: -0.5,
        marginBottom: spacing.sm,
    },
    titleAccent: { color: colors.PRIMARY },
    description: {
        fontFamily: fonts.MEDIUM_PRIMARY,
        fontSize: fontSize.lg,
        color: colors.TEXT_SECONDARY,
        lineHeight: 22,
        maxWidth: '92%',
    },

    bottomBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.md,
        paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    },
    backBtn: {
        width: 44, height: 44, borderRadius: 22,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: colors.SURFACE,
        borderWidth: 1, borderColor: colors.BORDER,
    },
    backBtnHidden: { opacity: 0 },
    dots: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dot: { height: 6, borderRadius: 3 },
    nextBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: colors.PRIMARY,
        borderRadius: 999,
        paddingVertical: 14,
        paddingHorizontal: 24,
        minWidth: 118,
    },
    nextBtnText: {
        fontFamily: fonts.BOLD_PRIMARY,
        fontSize: fontSize.md,
        color: '#fff',
    },
});
