import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useAppTheme } from '@theme/ThemeContext';

interface ScreenHeaderProps {
    title: string;
    subtitle?: string;
    showBack?: boolean;
    onBackPress?: () => void;
    rightSlot?: React.ReactNode;
    style?: ViewStyle;
    transparent?: boolean;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
    title,
    subtitle,
    showBack = true,
    onBackPress,
    rightSlot,
    style,
    transparent = false,
}) => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { colors, fonts, spacing } = useAppTheme();
    const styles = React.useMemo(() => makeStyles(colors, fonts, spacing), [colors, fonts, spacing]);

    const handleBack = () => {
        if (onBackPress) {
            onBackPress();
            return;
        }
        navigation.goBack();
    };

    return (
        <View
            style={[
                styles.container,
                { paddingTop: insets.top + spacing.sm },
                transparent && styles.transparent,
                style,
            ]}
        >
            {showBack ? (
                <Pressable onPress={handleBack} hitSlop={12} style={styles.backBtn}>
                    <ArrowLeft color={colors.TEXT_PRIMARY} size={22} />
                </Pressable>
            ) : (
                <View style={styles.sideSpacer} />
            )}

            <View style={styles.textWrap}>
                <Text style={styles.title} numberOfLines={1}>{title}</Text>
                {!!subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
            </View>

            {rightSlot ? <View style={styles.rightWrap}>{rightSlot}</View> : <View style={styles.sideSpacer} />}
        </View>
    );
};

export default ScreenHeader;

const makeStyles = (
    colors: ReturnType<typeof useAppTheme>['colors'],
    fonts: ReturnType<typeof useAppTheme>['fonts'],
    spacing: ReturnType<typeof useAppTheme>['spacing'],
) =>
    StyleSheet.create({
        container: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.sm,
            backgroundColor: colors.SURFACE,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.BORDER,
        },
        transparent: {
            backgroundColor: 'transparent',
            borderBottomWidth: 0,
        },
        backBtn: {
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
        },
        sideSpacer: { width: 36, height: 36 },
        textWrap: { flex: 1, alignItems: 'center' },
        rightWrap: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
        title: {
            fontSize: 16,
            fontFamily: fonts.BOLD_PRIMARY,
            color: colors.TEXT_PRIMARY,
        },
        subtitle: {
            fontSize: 12,
            fontFamily: fonts.PRIMARY,
            color: colors.TEXT_SECONDARY,
            marginTop: 2,
        },
    });
