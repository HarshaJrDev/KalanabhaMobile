import React from 'react';
import { Image, StyleSheet } from 'react-native';






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
