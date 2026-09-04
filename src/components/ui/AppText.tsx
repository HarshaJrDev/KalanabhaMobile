import React, { FC, memo, useMemo } from 'react';
import { Text, TextProps, TextStyle, View, StyleSheet } from 'react-native';
import { useAppTheme } from '@theme/ThemeContext';

// Variants extracted from existing usage: 'label'/'description' reproduce
// CustomLabel.tsx exactly (field label + optional required-asterisk +
// helper text below); 'body'/'title'/'error' cover the plain-Text patterns
// repeated ad hoc across screens (InputField's label & error text, etc.).
export type AppTextVariant = 'label' | 'description' | 'body' | 'title' | 'error' | 'caption';

export interface AppTextProps extends TextProps {
    variant?: AppTextVariant;
    /** Mirrors CustomLabel's `required` — appends a red asterisk. Only meaningful with variant="label". */
    required?: boolean;
    /** Mirrors CustomLabel's `description` — renders a second, smaller line below. Only meaningful with variant="label". */
    description?: string;
    color?: string;
}

/**
 * Single source of truth for text styling. Defaults reproduce the exact
 * look of CustomLabel.tsx (variant="label" + required/description) and the
 * plain Text patterns used for body copy, titles, error messages, and
 * captions across the app — nothing new introduced.
 *
 * Styles are computed from `useAppTheme()` on every render instead of a
 * module-level StyleSheet.create — that's what makes text actually repaint
 * when the device switches light/dark, instead of staying baked at import.
 */
const AppText: FC<AppTextProps> = ({
    variant = 'body',
    required,
    description,
    color,
    style,
    children,
    ...rest
}) => {
    const { colors, fonts, fontSize, spacing } = useAppTheme();

    const { variantStyle, styles } = useMemo(() => {
        const VARIANT_STYLE: Record<AppTextVariant, TextStyle> = {
            label: { fontSize: fontSize.lg, fontFamily: fonts.MEDIUM_PRIMARY, color: colors.TEXT_SECONDARY },
            description: { fontSize: fontSize.xs, fontFamily: fonts.SECONDARY, color: colors.MUTED, marginTop: spacing.xs / 2 },
            body: { fontSize: fontSize.md, fontFamily: fonts.PRIMARY, color: colors.TEXT_SECONDARY },
            title: { fontSize: fontSize.xl, fontFamily: fonts.BOLD_PRIMARY, color: colors.TEXT_SECONDARY },
            error: { fontSize: fontSize.xs, fontFamily: fonts.PRIMARY, color: colors.DANGER },
            caption: { fontSize: fontSize.sm, fontFamily: fonts.MEDIUM_PRIMARY, color: colors.GRAY },
        };
        return {
            variantStyle: VARIANT_STYLE,
            styles: StyleSheet.create({
                labelWrapper: { marginBottom: spacing.sm },
                required: { color: colors.ERROR, fontFamily: fonts.PRIMARY },
            }),
        };
    }, [colors, fonts, fontSize, spacing]);

    if (variant === 'label') {
        return (
            <View style={styles.labelWrapper}>
                <Text style={[variantStyle.label, color && { color }, style]} {...rest}>
                    {children}
                    {required && <Text style={styles.required}> *</Text>}
                </Text>
                {!!description && <Text style={variantStyle.description}>{description}</Text>}
            </View>
        );
    }

    return (
        <Text style={[variantStyle[variant], color && { color }, style]} {...rest}>
            {children}
        </Text>
    );
};

export default memo(AppText);
