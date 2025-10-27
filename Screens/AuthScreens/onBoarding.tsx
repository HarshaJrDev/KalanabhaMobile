import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Dimensions,
    TouchableOpacity,
    ImageBackground,
    Animated,
} from 'react-native';
import { Truck, Box } from 'lucide-react-native';
import FONTS from '../../utils/fonts';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import Logger from '../../utils/logger';
import COLOR from '../../utils/color';

type OnBoardingScreenProp = NativeStackNavigationProp<RootStackParamList, 'OnBoarding'>;

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9;
const CARD_HEIGHT = height * 0.65;

interface OnBoardingItem {
    key: string;
    title: string;
    description: string;
    icon?: 'truck' | 'box';
    image: string;
}

const ONBOARDING_DATA: OnBoardingItem[] = [
    {
        key: '1',
        title: 'Fast Delivery',
        description: 'We ensure your goods reach quickly and safely.',
        icon: 'truck',
        image: 'https://images.pexels.com/photos/9603487/pexels-photo-9603487.jpeg',
    },
    {
        key: '2',
        title: 'Supply Chain',
        description: 'Efficient and transparent supply chain management.',
        icon: 'box',
        image: 'https://images.pexels.com/photos/9603487/pexels-photo-9603487.jpeg',
    },
    {
        key: '3',
        title: 'Smart Logistics',
        description: 'Tracking and managing your shipments effortlessly.',
        icon: 'truck',
        image: 'https://images.pexels.com/photos/9603487/pexels-photo-9603487.jpeg',
    },
];

const OnBoarding = () => {
    const navigation = useNavigation<OnBoardingScreenProp>();
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;
    const flatListRef = useRef<FlatList>(null);

    const handleNext = () => {
        if (currentIndex < ONBOARDING_DATA.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
            Logger.debug('Completed OnBoarding');
        }
    };

    const handleSkip = () => {
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        Logger.debug('Skipped OnBoarding');
    };

    const renderItem = ({ item }: { item: OnBoardingItem }) => {
        const IconComponent = item.icon === 'truck' ? Truck : Box;

        return (
            <View style={[styles.cardWrapper, { width }]}>
                <ImageBackground
                    source={{ uri: item.image }}
                    style={styles.card}
                    imageStyle={{ borderRadius: 24 }}
                >
                    <View style={styles.overlay} />
                    <View style={styles.iconCircle}>
                        <IconComponent color="#fff" width={36} height={36} />
                    </View>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.description}>{item.description}</Text>
                </ImageBackground>
            </View>
        );
    };

    const renderPagination = () => {
        return (
            <View style={styles.pagination}>
                {ONBOARDING_DATA.map((_, i) => {
                    const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
                    const dotWidth = scrollX.interpolate({
                        inputRange,
                        outputRange: [8, 24, 8],
                        extrapolate: 'clamp',
                    });
                    const opacity = scrollX.interpolate({
                        inputRange,
                        outputRange: [0.3, 1, 0.3],
                        extrapolate: 'clamp',
                    });
                    return <Animated.View key={i.toString()} style={[styles.dot, { width: dotWidth, opacity }]} />;
                })}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Animated.FlatList
                ref={flatListRef}
                data={ONBOARDING_DATA}
                renderItem={renderItem}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false }
                )}
                onMomentumScrollEnd={(event) => {
                    const index = Math.round(event.nativeEvent.contentOffset.x / width);
                    setCurrentIndex(index);
                }}
                keyExtractor={(item) => item.key}
            />

            {renderPagination()}

            <View style={styles.buttonContainer}>
                <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                    <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
                    <Text style={styles.nextText}>{currentIndex === ONBOARDING_DATA.length - 1 ? 'Start' : 'Next'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default OnBoarding;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLOR.PRIMARY
    },
    cardWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 24,
        justifyContent: 'flex-end',
        padding: 24,
        overflow: 'hidden',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.35)',
        borderRadius: 24,
    },
    iconCircle: {
        position: 'absolute',
        top: 30,
        alignSelf: 'center',
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontFamily: FONTS.BOLD_PRIMARY,
        fontSize: 26,
        color: '#fff',
        textAlign: 'center',
        marginBottom: 12,
    },
    description: {
        fontFamily: FONTS.PRIMARY,
        fontSize: 16,
        color: '#fff',
        textAlign: 'center',
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginVertical: 16,
        gap: 8,
    },
    dot: {
        height: 8,
        borderRadius: 4,
        backgroundColor: '#fff',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 32,
        paddingBottom: 32,
    },
    skipButton: {},
    skipText: {
        color: '#fff',
        fontFamily: FONTS.MEDIUM_PRIMARY,
        fontSize: 16,
    },
    nextButton: {
        backgroundColor: '#fff',
        borderRadius: 24,
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    nextText: {
        color: '#000',
        fontFamily: FONTS.BOLD_PRIMARY,
        fontSize: 16,
    },
});
