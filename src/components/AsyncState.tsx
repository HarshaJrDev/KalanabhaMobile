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
import type { ImageSourcePropType } from 'react-native';






const CROSSFADE = FadeIn.duration(150);

interface AsyncStateProps {
  isLoading: boolean;
  error?: Error | null;
  isEmpty?: boolean;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyMessage?: string;
    emptyVariant?: EmptyStateVariant;
    emptyIllustration?: ImageSourcePropType;
    skeleton?: 'list' | 'detail' | 'stats';
  children: React.ReactNode;
}

export const AsyncState: React.FC<AsyncStateProps> = ({
  isLoading,
  error,
  isEmpty,
  onRetry,
  emptyTitle,
  emptyMessage,
  emptyVariant = 'inbox',
  emptyIllustration,
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
          illustration={emptyIllustration}
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
