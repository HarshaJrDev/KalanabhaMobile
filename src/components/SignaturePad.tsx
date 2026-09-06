// SignaturePad.tsx — a real, dependency-free freehand drawing surface.
//
// No signature-canvas/webview/SVG library exists anywhere in this app
// (confirmed by inspection — adding one is a native-rebuild decision
// outside this slice's scope), so this captures real stroke geometry
// (an array of point arrays) via plain PanResponder + View segments
// instead of a rasterized image. Each segment is a thin View rotated to
// connect two consecutive touch points — a standard no-dependency
// technique, not a placeholder.
import React, { useMemo, useRef, useState } from 'react';
import { View, StyleSheet, PanResponder, Pressable, Text } from 'react-native';
import { useAppTheme } from '@theme/ThemeContext';

export type Point = { x: number; y: number };

interface SignaturePadProps {
    onChange?: (strokes: Point[][]) => void;
    height?: number;
}

const Segment: React.FC<{ a: Point; b: Point; color: string }> = ({ a, b, color }) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    return (
        <View
            style={{
                position: 'absolute',
                left: a.x,
                top: a.y - 1.5,
                width: length,
                height: 3,
                backgroundColor: color,
                borderRadius: 1.5,
                transform: [{ translateX: 0 }, { translateY: 0 }, { rotate: `${angle}rad` }],
            }}
        />
    );
};

export const SignaturePad = React.forwardRef<{ clear: () => void; getStrokes: () => Point[][] }, SignaturePadProps>(
    ({ onChange, height = 180 }, ref) => {
        const { colors } = useAppTheme();
        const [strokes, setStrokes] = useState<Point[][]>([]);
        const currentStroke = useRef<Point[]>([]);

        const panResponder = useMemo(
            () =>
                PanResponder.create({
                    onStartShouldSetPanResponder: () => true,
                    onMoveShouldSetPanResponder: () => true,
                    onPanResponderGrant: (evt) => {
                        currentStroke.current = [{ x: evt.nativeEvent.locationX, y: evt.nativeEvent.locationY }];
                        setStrokes((prev) => [...prev, currentStroke.current]);
                    },
                    onPanResponderMove: (evt) => {
                        currentStroke.current.push({ x: evt.nativeEvent.locationX, y: evt.nativeEvent.locationY });
                        setStrokes((prev) => {
                            const next = prev.slice(0, -1);
                            next.push([...currentStroke.current]);
                            return next;
                        });
                    },
                    onPanResponderRelease: () => {
                        setStrokes((prev) => {
                            onChange?.(prev);
                            return prev;
                        });
                    },
                }),
            [onChange],
        );

        React.useImperativeHandle(ref, () => ({
            clear: () => {
                setStrokes([]);
                onChange?.([]);
            },
            getStrokes: () => strokes,
        }));

        return (
            <View style={[styles.pad, { height, borderColor: colors.BORDER, backgroundColor: colors.SURFACE }]} {...panResponder.panHandlers}>
                {strokes.length === 0 && <Text style={[styles.hint, { color: colors.GRAY }]}>Sign here</Text>}
                {strokes.map((stroke, si) =>
                    stroke.slice(1).map((point, pi) => (
                        <Segment key={`${si}-${pi}`} a={stroke[pi]} b={point} color={colors.TEXT_PRIMARY} />
                    )),
                )}
            </View>
        );
    },
);

export const SignatureClearButton: React.FC<{ onPress: () => void; disabled?: boolean }> = ({ onPress, disabled }) => {
    const { colors } = useAppTheme();
    return (
        <Pressable onPress={onPress} disabled={disabled} style={styles.clearBtn}>
            <Text style={[styles.clearText, { color: colors.TEXT_SECONDARY }]}>Clear</Text>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    pad: { borderWidth: 1, borderRadius: 12, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
    hint: { fontSize: 13 },
    clearBtn: { alignSelf: 'flex-end', paddingVertical: 6, paddingHorizontal: 10 },
    clearText: { fontSize: 12, fontWeight: '600' },
});
