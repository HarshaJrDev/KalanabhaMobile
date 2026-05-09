import React, { useCallback, useState, memo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    StatusBar,
    Dimensions,
    ImageBackground,
    Platform,
    Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    interpolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { User, Truck } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

const { height } = Dimensions.get('window');

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
const FONTS = {
    PRIMARY_BOLD: 'Montserrat-Bold',
    PRIMARY_MEDIUM: 'Montserrat-Medium',
    PRIMARY_SEMIBOLD: 'Montserrat-SemiBold',
} as const;

const TYPOGRAPHY = {
    h1: { fontFamily: FONTS.PRIMARY_BOLD, fontSize: 22 },
    h2: { fontFamily: FONTS.PRIMARY_SEMIBOLD, fontSize: 17 },
    body: { fontFamily: FONTS.PRIMARY_MEDIUM, fontSize: 13 },
    button: { fontFamily: FONTS.PRIMARY_BOLD, fontSize: 16 },
} as const;

const SPACING = { md: 12, lg: 16, xl: 20 } as const;

// ───────────────── DATA ─────────────────
const ACCOUNTS: Account[] = [
    {
        type: 'Customer',
        label: 'Customer',
        description: 'Book shipments and track deliveries.',
        gradient: ['#2B3FD4', '#6366F1'],
    },
    {
        type: 'Driver',
        label: 'Driver',
        description: 'Accept deliveries and earn efficiently.',
        gradient: ['#FF6B2C', '#F59E0B'],
    },
];

const ICONS = { Customer: User, Driver: Truck } as const;

const IMAGES = {
    Customer: 'https://images.pexels.com/photos/4246120/pexels-photo-4246120.jpeg',
    Driver: 'https://images.pexels.com/photos/2199293/pexels-photo-2199293.jpeg',
} as const;

// ───────────────── CARD ─────────────────
type CardProps = {
    item: Account;
    selected: boolean;
    onPress: () => void;
};

const AccountCard = memo(({ item, selected, onPress }: CardProps) => {
    const Icon = ICONS[item.type];

    // shared values (UI thread)
    const scale = useSharedValue(1);
    const rotateX = useSharedValue(0);
    const rotateY = useSharedValue(0);

    // gesture (parallax tilt)
    const gesture = Gesture.Pan()
        .onUpdate(e => {
            rotateX.value = e.translationY / 20;
            rotateY.value = -e.translationX / 20;
        })
        .onEnd(() => {
            rotateX.value = withSpring(0);
            rotateY.value = withSpring(0);
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { perspective: 800 },
            { scale: withSpring(scale.value) },
            { rotateX: `${rotateX.value}deg` },
            { rotateY: `${rotateY.value}deg` },
        ],
    }));

    const handlePressIn = () => {
        scale.value = 0.96;
    };

    const handlePressOut = () => {
        scale.value = 1;
    };

    return (
        <GestureDetector gesture={gesture}>
            <Animated.View style={[styles.card, animatedStyle]}>
                <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
                    <View style={[styles.cardInner, selected && styles.selected]}>
                        {/* Background */}
                        <Image source={{ uri: IMAGES[item.type] }} style={styles.bg} />

                        <LinearGradient
                            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.9)']}
                            style={StyleSheet.absoluteFillObject}
                        />

                        {/* Content */}
                        <View style={styles.row}>
                            <LinearGradient colors={item.gradient} style={styles.icon}>
                                <Icon color="#fff" size={22} />
                            </LinearGradient>

                            <View style={{ flex: 1 }}>
                                <Text style={styles.title}>{item.label}</Text>
                                <Text style={styles.desc}>{item.description}</Text>
                            </View>
                        </View>
                    </View>
                </Pressable>
            </Animated.View>
        </GestureDetector>
    );
});

// ───────────────── SCREEN ─────────────────
const SelectAccount = () => {
    const navigation = useNavigation<NavProp>();
    const [selected, setSelected] = useState<AccountType | null>(null);

    const handleContinue = useCallback(() => {
        if (!selected) return;
        navigation.navigate('Login', { isDriver: selected === 'Driver' });
    }, [selected]);

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" translucent />

            <ImageBackground
                source={{ uri: 'https://images.pexels.com/photos/1427107/pexels-photo-1427107.jpeg' }}
                style={StyleSheet.absoluteFillObject}
                blurRadius={18}
            />

            <LinearGradient
                colors={['rgba(10,12,50,0.6)', 'rgba(10,12,50,0.95)']}
                style={StyleSheet.absoluteFillObject}
            />

            <View style={styles.header}>
                <Text style={styles.brand}>Kalanabha Logistics</Text>
                <Text style={styles.tagline}>Move Anything, Anywhere</Text>
            </View>

            <View>
                {ACCOUNTS.map(item => (
                    <AccountCard
                        key={item.type}
                        item={item}
                        selected={selected === item.type}
                        onPress={() => setSelected(item.type)}
                    />
                ))}
            </View>

            <Pressable disabled={!selected} onPress={handleContinue}>
                <LinearGradient
                    colors={
                        selected
                            ? ACCOUNTS.find(a => a.type === selected)!.gradient
                            : ['#444', '#666']
                    }
                    style={[styles.button, { opacity: selected ? 1 : 0.5 }]}
                >
                    <Text style={styles.buttonText}>
                        Continue {selected ? `as ${selected}` : ''}
                    </Text>
                </LinearGradient>
            </Pressable>
        </View>
    );
};

export default SelectAccount;

// ───────────────── STYLES ─────────────────
const styles = StyleSheet.create({
    root: {
        flex: 1,
        justifyContent: 'space-between',
        padding: SPACING.xl,
    },

    header: {
        marginTop: Platform.OS === 'ios' ? 90 : 70,
        alignItems: 'center',
    },

    brand: { ...TYPOGRAPHY.h1, color: '#fff' },
    tagline: { ...TYPOGRAPHY.body, color: '#aaa' },

    card: {
        marginBottom: SPACING.md,
    },

    cardInner: {
        borderRadius: 18,
        padding: SPACING.lg,
        overflow: 'hidden',
    },

    selected: {
        borderWidth: 1,
        borderColor: '#fff',
    },

    bg: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.25,
    },

    row: {
        flexDirection: 'row',
        gap: SPACING.md,
    },

    icon: {
        width: 52,
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },

    title: { ...TYPOGRAPHY.h2, color: '#fff' },
    desc: { ...TYPOGRAPHY.body, color: '#ccc' },

    button: {
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
    },

    buttonText: { ...TYPOGRAPHY.button, color: '#fff' },
});