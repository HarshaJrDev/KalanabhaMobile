import React, { useRef, useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    Dimensions,
    Animated,
    ScrollView,
    NativeSyntheticEvent,
    NativeScrollEvent,
} from 'react-native';
import { H, W, RF } from '../utils/responsive';
import FONTS from '../utils/fonts';
import Button from '../components/Button';

const { width } = Dimensions.get('window');

const trucks = [
    {
        id: 1,
        name: 'Mini Truck',
        image: { uri: 'https://etimg.etb2bimg.com/photo/122438108.cms' },
        capacity: '800 kg',
        length: '8 ft',
        pricePerKm: '₹18 / km',
        description: 'Perfect for small local deliveries.',
    },
    {
        id: 2,
        name: 'Pickup Truck',
        image: { uri: 'https://etimg.etb2bimg.com/photo/122438108.cms' },
        capacity: '1500 kg',
        length: '10 ft',
        pricePerKm: '₹25 / km',
        description: 'Great for medium-sized shipments.',
    },
    {
        id: 3,
        name: 'Container Truck',
        image: { uri: 'https://etimg.etb2bimg.com/photo/122438108.cms' },
        capacity: '5000 kg',
        length: '17 ft',
        pricePerKm: '₹40 / km',
        description: 'Ideal for large commercial goods.',
    },
    {
        id: 4,
        name: 'Trailer Truck',
        image: { uri: 'https://etimg.etb2bimg.com/photo/122438108.cms' },
        capacity: '10000 kg',
        length: '22 ft',
        pricePerKm: '₹55 / km',
        description: 'Used for heavy logistics & industrial goods.',
    },
];

const CARD_WIDTH = width * 0.8;
const SPACING = (width - CARD_WIDTH) / 2;

const AUTO_SCROLL_INTERVAL = 3000; // ms
const RESUME_DELAY = 4000; // ms after user swipe

const TruckSelector = ({ onSelect }: { onSelect?: (truck: any) => void }) => {
    const scrollX = useRef(new Animated.Value(0)).current;
    const scrollRef = useRef<ScrollView>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const autoSlideTimer = useRef<NodeJS.Timeout | null>(null);
    const resumeTimer = useRef<NodeJS.Timeout | null>(null);
    const [isAutoScrolling, setIsAutoScrolling] = useState(true);

    // 🕒 Auto-slide function
    const startAutoSlide = () => {
        stopAutoSlide();
        setIsAutoScrolling(true);
        autoSlideTimer.current = setInterval(() => {
            setCurrentIndex((prev) => {
                const next = (prev + 1) % trucks.length;
                scrollRef.current?.scrollTo({
                    x: next * CARD_WIDTH,
                    animated: true,
                });
                return next;
            });
        }, AUTO_SCROLL_INTERVAL);
    };

    const stopAutoSlide = () => {
        setIsAutoScrolling(false);
        if (autoSlideTimer.current) clearInterval(autoSlideTimer.current);
    };

    // Start auto-slide initially
    useEffect(() => {
        startAutoSlide();
        return stopAutoSlide;
    }, []);

    // Pause when user scrolls manually
    const handleScrollBegin = () => {
        stopAutoSlide();
        if (resumeTimer.current) clearTimeout(resumeTimer.current);
    };

    // Resume after delay
    const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetX = e.nativeEvent.contentOffset.x;
        const newIndex = Math.round(offsetX / CARD_WIDTH);
        setCurrentIndex(newIndex);

        resumeTimer.current = setTimeout(() => {
            startAutoSlide();
        }, RESUME_DELAY);
    };

    return (
        <View style={styles.container}>
            <Animated.ScrollView
                ref={scrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={CARD_WIDTH}
                decelerationRate="fast"
                bounces={false}
                scrollEventThrottle={16}
                contentContainerStyle={{
                    paddingHorizontal: SPACING,
                    alignItems: 'center',
                }}
                onScrollBeginDrag={handleScrollBegin}
                onMomentumScrollEnd={handleScrollEnd}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: true }
                )}
            >
                {trucks.map((truck, index) => {
                    const inputRange = [
                        (index - 9) * CARD_WIDTH,
                        index * CARD_WIDTH,
                        (index + 1) * CARD_WIDTH,
                    ];

                    const scale = scrollX.interpolate({
                        inputRange,
                        outputRange: [0.9, 1, 0.9],
                        extrapolate: 'clamp',
                    });

                    const opacity = scrollX.interpolate({
                        inputRange,
                        outputRange: [0.5, 1, 0.5],
                        extrapolate: 'clamp',
                    });

                    return (
                        <Animated.View
                            key={truck.id}
                            style={[
                                styles.card,
                                { transform: [{ scale }], opacity },
                            ]}
                        >
                            <Image
                                source={truck.image}
                                style={styles.truckImage}
                                resizeMode="contain"
                            />
                            <Text style={styles.truckName}>{truck.name}</Text>

                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Capacity:</Text>
                                <Text style={styles.value}>{truck.capacity}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Length:</Text>
                                <Text style={styles.value}>{truck.length}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Rate:</Text>
                                <Text style={styles.value}>{truck.pricePerKm}</Text>
                            </View>

                            <Text style={styles.description}>{truck.description}</Text>
                        </Animated.View>
                    );
                })}
            </Animated.ScrollView>

            {/* <Button
                title="Continue"
                onPress={() => onSelect?.(trucks[currentIndex])}
                style={{ marginTop: H(20) }}
            /> */}
        </View>
    );
};

export default TruckSelector;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    card: {
        width: CARD_WIDTH - 20,
        borderRadius: 20,
        marginHorizontal: W(10),
        alignItems: 'center',

    },
    truckImage: {
        width: '100%',
        height: H(150),
    },
    truckName: {
        fontSize: RF(18),
        fontFamily: FONTS.BOLD_PRIMARY,
        color: '#111',
        marginTop: H(10),
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '80%',
        marginTop: H(5),
    },
    label: {
        fontSize: RF(14),
        color: '#555',
        fontFamily: FONTS.MEDIUM_PRIMARY,
    },
    value: {
        fontSize: RF(14),
        color: '#222',
        fontFamily: FONTS.BOLD_PRIMARY,
    },
    description: {
        marginTop: H(10),
        textAlign: 'center',
        color: '#666',
        fontSize: RF(13),
    },
});
