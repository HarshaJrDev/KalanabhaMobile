// EmptyState.tsx — the one illustrated "nothing here yet" component every
// screen should use, replacing bare "No shipments found"-style text (and
// AsyncState's old plain Inbox-icon-on-gray-text fallback). A soft
// gradient-blob SVG scene with a themed glyph floating inside it, plus a
// couple of drifting accent dots — real vector illustration drawn with
// react-native-svg (already a dependency), not a fetched stock image, so
// it stays crisp at any size, themes correctly in dark mode, and adds
// nothing to bundle size. Animates in with Reanimated so it never feels
// like a static fallback.
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Stop,
  Rect,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import {
  Package,
  Bookmark,
  Headset,
  Route,
  Wallet,
  Fuel,
  Inbox,
  WifiOff,
  AlertCircle,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react-native';
import { useAppTheme } from '@theme/ThemeContext';
import { useTranslation } from 'react-i18next';

export type EmptyStateVariant =
  | 'package'
  | 'bookmark'
  | 'ticket'
  | 'trip'
  | 'earnings'
  | 'fuel'
  | 'inbox'
  | 'offline'
  | 'error';

const VARIANT_ICON: Record<EmptyStateVariant, LucideIcon> = {
  package: Package,
  bookmark: Bookmark,
  ticket: Headset,
  trip: Route,
  earnings: Wallet,
  fuel: Fuel,
  inbox: Inbox,
  offline: WifiOff,
  error: AlertCircle,
};

interface Props {
  variant?: EmptyStateVariant;
  title: string;
  message?: string;
  retryLabel?: string;
  onRetry?: () => void;
}

export const EmptyState: React.FC<Props> = ({
  variant = 'inbox',
  title,
  message,
  retryLabel,
  onRetry,
}) => {
  const { colors, fonts } = useAppTheme();
  const { t } = useTranslation();
  const styles = React.useMemo(
    () => makeStyles(colors, fonts),
    [colors, fonts],
  );
  const Icon = VARIANT_ICON[variant];

  const entrance = useSharedValue(0);
  const floatY = useSharedValue(0);

  useEffect(() => {
    entrance.value = withTiming(1, {
      duration: 420,
      easing: Easing.out(Easing.cubic),
    });
    floatY.value = withDelay(
      420,
      withRepeat(
        withSequence(
          withTiming(-6, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
  }, [entrance, floatY]);

  const sceneStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [
      { scale: 0.85 + entrance.value * 0.15 },
      { translateY: floatY.value },
    ],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [{ translateY: (1 - entrance.value) * 10 }],
  }));

  return (
    <View style={styles.root}>
      <Animated.View style={sceneStyle}>
        <Svg width={132} height={132} viewBox="0 0 132 132">
          <Defs>
            <LinearGradient
              id="blob"
              x1="0"
              y1="0"
              x2="132"
              y2="132"
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0" stopColor={colors.PRIMARY} stopOpacity={0.16} />
              <Stop offset="1" stopColor={colors.PRIMARY} stopOpacity={0.05} />
            </LinearGradient>
          </Defs>
          <Rect
            x="2"
            y="2"
            width="128"
            height="128"
            rx="40"
            fill="url(#blob)"
          />
          <Circle cx="24" cy="108" r="4" fill={colors.PRIMARY} opacity={0.3} />
          <Circle cx="112" cy="26" r="3" fill={colors.PRIMARY} opacity={0.25} />
          <Circle
            cx="108"
            cy="104"
            r="5"
            fill={colors.PRIMARY}
            opacity={0.18}
          />
        </Svg>
        <View style={styles.iconWrap}>
          <Icon size={34} color={colors.PRIMARY} strokeWidth={1.6} />
        </View>
      </Animated.View>

      <Animated.View style={[styles.textWrap, textStyle]}>
        <Text style={styles.title}>{title}</Text>
        {!!message && <Text style={styles.message}>{message}</Text>}
        {onRetry && (
          <Pressable style={styles.retryButton} onPress={onRetry}>
            <RefreshCw size={14} color="#fff" />
            <Text style={styles.retryText}>
              {retryLabel ?? t('common.retry')}
            </Text>
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
};

const makeStyles = (
  colors: ReturnType<typeof useAppTheme>['colors'],
  fonts: ReturnType<typeof useAppTheme>['fonts'],
) =>
  StyleSheet.create({
    root: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
      gap: 4,
    },
    iconWrap: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: 132,
      height: 132,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textWrap: { alignItems: 'center', marginTop: 14, gap: 6 },
    title: {
      fontSize: 15.5,
      fontFamily: fonts.BOLD_PRIMARY,
      color: colors.TEXT_PRIMARY,
      textAlign: 'center',
    },
    message: {
      fontSize: 13,
      fontFamily: fonts.PRIMARY,
      color: colors.TEXT_SECONDARY,
      textAlign: 'center',
      maxWidth: 260,
      lineHeight: 18,
    },
    retryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.PRIMARY,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 10,
      marginTop: 10,
    },
    retryText: {
      color: '#fff',
      fontFamily: fonts.SEMI_BOLD_PRIMARY,
      fontSize: 13,
    },
  });
