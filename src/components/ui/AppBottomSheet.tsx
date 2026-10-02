// AppBottomSheet.tsx — the one real bottom-sheet component screens should
// use, instead of hand-rolling `<Modal transparent animationType="slide">`
// with its own one-off corner radius/overlay opacity (every "bottom
// sheet" in this app — EditProfileModal, LanguagePickerModal,
// BottomSheetSelectInput, ShipmentResultModal, PlacePicker's save dialog —
// did exactly that, despite @gorhom/bottom-sheet already being a
// dependency and never actually used). This wraps BottomSheetModal (which
// portals to the app root via BottomSheetModalProvider in App.tsx, so it
// renders correctly as a full overlay regardless of how deeply the
// triggering screen is nested in tab/stack navigators) with the app's own
// theme, a real drag handle, and swipe-to-dismiss.
import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import {
    BottomSheetModal,
    BottomSheetView,
    BottomSheetBackdrop,
    type BottomSheetBackdropProps,
    type BottomSheetModalProps,
} from '@gorhom/bottom-sheet';
import { useAppTheme } from '@theme/ThemeContext';

export interface AppBottomSheetRef {
    present: () => void;
    dismiss: () => void;
}

interface Props {
    children: React.ReactNode;
    /** Omit to size the sheet to its content automatically. */
    snapPoints?: BottomSheetModalProps['snapPoints'];
    onDismiss?: () => void;
}

export const AppBottomSheet = forwardRef<AppBottomSheetRef, Props>(({ children, snapPoints, onDismiss }, ref) => {
    const sheetRef = useRef<BottomSheetModal>(null);
    const { colors } = useAppTheme();

    useImperativeHandle(ref, () => ({
        present: () => sheetRef.current?.present(),
        dismiss: () => sheetRef.current?.dismiss(),
    }));

    const renderBackdrop = useCallback(
        (props: BottomSheetBackdropProps) => (
            <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.5} pressBehavior="close" />
        ),
        [],
    );

    const styles = useMemo(() => makeStyles(colors), [colors]);

    return (
        <BottomSheetModal
            ref={sheetRef}
            enableDynamicSizing={!snapPoints}
            snapPoints={snapPoints}
            backdropComponent={renderBackdrop}
            handleIndicatorStyle={styles.handle}
            backgroundStyle={styles.background}
            onDismiss={onDismiss}
        >
            <BottomSheetView style={styles.content}>{children}</BottomSheetView>
        </BottomSheetModal>
    );
});

const makeStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
    background: { backgroundColor: colors.SURFACE, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
    handle: { backgroundColor: colors.BORDER, width: 40 },
    content: { paddingHorizontal: 20, paddingBottom: 28 },
});
