import React, { FC, memo } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { colors, fonts, controlHeight, radius, fontSize } from '@config/theme';

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

/**
 * Single source of truth for buttons across the app. Defaults (variant="solid")
 * reproduce AppButton.tsx exactly; variant="legacy" reproduces Button.tsx
 * exactly, for its existing call sites that don't use a loading state.
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
    const isDisabled = loading || disabled;
    const isLegacy = variant === 'legacy';

    return (
        <TouchableOpacity
            style={[
                styles.container,
                isLegacy && styles.legacyContainer,
                { backgroundColor: backgroundColor ?? colors.PRIMARY },
                isDisabled && styles.disabled,
                style,
            ]}
            onPress={onPress}
            disabled={isDisabled}
            activeOpacity={isLegacy ? 0.8 : 0.85}
        >
            {loading ? (
                <ActivityIndicator color={colors.WHITE} />
            ) : (
                <Text style={[styles.text, isLegacy && styles.legacyText, { color: textColor ?? colors.WHITE }]}>
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
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
});

export default memo(AppButton);
