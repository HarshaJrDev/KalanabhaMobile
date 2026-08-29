import React, { useCallback, useState, memo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    StatusBar,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
    FadeInDown,
    FadeInUp,
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { User, Truck, Check, ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

// ───────────────── TYPES ─────────────────
type NavProp = NativeStackNavigationProp<RootStackParamList, 'SelectAccount'>;
type AccountType = 'Customer' | 'Driver';

type Account = {
    type: AccountType;
    label: string;
    description: string;
    gradient: readonly [string, string];
};

// ───────────────── DESIGN SYSTEM ─────────────────
const COLORS = {
    bgTop: '#0B1130',
    bgBottom: '#050714',
    card: 'rgba(255,255,255,0.06)',
    cardBorder: 'rgba(255,255,255,0.10)',
    white: '#FFFFFF',
    muted: 'rgba(255,255,255,0.56)',
    faint: 'rgba(255,255,255,0.38)',
} as const;

const FONTS = {
    PRIMARY_BOLD: 'Montserrat-Bold',
    PRIMARY_MEDIUM: 'Montserrat-Medium',
    PRIMARY_SEMIBOLD: 'Montserrat-SemiBold',
} as const;

const TYPOGRAPHY = {
    h1: { fontFamily: FONTS.PRIMARY_BOLD, fontSize: 24 },
    tagline: { fontFamily: FONTS.PRIMARY_MEDIUM, fontSize: 13 },
    h2: { fontFamily: FONTS.PRIMARY_SEMIBOLD, fontSize: 16 },
    body: { fontFamily: FONTS.PRIMARY_MEDIUM, fontSize: 13 },
    button: { fontFamily: FONTS.PRIMARY_BOLD, fontSize: 16 },
} as const;

const SPACING = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 } as const;

// ───────────────── DATA ─────────────────
const ACCOUNTS: Account[] = [
    {
        type: 'Customer',
        label: 'Customer',
        description: 'Book shipments and track deliveries in real time.',
        gradient: ['#4F5BFF', '#6D28D9'],
    },
    {
        type: 'Driver',
        label: 'Driver',
        description: 'Accept trips, deliver, and earn on your schedule.',
        gradient: ['#FF7A45', '#F59E0B'],
    },
];

const ICONS = { Customer: User, Driver: Truck } as const;

// ───────────────── CARD ─────────────────
type CardProps = {
    item: Account;
    index: number;
    selected: boolean;
    onPress: () => void;
};

const AccountCard = memo(({ item, index, selected, onPress }: CardProps) => {
    const Icon = ICONS[item.type];
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.97, { damping: 18, stiffness: 260 });
    };
    const handlePressOut = () => {
        scale.value = withSpring(1, { damping: 18, stiffness: 260 });
    };

    return (
        <Animated.View
            entering={FadeInDown.delay(150 + index * 90).duration(450).springify().damping(16)}
            style={animatedStyle}
        >
            <Pressable
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                android_ripple={{ color: 'rgba(255,255,255,0.08)' }}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`${item.label} account`}
                style={[styles.cardInner, selected && styles.cardInnerSelected]}
            >
                <LinearGradient colors={item.gradient} style={styles.icon}>
                    <Icon color={COLORS.white} size={22} strokeWidth={2.25} />
                </LinearGradient>

                <View style={styles.cardText}>
                    <Text style={styles.title}>{item.label}</Text>
                    <Text style={styles.desc} numberOfLines={2}>
                        {item.description}
                    </Text>
                </View>

                <View style={[styles.radio, selected && styles.radioSelected]}>
                    {selected && <Check color={COLORS.white} size={13} strokeWidth={3} />}
                </View>
            </Pressable>
        </Animated.View>
    );
});

