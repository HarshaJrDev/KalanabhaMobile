import React, { useCallback, useMemo, useState, memo } from 'react';
import { View, Text, Image, StyleSheet, Pressable, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Truck, ArrowLeft, ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAppTheme } from '@theme/ThemeContext';
import { useTranslation } from 'react-i18next';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'SelectAccount'>;
type AccountType = 'Customer' | 'Driver';

interface Account {
    type: AccountType;
    label: string;
    description: string;
}

// Re-themed to Kalanabha's light brand surface (was a dark navy/purple
// gradient screen). No entrance/press animations — plain state-driven
// styling — and the same navigation.navigate('Login', { isDriver }) call
// underneath, untouched.
const makeAccounts = (t: (key: string) => string): Account[] => [
    { type: 'Customer', label: t('selectAccount.customerLabel'), description: t('selectAccount.customerDesc') },
    { type: 'Driver', label: t('selectAccount.driverLabel'), description: t('selectAccount.driverDesc') },
];

// User-supplied K-mascot illustrations (real transparent PNGs, same
// brand-art family as the onboarding slides) — one full-color image per
// role, shown as-is rather than tinted, since these already carry the
// brand's own color palette.
const ACCOUNT_IMAGES = {
    Customer: require('../../../assets/images/home/ImaCustomer.png'),
    Driver: require('../../../assets/images/home/ImaDriver.png'),
} as const;

// Small supplementary role glyph shown next to the title — separate from
// the big bleed illustration, matching the brand mockup's own layout.
const ROLE_ICONS = { Customer: User, Driver: Truck } as const;

type Styles = ReturnType<typeof makeStyles>;

interface CardProps {
    item: Account;
    selected: boolean;
    onPress: () => void;
    styles: Styles;
    roleIconColor: string;
}

const AccountCard = memo(({ item, selected, onPress, styles, roleIconColor }: CardProps) => {
    const RoleIcon = ROLE_ICONS[item.type];

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`${item.label} account`}
            style={[styles.card, selected && styles.cardSelected]}
        >
            {/* Full-bleed illustration, not a small boxed icon — the
                brand's own K-mascot art scaled up and clipped by the
                card's rounded left edge, matching the reference
                mockup's layout. */}
            <View style={styles.bleedWrap}>
                <Image source={ACCOUNT_IMAGES[item.type]} resizeMode="contain" style={styles.bleedImage} />
            </View>

            <View style={styles.cardBody}>
                <View style={[styles.roleBadge, selected && styles.roleBadgeSelected]}>
                    <RoleIcon color={selected ? '#fff' : roleIconColor} size={16} strokeWidth={2.2} />
                </View>
                <Text style={styles.title}>{item.label}</Text>
                <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
            </View>

            {/* The whole card is already the tap target — this ring stays
                visible on both cards (so the pair reads as a real choice,
                per the reference); its dot just shows/hides on selection,
                no animation. */}
            <View style={[styles.radioRing, selected && styles.radioRingSelected]}>
                {selected && <View style={styles.radioDot} />}
            </View>
        </Pressable>
    );
});

