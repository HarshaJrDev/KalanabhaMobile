import React, { useRef, useState, useEffect } from 'react';
import {
    View,
    FlatList,
    Dimensions,
    StyleSheet,
    Text,
    Image,
    NativeScrollEvent,
    NativeSyntheticEvent,
} from 'react-native';
import COLOR from '@utils/color';
import FONTS from '@utils/fonts';

const { width } = Dimensions.get('window');

interface SlideItem {
    image: string; // public URL

}

interface SliderProps {
    data: SlideItem[];
    autoPlayInterval?: number;
}

const Slider: React.FC<SliderProps> = ({ data, autoPlayInterval = 3000 }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const intervalRef = useRef<NodeJS.Timer | null>(null);


    useEffect(() => {
        if (data.length <= 1) return;

        intervalRef.current = setInterval(() => {
            let nextIndex = currentIndex + 1;
            if (nextIndex >= data.length) nextIndex = 0;
            flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
            setCurrentIndex(nextIndex);
        }, autoPlayInterval);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [currentIndex, data.length, autoPlayInterval]);

    const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / width);
        setCurrentIndex(index);
    };

    const renderItem = ({ item }: { item: SlideItem }) => (
        <View style={styles.slide}>
            <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />

        </View>
    );

    return (
        <View>
            <FlatList
                data={data}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                renderItem={renderItem}
                keyExtractor={(_, index) => index.toString()}
                onScroll={onScroll}
                ref={flatListRef}
                scrollEventThrottle={16}
                contentContainerStyle={{ alignItems: 'center', }}
            />

            <View style={styles.pagination}>
                {data.map((_, index) => {
                    const isActive = index === currentIndex;
                    return (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                { opacity: isActive ? 1 : 0.3, transform: [{ scale: isActive ? 1.2 : 1 }] },
                            ]}
                        />
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    slide: {
        width: width - 10,
        height: 150,
        borderRadius: 20,
        overflow: 'hidden',
        marginVertical: 20,
        paddingHorizontal: 10,
        overlayColor: 'transparent',


    },
    image: {
        width: '100%',
        height: '100%',
    },
    labelContainer: {
        position: 'absolute',
        bottom: 10,
        left: 15,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5,
    },
    label: {
        color: '#fff',
        fontSize: 16,
        fontFamily: FONTS.SEMI_BOLD_PRIMARY,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    dot: {
        width: 40,
        height: 5,
        borderRadius: 4,
        backgroundColor: COLOR.PRIMARY,
        marginHorizontal: 4,
    },
});

export default Slider;
