import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Shared by every bottom-tab navigator in the app (customer HomeTabs,
// driver DriverTabs) — a fixed-height tab bar with no safe-area bottom
// inset leaves no room for the device's own on-screen nav bar (Android's
// back/home/recents, or the iOS home indicator), which then visually
// overlaps the custom tab bar instead of sitting below it. Was fixed once
// on the customer tabs but never on the driver tabs (a hardcoded `height:
// 70` with no insets) — pulled out here so both navigators (and any future
// one) share the same correct calculation instead of drifting apart again.
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

// The matching bottom padding for any ScrollView/FlatList living inside a
// screen hosted by one of these tab navigators — without it, the last
// item in the list sits behind the tab bar instead of above it (the exact
// "buttons overlapping the screen" bug this hook also fixes for the tab
// bar itself). Screens should add this to their contentContainerStyle's
// paddingBottom (on top of whatever bottom padding they already want).
export const useTabBarContentPadding = (): number => {
    const insets = useSafeAreaInsets();
    return 60 + insets.bottom + 16;
};
