import React, { useRef, useState } from 'react';
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
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
    Zap,
    MapPin,
    ShieldCheck,
    Package,
    Map,
    DollarSign,
    Satellite,
    Bell,
    Smartphone,
    Lock,
    Star,
    Phone,
    type LucideIcon,
} from 'lucide-react-native';
import { RootStackParamList } from '../navigation/types';

const { width, height } = Dimensions.get('window');

type OnBoardingScreenProp = NativeStackNavigationProp<RootStackParamList, 'OnBoarding'>;

// ─── Slide data ─────────────────────────────────────────────────────────────────
const SLIDES = [
    {
        key: '1',
        icon: Zap,
        title: 'Instant Booking',
        subtitle: 'Ship anything in seconds',
        description: 'Book a pickup in under 60 seconds. Choose your vehicle, set the address, and we handle the rest.',
        gradient: ['#1A1F6B', '#2B3FD4', '#6366F1'] as const,
        accentColor: '#818CF8',
        features: [
            { icon: Package, text: 'Same-day pickup available' },
            { icon: Map, text: 'Door-to-door service' },
            { icon: DollarSign, text: 'Transparent pricing' },
        ],
        illustration: Zap,
        orbColor: '#4F46E5',
    },
    {
        key: '2',
        icon: MapPin,
        title: 'Live GPS Tracking',
        subtitle: 'Know exactly where it is',
        description: 'Real-time tracking lets you follow your shipment at every step — from warehouse to your doorstep.',
        gradient: ['#064E3B', '#059669', '#10B981'] as const,
        accentColor: '#34D399',
        features: [
            { icon: Satellite, text: 'Real-time GPS updates' },
            { icon: Bell, text: 'Instant notifications' },
            { icon: Smartphone, text: 'Share tracking link' },
        ],
        illustration: Map,
        orbColor: '#059669',
    },
    {
        key: '3',
        icon: ShieldCheck,
        title: 'Safe & Insured',
        subtitle: 'Protected every kilometre',
        description: 'All shipments are fully insured. Our trained drivers and careful handling ensure your goods arrive intact.',
        gradient: ['#7C2D12', '#EA580C', '#FB923C'] as const,
        accentColor: '#FCA5A1',
        features: [
            { icon: Lock, text: 'Full shipment insurance' },
            { icon: Star, text: 'Verified drivers only' },
            { icon: Phone, text: '24/7 customer support' },
        ],
        illustration: ShieldCheck,
        orbColor: '#EA580C',
    },
] satisfies {
    key: string;
    icon: LucideIcon;
    title: string;
    subtitle: string;
    description: string;
    gradient: readonly [string, string, string];
    accentColor: string;
    features: { icon: LucideIcon; text: string }[];
    illustration: LucideIcon;
    orbColor: string;
}[];

