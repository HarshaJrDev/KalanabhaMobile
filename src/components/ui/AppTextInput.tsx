import React, { forwardRef, memo, useCallback, useMemo, useState } from 'react';
import {
    View,
    TextInput,
    Text,
    TouchableOpacity,
    StyleSheet,
    TextInputProps,
    ViewStyle,
} from 'react-native';
import { Eye, EyeOff, type LucideIcon } from 'lucide-react-native';
import { useAppTheme } from '@theme/ThemeContext';

export type AppTextInputVariant = 'outline' | 'card';

export interface AppTextInputProps extends Omit<TextInputProps, 'onChange'> {
        variant?: AppTextInputVariant;

    
    label?: string;
    value?: string;
    onChange?: (value: string) => void;
    error?: string;
    secure?: boolean;

    
    leftIcon?: LucideIcon;
    rightIcon?: LucideIcon;
    onRightIconPress?: () => void;
    containerStyle?: ViewStyle;
    isEnable?: boolean;
}

const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 };

const AppTextInput = memo(
    forwardRef<TextInput, AppTextInputProps>((props, ref) => {
        const {
            variant = 'outline',
            label,
            value,
            onChange,
            error,
            secure,
            leftIcon: LeftIcon,
            rightIcon: RightIcon,
            onRightIconPress,
            containerStyle,
            isEnable,
            style,
            ...rest
        } = props;

        const { colors, fonts, fontSize, radius, spacing, controlHeight } = useAppTheme();
        const [visible, setVisible] = useState(false);
        const toggleVisibility = useCallback(() => setVisible((p) => !p), []);
        const isSecure = secure && !visible;

        const { outlineStyles, cardStyles } = useMemo(
            () => ({
                outlineStyles: StyleSheet.create({
                    wrapper: { gap: spacing.sm - spacing.xs / 2 },
                    label: { color: colors.TEXT_SECONDARY, fontSize: fontSize.md, fontFamily: fonts.MEDIUM_PRIMARY },
                    inputContainer: {
                        flexDirection: 'row',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: colors.BORDER,
                        borderRadius: radius.md,
                        height: controlHeight.input,
                        paddingHorizontal: spacing.md,
                        backgroundColor: colors.SURFACE,
                    },
                    
                    
                    
                    
                    
                    input: { flex: 1, color: colors.TEXT_SECONDARY, fontFamily: fonts.PRIMARY, fontSize: fontSize.md, backgroundColor: colors.SURFACE },
                    errorBorder: { borderColor: colors.DANGER },
                    errorText: { color: colors.DANGER, fontSize: fontSize.xs, fontFamily: fonts.PRIMARY },
                }),
                cardStyles: StyleSheet.create({
                    container: {
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: colors.WHITE,
                        borderRadius: radius.lg,
                        paddingHorizontal: spacing.md - spacing.xs / 2,
                        height: controlHeight.inputCompact,
                        shadowColor: colors.BLACK,
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 3,
                        width: '100%',
                    },
                    leftIcon: { marginRight: spacing.sm },
                    input: { flex: 1, fontSize: fontSize.xl, fontFamily: fonts.PRIMARY, color: colors.BLACK, width: '100%', backgroundColor: colors.WHITE },
                    rightIcon: { marginLeft: spacing.sm },
                }),
            }),
            [colors, fonts, fontSize, radius, spacing, controlHeight],
        );

        if (variant === 'card') {
            return (
                <View style={[cardStyles.container, containerStyle]}>
                    {LeftIcon && (
                        <View style={cardStyles.leftIcon}>
                            <LeftIcon width={20} height={20} color={colors.PRIMARY} />
                        </View>
                    )}
                    <TextInput
                        ref={ref}
                        editable={isEnable}
                        placeholderTextColor={colors.PLACEHOLDER}
                        style={[cardStyles.input, style]}
                        value={value}
                        onChangeText={onChange}
                        {...rest}
                    />
                    {RightIcon && (
                        <TouchableOpacity onPress={onRightIconPress} style={cardStyles.rightIcon}>
                            <RightIcon width={20} height={20} color={colors.PRIMARY} />
                        </TouchableOpacity>
                    )}
                </View>
            );
        }

        return (
            <View style={outlineStyles.wrapper}>
                {!!label && <Text style={outlineStyles.label}>{label}</Text>}

                <View style={[outlineStyles.inputContainer, error && outlineStyles.errorBorder]}>
                    <TextInput
                        ref={ref}
                        style={[outlineStyles.input, style]}
                        value={value}
                        onChangeText={onChange}
                        secureTextEntry={isSecure}
                        placeholderTextColor={colors.PLACEHOLDER}
                        autoCapitalize="none"
                        importantForAutofill="no"
                        autoComplete="off"
                        autoCorrect={false}
                        spellCheck={false}
                        {...rest}
                    />

                    {secure && (
                        <TouchableOpacity onPress={toggleVisibility} hitSlop={HIT_SLOP}>
                            {visible ? (
                                <Eye size={20} color={colors.TEXT_SECONDARY} />
                            ) : (
                                <EyeOff size={20} color={colors.TEXT_SECONDARY} />
                            )}
                        </TouchableOpacity>
                    )}
                </View>

                {!!error && <Text style={outlineStyles.errorText}>{error}</Text>}
            </View>
        );
    }),
);

export default AppTextInput;
