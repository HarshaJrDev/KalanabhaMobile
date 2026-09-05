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
import {
    ArrowRight,
    Clock,
    IndianRupee,
    User,
    ShieldCheck,
    MapPin,
    Lock,
    Package,
    Building2,
    type LucideIcon,
} from 'lucide-react-native';
import { RootStackParamList } from '../navigation/types';
import { useAppTheme } from '@theme/ThemeContext';

const { width, height } = Dimensions.get('window');

// Real K-mascot art for the three slides that already have a matching
// illustration (the same brand-art family used on Home/SelectAccount).
// Slides 4 & 5 have no matching real illustration yet — see the honest
// note on ICON_HEROES below rather than inventing a photo for them.
const SLIDE_IMAGES: Record<string, ReturnType<typeof require>> = {
    everywhere: require('../../../assets/images/home/onboarding-1-delivery.png'),
    send: require('../../../assets/images/home/ImaCustomer.png'),
    earn: require('../../../assets/images/home/ImaDriver.png'),
};

// No real "shield" or "boxes + storefront" illustration exists in the
// asset set yet — rather than fabricate a photo, these two slides use a
// large brand-colored icon hero instead of a mascot image, until a real
// matching illustration is supplied.
const ICON_HEROES: Record<string, LucideIcon> = {
    safe: ShieldCheck,
    businesses: Package,
};

type OnBoardingScreenProp = NativeStackNavigationProp<RootStackParamList, 'OnBoarding'>;

// Five-slide flow matching the brand's own mockup: title/subtitle above
// the illustration (slide order: title, then hero, then any supporting
// row), Back + dots + Next pinned to the bottom, plus a thin progress
// track under that row. Slides 3-5 carry small supporting rows (perk
// chips / trust icons / audience chips) instead of one bare illustration
// — real marketing copy, not backend claims.
const SLIDES = [
    {
        key: 'everywhere',
        title: 'Fast. Reliable. Everywhere.',
        subtitle: 'Your trusted delivery partner for people and businesses.',
    },
    {
        key: 'send',
        title: 'Send Anything, Anywhere',
        subtitle: 'Book a delivery in seconds and track in real-time.',
    },
    {
        key: 'earn',
        title: 'Earn on Your Terms',
        subtitle: 'Join as a driver, deliver packages and earn money with flexible hours.',
        chips: [
            { icon: Clock, label: 'Flexible Timing' },
            { icon: IndianRupee, label: 'Good Earnings' },
            { icon: User, label: 'Be Your Own Boss' },
        ],
    },
    {
        key: 'safe',
        title: 'Safe & Secure',
        subtitle: 'Your packages are in safe hands with real-time tracking and verified partners.',
        chips: [
            { icon: ShieldCheck, label: 'Verified Partners' },
            { icon: MapPin, label: 'Live Tracking' },
            { icon: Lock, label: 'Secure Deliveries' },
        ],
    },
    {
        key: 'businesses',
        title: 'For Individuals & Businesses',
        subtitle: "Whether it's a personal parcel or business logistics, Kalanabha has you covered.",
        chips: [
            { icon: User, label: 'Personal Deliveries' },
            { icon: Building2, label: 'Business Solutions' },
        ],
    },
] satisfies {
    key: string; title: string; subtitle: string;
    chips?: { icon: LucideIcon; label: string }[];
}[];

