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
    Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, ArrowLeft } from 'lucide-react-native';
import { RootStackParamList } from '../navigation/types';
import { useAppTheme } from '@theme/ThemeContext';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

// Every real K-mascot illustration in the asset set gets its own slide
// (none repeated, none combined) — each image is a standalone hero, so
// the copy beside it names what that scene means rather than
// re-captioning or adding chip rows on top of what's already drawn.
const SLIDE_IMAGES = [
    require('../../../assets/images/home/onboarding-1.png'),
    require('../../../assets/images/home/onboarding-1-delivery.png'),
    require('../../../assets/images/home/ImaCustomer.png'),
    require('../../../assets/images/home/onboarding-2-tracking.png'),
    require('../../../assets/images/home/onboarding-2.png'),
    require('../../../assets/images/home/onboarding-3-trust.png'),
    require('../../../assets/images/home/ImaDriver.png'),
    require('../../../assets/images/home/onboarding-3.png'),
];

type OnBoardingScreenProp = NativeStackNavigationProp<RootStackParamList, 'OnBoarding'>;

// Eight slides, one per real illustration, arranged as a narrative arc:
// intro → coverage → booking → choosing a vehicle → live tracking →
// trust/insurance → the driver side → "there's a path for everyone"
// (which sets up SelectAccount's actual customer/driver choice next).
const makeSlides = (t: (key: string) => string) => ([
    { key: '1', title: t('onboarding.slide1Title'), accent: t('onboarding.slide1Accent'), description: t('onboarding.slide1Desc') },
    { key: '2', title: t('onboarding.slide2Title'), accent: t('onboarding.slide2Accent'), description: t('onboarding.slide2Desc') },
    { key: '3', title: t('onboarding.slide3Title'), accent: t('onboarding.slide3Accent'), description: t('onboarding.slide3Desc') },
    { key: '4', title: t('onboarding.slide4Title'), accent: t('onboarding.slide4Accent'), description: t('onboarding.slide4Desc') },
    { key: '5', title: t('onboarding.slide5Title'), accent: t('onboarding.slide5Accent'), description: t('onboarding.slide5Desc') },
    { key: '6', title: t('onboarding.slide6Title'), accent: t('onboarding.slide6Accent'), description: t('onboarding.slide6Desc') },
    { key: '7', title: t('onboarding.slide7Title'), accent: t('onboarding.slide7Accent'), description: t('onboarding.slide7Desc') },
    { key: '8', title: t('onboarding.slide8Title'), accent: t('onboarding.slide8Accent'), description: t('onboarding.slide8Desc') },
] satisfies { key: string; title: string; accent: string; description: string }[]);

const OnBoarding = () => {
    const navigation = useNavigation<OnBoardingScreenProp>();
    const { colors, fonts, fontSize, spacing, radius, isDark } = useAppTheme();
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const styles = useMemo(
        () => makeStyles(colors, fonts, fontSize, spacing, radius, width, height, insets),
        [colors, fonts, fontSize, spacing, radius, insets],
    );
    const SLIDES = useMemo(() => makeSlides(t), [t]);
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
                        <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
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
                // Every slide is exactly `width` wide, so the offset is
                // computable up front — without this, scrollToIndex (used
                // by both Next and Back, with scrolling disabled so it's
                // the only way to move) has to guess at the position of
                // any slide RN hasn't measured yet, which is unreliable
                // once there are more than a couple of slides.
                getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
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
                    <Text style={styles.nextBtnText}>{isLast ? t('onboarding.getStarted') : t('onboarding.next')}</Text>
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
    insets: { top: number; bottom: number },
) => StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.BACKGROUND },
    slidesList: { flex: 1 },

    // Real device safe-area insets, not a guessed Platform.OS constant —
    // a fixed 36/56px top padding overlaps the status bar on phones with
    // a taller notch/cutout, and a fixed 28/40px bottom padding overlaps
    // Android's 3-button nav bar (which is taller than that on plenty of
    // real devices) the same way the bottom tab bar used to before it
    // switched to real insets.
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        paddingTop: insets.top + 12,
        paddingBottom: 12,
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
        paddingBottom: insets.bottom + 16,
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
