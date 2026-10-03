import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';









export const useTabBarStyle = (backgroundColor: string) => {
    const insets = useSafeAreaInsets();
    return useMemo(
        () => ({
            height: 60 + insets.bottom,
            paddingBottom: Math.max(insets.bottom, 10),
            paddingTop: 10,
            backgroundColor,
            borderTopWidth: 0,
            elevation: 8,
        }),
        [insets.bottom, backgroundColor],
    );
};







export const useTabBarContentPadding = (): number => {
    const insets = useSafeAreaInsets();
    return 60 + insets.bottom + 16;
};
