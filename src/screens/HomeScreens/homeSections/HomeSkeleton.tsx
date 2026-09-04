// HomeSkeleton — shown while the critical first-paint data (shipments +
// vehicle configs) is still loading, shaped like the real layout below it
// rather than a blank screen or a single spinner.
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { HomeColors, SPACING } from './theme';

const Block: React.FC<{ style?: any; colors: HomeColors; opacity: Animated.Value }> = ({ style, colors, opacity }) => (
    <Animated.View style={[{ backgroundColor: colors.border, borderRadius: 12, opacity }, style]} />
);

const HomeSkeleton: React.FC<{ colors: HomeColors }> = ({ colors }) => {
    const pulse = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
            ]),
        );
        loop.start();
        return () => loop.stop();
    }, [pulse]);

    return (
        <View style={styles.root}>
            <Block colors={colors} opacity={pulse} style={styles.hero} />
            <View style={styles.row}>
                {[1, 2, 3].map((i) => <Block key={i} colors={colors} opacity={pulse} style={styles.vehicleCard} />)}
            </View>
            <Block colors={colors} opacity={pulse} style={styles.line} />
            <Block colors={colors} opacity={pulse} style={styles.card} />
            <Block colors={colors} opacity={pulse} style={styles.card} />
        </View>
    );
};

export default HomeSkeleton;

const styles = StyleSheet.create({
    root: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.l, gap: SPACING.l },
    hero: { height: 140, borderRadius: 22 },
    row: { flexDirection: 'row', gap: SPACING.m },
    vehicleCard: { flex: 1, height: 150, borderRadius: 20 },
    line: { height: 16, width: '50%', borderRadius: 6, marginTop: SPACING.s },
    card: { height: 90, borderRadius: 18 },
});
