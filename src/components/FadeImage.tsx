// FadeImage — a plain remote <Image> that fades in smoothly once loaded
// instead of popping in abruptly, with a solid placeholder color behind it
// so there's never a blank/broken-looking gap while it's still fetching.
// Used for real illustration photos (e.g. Home.tsx's first-booking nudge,
// House Shifting banner) sourced from a public, freely-licensed source
// (Wikimedia Commons) — not fabricated placeholder art.
import React, { useRef } from 'react';
import { Animated, StyleSheet, View, type ImageStyle, type StyleProp } from 'react-native';

interface Props {
    uri: string;
    style: StyleProp<ImageStyle>;
    placeholderColor?: string;
}

const FadeImage: React.FC<Props> = ({ uri, style, placeholderColor = 'rgba(255,255,255,0.15)' }) => {
    const opacity = useRef(new Animated.Value(0)).current;

    const onLoad = () => {
        Animated.timing(opacity, { toValue: 1, duration: 320, useNativeDriver: true }).start();
    };

    return (
        <View style={[style, { backgroundColor: placeholderColor, overflow: 'hidden' }]}>
            <Animated.Image
                source={{ uri }}
                style={[StyleSheet.absoluteFill, { opacity }]}
                resizeMode="cover"
                onLoad={onLoad}
            />
        </View>
    );
};

export default FadeImage;
