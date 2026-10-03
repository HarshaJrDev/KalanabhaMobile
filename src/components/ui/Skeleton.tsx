






import React, { useEffect } from 'react';
import { View, StyleSheet, type DimensionValue, type ViewStyle } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { useAppTheme } from '@theme/ThemeContext';

const SWEEP_WIDTH = 140;

export const Bone: React.FC<{
    width?: DimensionValue;
    height?: number;
    radius?: number;
    circle?: boolean;
    style?: ViewStyle;
}> = ({ width = '100%', height = 16, radius = 8, circle = false, style }) => {
    const { colors, isDark } = useAppTheme();
    const translate = useSharedValue(-SWEEP_WIDTH);

    useEffect(() => {
        translate.value = withRepeat(
            withTiming(SWEEP_WIDTH, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
            -1,
            false,
        );
    }, [translate]);

    const sweepStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translate.value }],
    }));

    const base = isDark ? 'rgba(255,255,255,0.06)' : colors.BORDER;
    const sweep = isDark
        ? ['transparent', 'rgba(255,255,255,0.09)', 'transparent']
        : ['transparent', 'rgba(255,255,255,0.75)', 'transparent'];

    return (
        <View
            style={[
                {
                    width,
                    height: circle ? (typeof width === 'number' ? width : height) : height,
                    borderRadius: circle ? 999 : radius,
                    backgroundColor: base,
                    overflow: 'hidden',
                },
                style,
            ]}
        >
            <Animated.View style={[StyleSheet.absoluteFill, sweepStyle]}>
                <LinearGradient
                    colors={sweep}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ width: SWEEP_WIDTH * 2, height: '100%' }}
                />
            </Animated.View>
        </View>
    );
};

export const BoneRow: React.FC<{ children: React.ReactNode; gap?: number; style?: ViewStyle }> = ({
    children,
    gap = 12,
    style,
}) => <View style={[{ flexDirection: 'row', gap }, style]}>{children}</View>;








export const SkeletonListRow: React.FC<{ style?: ViewStyle }> = ({ style }) => {
    const { colors } = useAppTheme();
    return (
        <View style={[styles.row, { backgroundColor: colors.SURFACE, borderColor: colors.BORDER }, style]}>
            <Bone circle width={44} height={44} />
            <View style={{ flex: 1, gap: 8 }}>
                <Bone width="70%" height={14} />
                <Bone width="45%" height={12} />
            </View>
            <Bone width={56} height={22} radius={11} />
        </View>
    );
};

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 6 }) => (
    <View style={{ gap: 12, padding: 16 }}>
        {Array.from({ length: count }).map((_, i) => (
            <SkeletonListRow key={i} />
        ))}
    </View>
);

export const SkeletonDashboard: React.FC = () => (
    <View style={{ padding: 20, gap: 16 }}>
        <Bone height={140} radius={22} />
        <BoneRow gap={12}>
            <Bone height={150} radius={20} style={{ flex: 1 }} />
            <Bone height={150} radius={20} style={{ flex: 1 }} />
            <Bone height={150} radius={20} style={{ flex: 1 }} />
        </BoneRow>
        <Bone width="50%" height={16} radius={6} />
        <Bone height={90} radius={18} />
        <Bone height={90} radius={18} />
    </View>
);

export const SkeletonStatTiles: React.FC<{ count?: number }> = ({ count = 3 }) => {
    const { colors } = useAppTheme();
    return (
        <BoneRow gap={12} style={{ padding: 16 }}>
            {Array.from({ length: count }).map((_, i) => (
                <View
                    key={i}
                    style={[styles.statTile, { backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}
                >
                    <Bone width="60%" height={20} radius={6} />
                    <Bone width="40%" height={12} radius={6} style={{ marginTop: 10 }} />
                </View>
            ))}
        </BoneRow>
    );
};

export const SkeletonDetail: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
    <View style={{ padding: 16, gap: 16 }}>
        <Bone height={160} radius={18} />
        <BoneRow gap={10}>
            <Bone width={90} height={24} radius={12} />
            <Bone width={70} height={24} radius={12} />
        </BoneRow>
        <View style={{ gap: 12, marginTop: 4 }}>
            {Array.from({ length: rows }).map((_, i) => (
                <SkeletonListRow key={i} />
            ))}
        </View>
    </View>
);

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
    },
    statTile: {
        flex: 1,
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
    },
});
