import React, { FC, memo, useMemo } from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useAppTheme } from '@theme/ThemeContext';

export interface AppButtonProps {
    title: string;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
    /** Overrides the default brand-colored background — Button.tsx's `backgroundColor` prop. */
    backgroundColor?: string;
    /** Overrides the default white text color — Button.tsx's `textColor` prop. */
    textColor?: string;
    /** 'solid' reproduces AppButton.tsx's exact look (radius 8, no margin). 'legacy' reproduces
     * Button.tsx's exact look (radius 5, marginTop 20, no loading state) for its existing call sites. */
    variant?: 'solid' | 'legacy';
}

const PRESS_SCALE = 0.96;

/**
 * Single source of truth for buttons across the app. Defaults (variant="solid")
 * reproduce AppButton.tsx exactly; variant="legacy" reproduces Button.tsx
 * exactly, for its existing call sites that don't use a loading state.
 *
 * Press feedback is a Reanimated scale (1 → 0.96 → 1, per the brand spec's
 * §9) rather than TouchableOpacity's dimming — every button in the app
 * picks this up from here, nothing per-screen. Colors come from
 * `useAppTheme()` so buttons repaint correctly in dark mode.
 */
const AppButton: FC<AppButtonProps> = ({
    title,
    onPress,
    loading = false,
    disabled = false,
    style,
    backgroundColor,
    textColor,
    variant = 'solid',
}) => {
    const { colors, fonts, controlHeight, radius, fontSize } = useAppTheme();
    const isDisabled = loading || disabled;
    const isLegacy = variant === 'legacy';
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const styles = useMemo(
        () =>
            StyleSheet.create({
                container: {
                    height: controlHeight.button,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: radius.md,
                },
                legacyContainer: {
                    borderRadius: radius.sm,
                    marginTop: 20,
                },
                disabled: { opacity: 0.6 },
                text: { fontFamily: fonts.BOLD_PRIMARY, fontSize: fontSize.xl },
                legacyText: { fontFamily: fonts.MEDIUM_PRIMARY, fontSize: fontSize.xl },
            }),
        [controlHeight, radius, fonts, fontSize],
    );

    return (
        <Animated.View style={animatedStyle}>
            <Pressable
                style={[
                    styles.container,
                    isLegacy && styles.legacyContainer,
                    { backgroundColor: backgroundColor ?? colors.PRIMARY },
                    isDisabled && styles.disabled,
                    style,
                ]}
                onPress={onPress}
                disabled={isDisabled}
                onPressIn={() => {
                    scale.value = withTiming(PRESS_SCALE, { duration: 80 });
                }}
                onPressOut={() => {
                    scale.value = withTiming(1, { duration: 120 });
                }}
            >
                {loading ? (
                    <ActivityIndicator color={colors.WHITE} />
                ) : (
                    <Text style={[styles.text, isLegacy && styles.legacyText, { color: textColor ?? colors.WHITE }]}>
                        {title}
                    </Text>
                )}
            </Pressable>
        </Animated.View>
    );
};

export default memo(AppButton);