const SelectAccount = () => {
    const navigation = useNavigation<NavProp>();
    const { colors, fonts, fontSize, spacing, radius, isDark } = useAppTheme();
    const { t } = useTranslation();
    const styles = useMemo(() => makeStyles(colors, fonts, fontSize, spacing, radius), [colors, fonts, fontSize, spacing, radius]);
    const ACCOUNTS = useMemo(() => makeAccounts(t), [t]);
    const [selected, setSelected] = useState<AccountType | null>(null);

    const handleSelect = useCallback((type: AccountType) => setSelected(type), []);

    const handleContinue = useCallback(() => {
        if (!selected) return;
        navigation.navigate('Login', { isDriver: selected === 'Driver' });
    }, [selected, navigation]);

    return (
        <View style={styles.root}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.BACKGROUND} />
            {/* Decorative brand watermark, matching the reference mockup's
                top-right corner accent — purely visual, no touch target. */}
            <View style={styles.decorWatermark} pointerEvents="none" />

            <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
                <View style={styles.topBar}>
                    <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
                        <ArrowLeft color={colors.TEXT_PRIMARY} size={22} />
                    </Pressable>
                    <View style={styles.brandRow}>
                        <View style={styles.brandMark}>
                            <Text style={styles.brandMarkText}>K</Text>
                        </View>
                        <Text style={styles.brandName}>Kalanabha</Text>
                    </View>
                    <View style={styles.topBarSpacer} />
                </View>

                <View style={styles.content}>
                    <Text style={styles.title1}>
                        {t('selectAccount.chooseYourType')}
                    </Text>
                    <Text style={styles.subtitle}>
                        {t('selectAccount.toContinue')}
                    </Text>

                    <View style={styles.cardList}>
                        {ACCOUNTS.map((item) => (
                            <AccountCard
                                key={item.type}
                                item={item}
                                selected={selected === item.type}
                                onPress={() => handleSelect(item.type)}
                                styles={styles}
                                roleIconColor={colors.PRIMARY}
                            />
                        ))}
                    </View>
                </View>

                <Pressable disabled={!selected} onPress={handleContinue} hitSlop={8}>
                    <View style={[styles.button, !selected && styles.buttonDisabled]}>
                        <Text style={styles.buttonText}>
                            {selected ? t('selectAccount.continueAs', { type: selected === 'Customer' ? t('selectAccount.typeCustomer') : t('selectAccount.typeDriver') }) : t('selectAccount.selectAccountType')}
                        </Text>
                        {selected && <ChevronRight color="#fff" size={18} strokeWidth={2.5} />}
                    </View>
                </Pressable>
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
    root: { flex: 1, backgroundColor: colors.BACKGROUND, overflow: 'hidden' },
    safe: { flex: 1, paddingHorizontal: spacing.xl, justifyContent: 'space-between' },

    decorWatermark: {
        position: 'absolute',
        top: -50,
        right: -60,
        width: 200,
        height: 200,
        borderRadius: 44,
        backgroundColor: colors.PRIMARY,
        opacity: 0.06,
        transform: [{ rotate: '24deg' }],
    },

    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: Platform.OS === 'ios' ? spacing.md : spacing.lg,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.SURFACE,
        borderWidth: 1,
        borderColor: colors.BORDER,
    },
    topBarSpacer: { width: 40 },
    brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    brandMark: {
        width: 30, height: 30, borderRadius: 9, backgroundColor: colors.PRIMARY,
        alignItems: 'center', justifyContent: 'center',
    },
    brandMarkText: { color: '#fff', fontSize: 15, fontFamily: fonts.BOLD_PRIMARY },
    brandName: { color: colors.PRIMARY, fontSize: fontSize.lg, fontFamily: fonts.BOLD_PRIMARY },

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
        alignItems: 'stretch',
        borderRadius: radius.lg,
        backgroundColor: colors.SURFACE,
        borderWidth: 1.5,
        borderColor: colors.BORDER,
        position: 'relative',
        overflow: 'hidden',
        minHeight: 132,
    },
    cardSelected: {
        borderColor: colors.PRIMARY,
        borderWidth: 2,
        backgroundColor: colors.PRIMARY_LIGHT,
    },

    // Full-bleed illustration column — clipped by the card's own rounded
    // corner rather than boxed in a small icon chip, matching the
    // reference mockup. The image is deliberately larger than its wrap
    // and centered, so it bleeds/crops at the edges instead of shrinking
    // to fit with visible padding.
    bleedWrap: {
        width: 128,
        backgroundColor: colors.BACKGROUND,
        alignItems: 'center',
        justifyContent: 'flex-end',
        overflow: 'hidden',
    },
    bleedImage: { width: 168, height: 168, marginBottom: -14 },

    cardBody: { flex: 1, paddingVertical: spacing.md, paddingHorizontal: spacing.md, paddingRight: spacing.xl, justifyContent: 'center', gap: 3 },
    roleBadge: {
        width: 30, height: 30, borderRadius: 9,
        backgroundColor: colors.PRIMARY_LIGHT,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 6,
    },
    roleBadgeSelected: { backgroundColor: colors.PRIMARY },
    title: { fontFamily: fonts.SEMI_BOLD_PRIMARY, fontSize: fontSize.xl, color: colors.TEXT_PRIMARY },
    desc: { fontFamily: fonts.MEDIUM_PRIMARY, fontSize: fontSize.sm, color: colors.TEXT_SECONDARY, lineHeight: 17 },

    // Ring stays visible on both cards, unselected or not (reads as a real
    // pair of choices, like the reference) — only its fill pops in/out.
    radioRing: {
        position: 'absolute',
        top: spacing.md,
        right: spacing.md,
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 1.5,
        borderColor: colors.BORDER,
        backgroundColor: colors.SURFACE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioRingSelected: { borderColor: colors.PRIMARY },
    radioDot: { width: 11, height: 11, borderRadius: 5.5, backgroundColor: colors.PRIMARY },

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
    buttonDisabled: { opacity: 0.5 },
    buttonText: { fontFamily: fonts.BOLD_PRIMARY, fontSize: fontSize.xl, color: '#fff' },
});
