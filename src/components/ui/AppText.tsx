import React, { FC, memo, useMemo } from 'react';
import { Text, TextProps, TextStyle, View, StyleSheet } from 'react-native';
import { useAppTheme } from '@theme/ThemeContext';





export type AppTextVariant = 'label' | 'description' | 'body' | 'title' | 'error' | 'caption';

export interface AppTextProps extends TextProps {
    variant?: AppTextVariant;
        required?: boolean;
        description?: string;
    color?: string;
}

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
