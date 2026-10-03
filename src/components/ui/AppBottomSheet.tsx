










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
