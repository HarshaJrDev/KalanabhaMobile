import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react-native';
import { useToastStore } from './toastStore';

const AUTO_DISMISS_MS = 3500;

const ICONS = {
    error: AlertTriangle,
    success: CheckCircle2,
    info: Info,
} as const;

const COLORS = {
    error: '#E53935',
    success: '#43A047',
    info: '#1E88E5',
} as const;

// Mounted once at the app root (App.tsx). Renders whatever is currently in
// useToastStore — the single global toast surface for the whole app, so any
// screen/hook/service calls `showToast(...)` instead of building its own
// alert UI.
export const GlobalToast: React.FC = () => {
    const toast = useToastStore((s) => s.toast);
    const clear = useToastStore((s) => s.clear);
    const translateY = useRef(new Animated.Value(-80)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!toast) return;

        Animated.parallel([
            Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 16 }),
            Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]).start();

        const timer = setTimeout(() => {
            Animated.parallel([
                Animated.timing(translateY, { toValue: -80, duration: 200, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
            ]).start(() => clear());
        }, AUTO_DISMISS_MS);

        return () => clearTimeout(timer);
    }, [toast, translateY, opacity, clear]);

    if (!toast) return null;

    const Icon = ICONS[toast.type];
    const color = COLORS[toast.type];

    return (
        <Animated.View
            pointerEvents="none"
            style={[styles.wrap, { transform: [{ translateY }], opacity }]}
        >
            <View style={[styles.toast, { borderLeftColor: color }]}>
                <Icon size={18} color={color} />
                <Text style={styles.text} numberOfLines={2}>
                    {toast.message}
                </Text>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    wrap: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingTop: 50,
        paddingHorizontal: 16,
        zIndex: 9999,
        elevation: 9999,
    },
    toast: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#1F2937',
        borderRadius: 12,
        borderLeftWidth: 4,
        paddingVertical: 12,
        paddingHorizontal: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    text: { flex: 1, color: '#fff', fontSize: 13, fontWeight: '600' },
});
