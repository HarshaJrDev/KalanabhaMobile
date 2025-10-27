import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    ImageBackground,
    Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import FONTS from '../../utils/fonts';
import { Truck, User } from 'lucide-react-native';
import Logger from '../../utils/logger';

type SelectAccountScreenProp = NativeStackNavigationProp<RootStackParamList, 'SelectAccount'>;

const { width, height } = Dimensions.get('window');
const BOX_WIDTH = width * 0.8;

const ACCOUNTS = [
    {
        type: 'Customer' as const,
        icon: User,
        description: 'Order shipments, track deliveries, and manage your logistics easily.',
    },
    {
        type: 'Driver' as const,
        icon: Truck,
        description: 'Receive delivery requests, update statuses, and earn by delivering.',
    },
];

const THEME_COLOR = '#F25912';

const SelectAccount = () => {
    const navigation = useNavigation<SelectAccountScreenProp>();
    const [selected, setSelected] = useState<typeof ACCOUNTS[number]['type'] | null>(null);
    const scaleAnim = useRef(ACCOUNTS.map(() => new Animated.Value(1))).current;

    const handleSelect = (index: number, accountType: typeof ACCOUNTS[number]['type']) => {
        setSelected(accountType);
        Logger.debug(`Selected account type: ${accountType}`);
        Animated.sequence([
            Animated.spring(scaleAnim[index], { toValue: 1.05, useNativeDriver: true }),
            Animated.spring(scaleAnim[index], { toValue: 1, useNativeDriver: true }),
        ]).start();
    };

    const handleContinue = () => {
        if (!selected) return;
        navigation.navigate('OnBoarding');
        Logger.debug(`Navigated to OnBoarding as ${selected}`);
    };

    return (
        <ImageBackground
            source={{ uri: 'https://images.pexels.com/photos/9603487/pexels-photo-9603487.jpeg' }}
            style={styles.background}
            blurRadius={20}
        >
            <View style={styles.overlay} />

            <Text style={styles.headerTitle}>Welcome to Kalanabha Logistics</Text>
            <Text style={styles.subHeader}>Select your account type to get started</Text>

            <View style={styles.boxContainer}>
                {ACCOUNTS.map((account, index) => {
                    const IconComponent = account.icon;
                    const isActive = selected === account.type;

                    return (
                        <TouchableOpacity
                            key={account.type}
                            activeOpacity={0.9}
                            onPress={() => handleSelect(index, account.type)}
                        >
                            <Animated.View
                                style={[
                                    styles.box,
                                    {
                                        borderColor: isActive ? THEME_COLOR : '#fff',
                                        backgroundColor: isActive ? `${THEME_COLOR}20` : 'rgba(255,255,255,0.15)',
                                        transform: [{ scale: scaleAnim[index] }],
                                    },
                                ]}
                            >
                                <View
                                    style={[
                                        styles.iconCircle,
                                        { backgroundColor: isActive ? THEME_COLOR : 'rgba(255,255,255,0.2)' },
                                    ]}
                                >
                                    <IconComponent color="#fff" width={36} height={36} />
                                </View>
                                <Text style={styles.boxText}>{account.type}</Text>
                                <Text style={styles.boxDescription}>{account.description}</Text>
                            </Animated.View>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {selected && (
                <TouchableOpacity
                    style={styles.continueButton}
                    onPress={handleContinue}
                    activeOpacity={0.85}
                >
                    <Text style={styles.continueText}>Continue</Text>
                </TouchableOpacity>
            )}
        </ImageBackground>
    );
};

export default SelectAccount;

const styles = StyleSheet.create({
    background: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#00000055',
    },
    headerTitle: {
        position: 'absolute',
        top: 100,
        fontFamily: FONTS.BOLD_PRIMARY,
        fontSize: 32,
        color: '#fff',
        textAlign: 'center',
        paddingHorizontal: 16,
    },
    subHeader: {
        position: 'absolute',
        top: 250,
        fontFamily: FONTS.MEDIUM_PRIMARY,
        fontSize: 16,
        color: '#fff',
        textAlign: 'center',
        paddingHorizontal: 32,
    },
    boxContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 150,
        gap: 20,
    },
    box: {
        width: BOX_WIDTH,
        borderWidth: 2,
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',

    },
    iconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    boxText: {
        fontFamily: FONTS.BOLD_PRIMARY,
        fontSize: 22,
        color: '#fff',
        marginBottom: 6,
    },
    boxDescription: {
        fontFamily: FONTS.PRIMARY,
        fontSize: 14,
        color: '#fff',
        textAlign: 'center',
    },
    continueButton: {
        position: 'absolute',
        bottom: 40,
        width: BOX_WIDTH,
        backgroundColor: THEME_COLOR,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 8,
        elevation: 8,
    },
    continueText: {
        fontFamily: FONTS.BOLD_PRIMARY,
        fontSize: 18,
        color: '#fff',
    },
});