// ─── Component ─────────────────────────────────────────────────────────────────
const OnBoarding = () => {
    const navigation = useNavigation<OnBoardingScreenProp>();
    const [currentIdx, setCurrentIdx] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const scrollX = useRef(new Animated.Value(0)).current;

    // Animations per slide
    const slideAnims = useRef(SLIDES.map(() => ({
        text: new Animated.Value(0),
        slide: new Animated.Value(30),
        scale: new Animated.Value(0.8),
    }))).current;

    // Animate current slide on mount
    React.useEffect(() => {
        animateIn(0);
    }, []);

    const animateIn = (idx: number) => {
        const { text, slide, scale } = slideAnims[idx];
        text.setValue(0);
        slide.setValue(30);
        scale.setValue(0.8);
        Animated.parallel([
            Animated.timing(text, { toValue: 1, duration: 450, useNativeDriver: true }),
            Animated.spring(slide, { toValue: 0, tension: 55, friction: 9, useNativeDriver: true }),
            Animated.spring(scale, { toValue: 1, tension: 55, friction: 9, useNativeDriver: true }),
        ]).start();
    };

    const goNext = () => {
        if (currentIdx < SLIDES.length - 1) {
            const next = currentIdx + 1;
            flatListRef.current?.scrollToIndex({ index: next, animated: true });
            setCurrentIdx(next);
            animateIn(next);
        } else {
            navigation.reset({ index: 0, routes: [{ name: 'SelectAccount' }] });
        }
    };

    const goSkip = () => {
        navigation.reset({ index: 0, routes: [{ name: 'SelectAccount' }] });
    };

    const slide = SLIDES[currentIdx];
    const { text, slide: slideY, scale } = slideAnims[currentIdx];

    const renderItem = ({ item, index }: { item: typeof SLIDES[0]; index: number }) => {
        const anim = slideAnims[index];
        return (
            <View style={{ width }}>
                <Animated.View style={[styles.slideContent, {
                    opacity: anim.text,
                    transform: [{ translateY: anim.slide }, { scale: anim.scale }],
                }]}>
                    {/* Big illustration orb */}
                    <View style={[styles.illustrationOrb, { backgroundColor: item.orbColor + '30' }]}>
                        <View style={[styles.illustrationOrbInner, { backgroundColor: item.orbColor + '50' }]}>
                            <item.illustration color="#fff" size={60} />
                        </View>
                    </View>

                    {/* Label pill */}
                    <View style={styles.labelPill}>
                        <item.icon color="rgba(255,255,255,0.9)" size={14} />
                        <Text style={styles.labelText}>{item.subtitle}</Text>
                    </View>

                    {/* Title */}
                    <Text style={styles.slideTitle}>{item.title}</Text>
                    <Text style={styles.slideDesc}>{item.description}</Text>

                    {/* Feature list */}
                    <View style={styles.featuresList}>
                        {item.features.map((f, fi) => (
                            <Animated.View
                                key={fi}
                                style={[styles.featureRow, {
                                    opacity: anim.text,
                                    transform: [{ translateX: anim.slide }],
                                }]}
                            >
                                <View style={[styles.featureIconWrap, { backgroundColor: item.orbColor + '25' }]}>
                                    <f.icon color="#fff" size={14} />
                                </View>
                                <Text style={styles.featureText}>{f.text}</Text>
                            </Animated.View>
                        ))}
                    </View>
                </Animated.View>
            </View>
        );
    };

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* Full-screen gradient background that transitions with slides */}
            <Animated.View style={StyleSheet.absoluteFillObject}>
                <LinearGradient
                    colors={SLIDES[currentIdx].gradient}
                    style={StyleSheet.absoluteFillObject}
                    start={{ x: 0.2, y: 0 }}
                    end={{ x: 0.8, y: 1 }}
                />
            </Animated.View>

            {/* Decorative circles */}
            <View style={styles.decoCircle1} />
            <View style={styles.decoCircle2} />
            <View style={styles.decoCircle3} />

            {/* Skip button */}
            <View style={styles.topBar}>
                <TouchableOpacity onPress={goSkip} style={styles.skipBtn} activeOpacity={0.8}>
                    <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
                <View style={styles.stepIndicator}>
                    <Text style={styles.stepText}>{currentIdx + 1} / {SLIDES.length}</Text>
                </View>
            </View>

            {/* Slides */}
            <Animated.FlatList
                ref={flatListRef}
                data={SLIDES}
                renderItem={renderItem}
                horizontal
                pagingEnabled
                scrollEnabled={false}
                showsHorizontalScrollIndicator={false}
                keyExtractor={item => item.key}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false }
                )}
                style={{ flex: 1 }}
                contentContainerStyle={{ alignItems: 'center' }}
            />

            {/* Bottom controls */}
            <View style={styles.bottomBar}>
                {/* Dot indicators */}
                <View style={styles.dots}>
                    {SLIDES.map((_, i) => {
                        const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
                        const dotW = scrollX.interpolate({ inputRange, outputRange: [6, 22, 6], extrapolate: 'clamp' });
                        const dotOp = scrollX.interpolate({ inputRange, outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' });
                        return (
                            <Animated.View key={i} style={[styles.dot, { width: dotW, opacity: dotOp }]} />
                        );
                    })}
                </View>

                {/* Next button */}
                <TouchableOpacity onPress={goNext} activeOpacity={0.9}>
                    <View style={styles.nextBtn}>
                        <LinearGradient
                            colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.15)']}
                            style={styles.nextBtnInner}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        >
                            <Text style={styles.nextBtnText}>
                                {currentIdx === SLIDES.length - 1 ? 'Get Started' : 'Next →'}
                            </Text>
                        </LinearGradient>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default OnBoarding;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#1A1F6B' },

    decoCircle1: { position: 'absolute', top: -80, right: -60, width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(255,255,255,0.04)' },
    decoCircle2: { position: 'absolute', top: height * 0.3, left: -80, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.04)' },
    decoCircle3: { position: 'absolute', bottom: -60, right: -40, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.03)' },

    topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 58 : 42, paddingBottom: 10 },
    skipBtn: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    skipText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    stepIndicator: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
    stepText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700' },

    slideContent: { flex: 1, paddingHorizontal: 28, paddingTop: 10, alignItems: 'center', width },

    illustrationOrb: { width: 180, height: 180, borderRadius: 90, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    illustrationOrbInner: { width: 130, height: 130, borderRadius: 65, alignItems: 'center', justifyContent: 'center' },
    illustrationEmoji: { fontSize: 60 },

    labelPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 7, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    labelEmoji: { fontSize: 14 },
    labelText: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '700' },

    slideTitle: { color: '#fff', fontSize: 30, fontWeight: '900', textAlign: 'center', letterSpacing: 0.3, marginBottom: 12 },
    slideDesc: { color: 'rgba(255,255,255,0.65)', fontSize: 14, textAlign: 'center', lineHeight: 21, fontWeight: '500', marginBottom: 28 },

    featuresList: { width: '100%', gap: 10 },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 13, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
    featureIconWrap: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    featureText: { color: '#fff', fontSize: 13, fontWeight: '600', flex: 1 },

    bottomBar: { paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 28, gap: 20 },
    dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7 },
    dot: { height: 6, borderRadius: 3, backgroundColor: '#fff' },
    nextBtn: { overflow: 'hidden', borderRadius: 18, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)' },
    nextBtnInner: { paddingVertical: 17, alignItems: 'center', paddingHorizontal: 40 },
    nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
});