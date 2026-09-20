import React from 'react';
import { Image, StyleSheet } from 'react-native';

// The real Kalanabha logo (registered trademark) — a delivery-truck
// icon, used as provided rather than redrawn. It carries its own white
// square background, so it drops into a translucent glass badge
// (Login.tsx) as a small white card rather than needing a flat
// single-color treatment the way a vector glyph would.
export const KalanabhaMark = ({ size = 30 }: { size?: number; color?: string }) => (
    <Image
        source={require('../../assets/images/home/logo-icon.png')}
        style={[styles.image, { width: size, height: size }]}
        resizeMode="contain"
    />
);

const styles = StyleSheet.create({
    image: { borderRadius: 8 },
});
