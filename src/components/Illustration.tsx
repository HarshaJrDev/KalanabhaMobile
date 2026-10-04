import React, { useEffect } from 'react';
import { Image, StyleSheet, type ImageSourcePropType } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    withRepeat,
    withSequence,
    Easing,
} from 'react-native-reanimated';








interface IllustrationProps {
    source: ImageSourcePropType;
    size?: number;
    style?: object;
}

export const Illustration: React.FC<IllustrationProps> = ({ source, size = 220, style }) => {
    const entrance = useSharedValue(0);
    const floatY = useSharedValue(0);

    useEffect(() => {
        entrance.value = withTiming(1, {
            duration: 480,
            easing: Easing.out(Easing.cubic),
        });
        floatY.value = withDelay(
            480,
            withRepeat(
                withSequence(
                    withTiming(-5, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
                    withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
                ),
                -1,
                true,
            ),
        );
    }, [entrance, floatY]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: entrance.value,
        transform: [
            { scale: 0.88 + entrance.value * 0.12 },
            { translateY: floatY.value },
        ],
    }));

    return (
        <Animated.View style={[styles.wrap, { width: size, height: size * 0.56 }, animatedStyle, style]}>
            <Image source={source} resizeMode="contain" style={styles.image} />
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    wrap: { alignSelf: 'center' },
    image: { width: '100%', height: '100%' },
});