// ───────────────── SCREEN ─────────────────
const SelectAccount = () => {
    const navigation = useNavigation<NavProp>();
    const [selected, setSelected] = useState<AccountType | null>(null);

    const buttonScale = useSharedValue(1);
    const buttonAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: buttonScale.value }],
        opacity: withTiming(selected ? 1 : 0.45, { duration: 200 }),
    }));

    const handleSelect = useCallback((type: AccountType) => {
        setSelected(type);
    }, []);

    const handleContinue = useCallback(() => {
        if (!selected) return;
        navigation.navigate('Login', { isDriver: selected === 'Driver' });
    }, [selected, navigation]);

    const activeGradient = selected
        ? ACCOUNTS.find(a => a.type === selected)!.gradient
        : (['#2A2E45', '#2A2E45'] as const);

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <LinearGradient
                colors={[COLORS.bgTop, COLORS.bgBottom]}
                style={StyleSheet.absoluteFillObject}
            />

            <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
                <Animated.View
                    entering={FadeInUp.duration(500).springify().damping(18)}
                    style={styles.header}
                >
                    <Text style={styles.brand}>Kalanabha Logistics</Text>
                    <Text style={styles.tagline}>Move Anything, Anywhere</Text>
                </Animated.View>

                <View style={styles.content}>
                    <Animated.Text
                        entering={FadeInDown.delay(80).duration(400)}
                        style={styles.prompt}
                    >
                        How will you be using the app?
                    </Animated.Text>

                    <View style={styles.cardList}>
                        {ACCOUNTS.map((item, index) => (
                            <AccountCard
                                key={item.type}
                                item={item}
                                index={index}
                                selected={selected === item.type}
                                onPress={() => handleSelect(item.type)}
                            />
                        ))}
                    </View>
                </View>

                <Animated.View entering={FadeInUp.delay(260).duration(450)}>
                    <Pressable
                        disabled={!selected}
                        onPress={handleContinue}
                        onPressIn={() => {
                            if (selected) buttonScale.value = withSpring(0.98, { damping: 18, stiffness: 260 });
                        }}
                        onPressOut={() => {
                            buttonScale.value = withSpring(1, { damping: 18, stiffness: 260 });
                        }}
                        hitSlop={8}
                    >
                        <Animated.View style={buttonAnimatedStyle}>
                            <LinearGradient
                                colors={activeGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.button}
                            >
                                <Text style={styles.buttonText}>
                                    {selected ? `Continue as ${selected}` : 'Select an account type'}
                                </Text>
                                {selected && <ChevronRight color={COLORS.white} size={18} strokeWidth={2.5} />}
                            </LinearGradient>
                        </Animated.View>
                    </Pressable>
                </Animated.View>
            </SafeAreaView>
        </View>
    );
};

export default SelectAccount;

// ───────────────── STYLES ─────────────────
const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: COLORS.bgBottom },
    safe: {
        flex: 1,
        paddingHorizontal: SPACING.xl,
        justifyContent: 'space-between',
    },

    header: {
        alignItems: 'center',
        marginTop: Platform.OS === 'ios' ? SPACING.xl : SPACING.xxl,
        marginBottom: SPACING.lg,
    },
    brand: { ...TYPOGRAPHY.h1, color: COLORS.white, letterSpacing: 0.2 },
    tagline: { ...TYPOGRAPHY.tagline, color: COLORS.muted, marginTop: 4 },

    content: { flex: 1, justifyContent: 'center' },
    prompt: {
        ...TYPOGRAPHY.h2,
        color: COLORS.white,
        marginBottom: SPACING.lg,
        textAlign: 'center',
    },

    cardList: { gap: SPACING.md },

    cardInner: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 18,
        padding: SPACING.md,
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        gap: SPACING.md,
    },
    cardInnerSelected: {
        borderColor: 'rgba(255,255,255,0.55)',
        backgroundColor: 'rgba(255,255,255,0.10)',
    },

    icon: {
        width: 50,
        height: 50,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },

    cardText: { flex: 1, gap: 3 },
    title: { ...TYPOGRAPHY.h2, color: COLORS.white },
    desc: { ...TYPOGRAPHY.body, color: COLORS.faint, lineHeight: 17 },

    radio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioSelected: {
        borderColor: 'transparent',
        backgroundColor: '#22C55E',
    },

    button: {
        flexDirection: 'row',
        borderRadius: 16,
        paddingVertical: 17,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginBottom: SPACING.sm,
    },
    buttonText: { ...TYPOGRAPHY.button, color: COLORS.white },
});
