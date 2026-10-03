import React from 'react';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useIsOnline } from '@api/network';
import { useTranslation } from 'react-i18next';
import {
  SkeletonList,
  SkeletonDetail,
  SkeletonStatTiles,
} from '@components/ui';
import { EmptyState, type EmptyStateVariant } from '@components/EmptyState';

// 150ms fade on every branch swap here (skeleton -> content, content ->
// empty, etc.) — each conditional branch below is a fresh mount, so
// Reanimated's `entering` fires automatically each time React swaps one
// out for another, turning what was an instant hard cut into a soft
// crossfade with zero per-screen wiring.
const CROSSFADE = FadeIn.duration(150);

interface AsyncStateProps {
  isLoading: boolean;
  error?: Error | null;
  isEmpty?: boolean;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyMessage?: string;
  /** Which illustration glyph the empty state shows — defaults to a
   * generic inbox, the safest fallback when a screen doesn't specify
   * one more specific to its content. */
  emptyVariant?: EmptyStateVariant;
  /** Shape of the loading skeleton — defaults to a list of rows, the
   * most common case across the screens using this component. */
  skeleton?: 'list' | 'detail' | 'stats';
  children: React.ReactNode;
}

/**
 * Single reusable loading / offline / error / empty pattern, so screens
 * don't each hand-roll their own ActivityIndicator/error box. Renders
 * `children` once none of those states apply.
 *
 * Usage: `<AsyncState isLoading={...} error={...} isEmpty={!data?.length} onRetry={refetch}>...</AsyncState>`
 */
export const AsyncState: React.FC<AsyncStateProps> = ({
  isLoading,
  error,
  isEmpty,
  onRetry,
  emptyTitle,
  emptyMessage,
  emptyVariant = 'inbox',
  skeleton = 'list',
  children,
}) => {
  const online = useIsOnline();
  const { t } = useTranslation();
  const resolvedEmptyTitle = emptyTitle ?? t('asyncState.nothingHereYet');

  if (!online && !isLoading) {
    return (
      <Animated.View entering={CROSSFADE} style={{ flex: 1 }}>
        <EmptyState
          variant="offline"
          title={t('asyncState.offline')}
          message={t('asyncState.offlineHint')}
          onRetry={onRetry}
        />
      </Animated.View>
    );
  }

  if (isLoading) {
    return (
      <Animated.View entering={CROSSFADE} style={{ flex: 1 }}>
        {skeleton === 'detail' ? (
          <SkeletonDetail />
        ) : skeleton === 'stats' ? (
          <SkeletonStatTiles />
        ) : (
          <SkeletonList />
        )}
      </Animated.View>
    );
  }

  if (error) {
    return (
      <Animated.View entering={CROSSFADE} style={{ flex: 1 }}>
        <EmptyState
          variant="error"
          title={t('asyncState.somethingWentWrong')}
          message={error.message}
          onRetry={onRetry}
        />
      </Animated.View>
    );
  }

  if (isEmpty) {
    return (
      <Animated.View entering={CROSSFADE} style={{ flex: 1 }}>
        <EmptyState
          variant={emptyVariant}
          title={resolvedEmptyTitle}
          message={emptyMessage}
        />
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={CROSSFADE} style={{ flex: 1 }}>
      {children}
    </Animated.View>
  );
};
