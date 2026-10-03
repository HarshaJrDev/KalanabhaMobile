import React, { FC, memo, useMemo } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useAppTheme } from '@theme/ThemeContext';
import { hapticTap } from '@utils/haptics';

export interface AppButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
    backgroundColor?: string;
    textColor?: string;
    variant?: 'solid' | 'legacy';
}

const PRESS_SCALE = 0.96;

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
          hapticTap();
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: 120 });
        }}
      >
        {loading ? (
          <ActivityIndicator color={colors.WHITE} />
        ) : (
          <Text
            style={[
              styles.text,
              isLegacy && styles.legacyText,
              { color: textColor ?? colors.WHITE },
            ]}
          >
            {title}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
};

export default memo(AppButton);
