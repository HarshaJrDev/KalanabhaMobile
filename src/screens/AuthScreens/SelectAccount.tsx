import React, { useCallback, useMemo, useState, memo } from 'react';
import { View, Text, Image, StyleSheet, Pressable, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
    FadeInDown,
    FadeInUp,
    ZoomIn,
    ZoomOut,
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { Check, ArrowLeft, ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAppTheme } from '@theme/ThemeContext';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'SelectAccount'>;
type AccountType = 'Customer' | 'Driver';

interface Account {
    type: AccountType;
    label: string;
    description: string;
}

// Re-themed to Kalanabha's light brand surface (was a dark navy/purple
// gradient screen) — same two-card selection + Reanimated press/entrance
// behavior and the exact same navigation.navigate('Login', { isDriver })
// call underneath, untouched.
const ACCOUNTS: Account[] = [
    { type: 'Customer', label: "I'm a Customer", description: 'Book delivery or send packages' },
    { type: 'Driver', label: "I'm a Driver", description: 'Deliver packages & earn money' },
];

// User-supplied K-mascot illustrations (real transparent PNGs, same
// brand-art family as the onboarding slides) — one full-color image per
// role, shown as-is rather than tinted, since these already carry the
// brand's own color palette.
const ACCOUNT_IMAGES = {
    Customer: require('../../../assets/images/home/ImaCustomer.png'),
    Driver: require('../../../assets/images/home/ImaDriver.png'),
} as const;

type Styles = ReturnType<typeof makeStyles>;

interface CardProps {
    item: Account;
    index: number;
    selected: boolean;
    onPress: () => void;
    styles: Styles;
}

const AccountCard = memo(({ item, index, selected, onPress, styles }: CardProps) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    return (
        <Animated.View
            entering={FadeInDown.delay(120 + index * 90).duration(400).springify().damping(16)}
            style={animatedStyle}
        >
            <Pressable
                onPress={onPress}
                onPressIn={() => { scale.value = withSpring(0.97, { damping: 18, stiffness: 260 }); }}
                onPressOut={() => { scale.value = withSpring(1, { damping: 18, stiffness: 260 }); }}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`${item.label} account`}
                style={[styles.card, selected && styles.cardSelected]}
            >
                <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
                    <Image
                        source={ACCOUNT_IMAGES[item.type]}
                        resizeMode="contain"
                        style={styles.iconImage}
                    />
                </View>

                <View style={styles.cardText}>
                    <Text style={styles.title}>{item.label}</Text>
                    <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
                </View>

                {/* The whole card is already the tap target — this is a
                    small "selected" badge, not a form control, so it only
                    ever appears (with a pop-in/pop-out) once a card is
                    chosen rather than sitting there unselected the whole
                    time like a radio button. */}
                {selected && (
                    <Animated.View
                        entering={ZoomIn.springify().damping(12).stiffness(220)}
                        exiting={ZoomOut.duration(150)}
                        style={styles.selectedBadge}
                    >
                        <Check color="#fff" size={13} strokeWidth={3} />
                    </Animated.View>
                )}
            </Pressable>
        </Animated.View>
    );
});