const OnBoarding = () => {
    const navigation = useNavigation<OnBoardingScreenProp>();
    const { colors, fonts, fontSize, spacing, radius, isDark } = useAppTheme();
    const styles = useMemo(() => makeStyles(colors, fonts, fontSize, spacing, radius, width, height), [colors, fonts, fontSize, spacing, radius]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const scrollX = useRef(new Animated.Value(0)).current;

    const goToIndex = (index: number) => {
        flatListRef.current?.scrollToIndex({ index, animated: true });
        setCurrentIdx(index);
    };

    const goNext = () => {
        if (currentIdx < SLIDES.length - 1) {
            goToIndex(currentIdx + 1);
        } else {
            navigation.reset({ index: 0, routes: [{ name: 'SelectAccount' }] });
        }
    };

    const goBack = () => {
        if (currentIdx > 0) goToIndex(currentIdx - 1);
    };

    const goSkip = () => {
        navigation.reset({ index: 0, routes: [{ name: 'SelectAccount' }] });
    };

    const renderItem = ({ item }: { item: typeof SLIDES[0] }) => {
        const IconHero = ICON_HEROES[item.key];
        return (
            <View style={styles.slide}>
                <View style={styles.textArea}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.description}>{item.subtitle}</Text>
                </View>

                <View style={styles.illustrationWrap}>
                    {IconHero ? (
                        <View style={styles.iconHeroCircle}>
                            <IconHero size={72} color={colors.PRIMARY} strokeWidth={1.6} />
                        </View>
                    ) : (
                        <Image source={SLIDE_IMAGES[item.key]} resizeMode="contain" style={styles.heroImage} />
                    )}
                </View>

                {item.chips && (
                    <View style={styles.chipRow}>
                        {item.chips.map((chip) => (
                            <View key={chip.label} style={styles.chip}>
                                <chip.icon size={13} color={colors.PRIMARY} strokeWidth={2.2} />
                                <Text style={styles.chipText}>{chip.label}</Text>
                            </View>
                        ))}
                    </View>
                )}
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
                <View style={styles.backSlot}>
                    {currentIdx > 0 && (
                        <TouchableOpacity onPress={goBack} hitSlop={10}>
                            <Text style={styles.backText}>Back</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.dots}>
                    {SLIDES.map((_, i) => {
                        const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
                        const dotW = scrollX.interpolate({ inputRange, outputRange: [6, 18, 6], extrapolate: 'clamp' });
                        const dotColor = i === currentIdx ? colors.PRIMARY : colors.BORDER;
                        return <Animated.View key={i} style={[styles.dot, { width: dotW, backgroundColor: dotColor }]} />;
                    })}
                </View>

                <TouchableOpacity style={styles.nextBtn} onPress={goNext} activeOpacity={0.85}>
                    <Text style={styles.nextBtnText}>
                        {currentIdx === SLIDES.length - 1 ? 'Get Started' : 'Next'}
                    </Text>
                    <ArrowRight color="#fff" size={16} />
                </TouchableOpacity>
            </View>

            <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${((currentIdx + 1) / SLIDES.length) * 100}%` }]} />
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

    slide: { width: screenWidth, flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.lg },

    textArea: { alignItems: 'center', marginBottom: spacing.lg },
    title: {
        fontFamily: fonts.BOLD_PRIMARY,
        fontSize: 24,
        color: colors.TEXT_PRIMARY,
        textAlign: 'center',
        lineHeight: 30,
        marginBottom: 6,
    },
    description: {
        fontFamily: fonts.MEDIUM_PRIMARY,
        fontSize: fontSize.md,
        color: colors.TEXT_SECONDARY,
        textAlign: 'center',
        lineHeight: 20,
    },

    illustrationWrap: {
        flex: 1,
        width: '100%',
        borderRadius: radius.lg + 12,
        backgroundColor: colors.PRIMARY_LIGHT,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        maxHeight: screenHeight * 0.4,
    },
    heroImage: { width: '84%', height: '84%' },
    iconHeroCircle: {
        width: 140, height: 140, borderRadius: 70,
        backgroundColor: colors.SURFACE,
        alignItems: 'center', justifyContent: 'center',
    },

    chipRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: spacing.md },
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
        paddingTop: spacing.md,
        paddingBottom: spacing.sm,
    },
    backSlot: { width: 50 },
    backText: { fontFamily: fonts.SEMI_BOLD_PRIMARY, fontSize: fontSize.md, color: colors.TEXT_SECONDARY },
    dots: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dot: { height: 6, borderRadius: 3 },
    nextBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: colors.PRIMARY,
        borderRadius: 999,
        paddingVertical: 12,
        paddingHorizontal: 20,
        minWidth: 100,
    },
    nextBtnText: {
        fontFamily: fonts.BOLD_PRIMARY,
        fontSize: fontSize.md,
        color: '#fff',
    },

    // Thin progress track under the Back/dots/Next row, matching the
    // reference mockup's bottom indicator — separate from the per-slide
    // dots above it.
    progressTrack: {
        height: 4,
        marginHorizontal: spacing.xl,
        marginBottom: Platform.OS === 'ios' ? 28 : 18,
        borderRadius: 2,
        backgroundColor: colors.BORDER,
        overflow: 'hidden',
    },
    progressFill: { height: '100%', backgroundColor: colors.PRIMARY, borderRadius: 2 },
});