const SelectAccount = () => {
    const navigation = useNavigation<NavProp>();
    const { colors, fonts, fontSize, spacing, radius, isDark } = useAppTheme();
    const styles = useMemo(() => makeStyles(colors, fonts, fontSize, spacing, radius), [colors, fonts, fontSize, spacing, radius]);
    const [selected, setSelected] = useState<AccountType | null>(null);

    const buttonScale = useSharedValue(1);
    const buttonAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: buttonScale.value }],
        opacity: withTiming(selected ? 1 : 0.5, { duration: 200 }),
    }));

    const handleSelect = useCallback((type: AccountType) => setSelected(type), []);

    const handleContinue = useCallback(() => {
        if (!selected) return;
        navigation.navigate('Login', { isDriver: selected === 'Driver' });
    }, [selected, navigation]);

    return (
        <View style={styles.root}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.BACKGROUND} />

            <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
                <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
                    <ArrowLeft color={colors.TEXT_PRIMARY} size={22} />
                </Pressable>

                <View style={styles.content}>
                    <Animated.Text entering={FadeInUp.duration(400)} style={styles.title1}>
                        Choose your type
                    </Animated.Text>
                    <Animated.Text entering={FadeInUp.delay(60).duration(400)} style={styles.subtitle}>
                        to continue
                    </Animated.Text>

                    <View style={styles.cardList}>
                        {ACCOUNTS.map((item, index) => (
                            <AccountCard
                                key={item.type}
                                item={item}
                                index={index}
                                selected={selected === item.type}
                                onPress={() => handleSelect(item.type)}
                                styles={styles}
                            />
                        ))}
                    </View>
                </View>

                <Animated.View entering={FadeInUp.delay(260).duration(450)}>
                    <Pressable
                        disabled={!selected}
                        onPress={handleContinue}
                        onPressIn={() => { if (selected) buttonScale.value = withSpring(0.98, { damping: 18, stiffness: 260 }); }}
                        onPressOut={() => { buttonScale.value = withSpring(1, { damping: 18, stiffness: 260 }); }}
                        hitSlop={8}
                    >
                        <Animated.View style={[styles.button, buttonAnimatedStyle]}>
                            <Text style={styles.buttonText}>
                                {selected ? `Continue as ${selected}` : 'Select an account type'}
                            </Text>
                            {selected && <ChevronRight color="#fff" size={18} strokeWidth={2.5} />}
                        </Animated.View>
                    </Pressable>
                </Animated.View>
            </SafeAreaView>
        </View>
    );
};

export default SelectAccount;

// Computed from useAppTheme() so this screen (and the AccountCard it feeds
// styles to) repaints correctly in dark mode.
const makeStyles = (
    colors: ReturnType<typeof useAppTheme>['colors'],
    fonts: ReturnType<typeof useAppTheme>['fonts'],
    fontSize: ReturnType<typeof useAppTheme>['fontSize'],
    spacing: ReturnType<typeof useAppTheme>['spacing'],
    radius: ReturnType<typeof useAppTheme>['radius'],
) => StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.BACKGROUND },
    safe: { flex: 1, paddingHorizontal: spacing.xl, justifyContent: 'space-between' },

    backBtn: {
        marginTop: Platform.OS === 'ios' ? spacing.md : spacing.lg,
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.SURFACE,
        borderWidth: 1,
        borderColor: colors.BORDER,
    },

    content: { flex: 1, justifyContent: 'center' },
    title1: { fontFamily: fonts.BOLD_PRIMARY, fontSize: 26, color: colors.TEXT_PRIMARY, textAlign: 'center' },
    subtitle: {
        fontFamily: fonts.MEDIUM_PRIMARY,
        fontSize: fontSize.lg,
        color: colors.TEXT_SECONDARY,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },

    cardList: { gap: spacing.md },

    card: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: radius.lg,
        padding: spacing.lg,
        backgroundColor: colors.SURFACE,
        borderWidth: 1.5,
        borderColor: colors.BORDER,
        gap: spacing.md,
        position: 'relative',
    },
    cardSelected: {
        borderColor: colors.PRIMARY,
        borderWidth: 2,
        backgroundColor: colors.PRIMARY_LIGHT,
    },

    iconWrap: {
        width: 68,
        height: 68,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.BACKGROUND,
        overflow: 'hidden',
    },
    iconWrapSelected: { backgroundColor: colors.PRIMARY_LIGHT },
    iconImage: { width: 60, height: 60 },

    cardText: { flex: 1, gap: 3 },
    title: { fontFamily: fonts.SEMI_BOLD_PRIMARY, fontSize: fontSize.xl, color: colors.TEXT_PRIMARY },
    desc: { fontFamily: fonts.MEDIUM_PRIMARY, fontSize: fontSize.sm, color: colors.TEXT_SECONDARY, lineHeight: 17 },

    selectedBadge: {
        position: 'absolute',
        top: -8,
        right: -8,
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: colors.PRIMARY,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: colors.BACKGROUND,
        shadowColor: colors.PRIMARY,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },

    button: {
        flexDirection: 'row',
        borderRadius: radius.md,
        paddingVertical: 17,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginBottom: spacing.sm,
        backgroundColor: colors.PRIMARY,
    },
    buttonText: { fontFamily: fonts.BOLD_PRIMARY, fontSize: fontSize.xl, color: '#fff' },
});
