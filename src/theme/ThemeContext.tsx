import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { colors as lightColors, colorsDark, fonts, spacing, radius, fontSize, controlHeight } from '@config/theme';

/**
 * Runtime dark-mode wiring. `config/theme.ts` already exports the full
 * light (`colors`) and dark (`colorsDark`) token sets — this is the piece
 * that was missing: something that actually reads the device's color
 * scheme and hands the right set to the app. `colorsDark` carries one
 * extra key (ELEVATED) that `colors` doesn't; every other key lines up,
 * so components can destructure either set through the same shape.
 */
export type AppColors = typeof lightColors & Partial<typeof colorsDark>;

interface ThemeContextValue {
    colors: AppColors;
    isDark: boolean;
    fonts: typeof fonts;
    spacing: typeof spacing;
    radius: typeof radius;
    fontSize: typeof fontSize;
    controlHeight: typeof controlHeight;
}

const defaultValue: ThemeContextValue = {
    colors: lightColors as AppColors,
    isDark: false,
    fonts,
    spacing,
    radius,
    fontSize,
    controlHeight,
};

const ThemeContext = createContext<ThemeContextValue>(defaultValue);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Follows the device/OS setting. No in-app toggle exists yet (none was
    // asked for) — this is the same "system" behavior Settings screens
    // default to before an explicit override is added.
    const scheme = useColorScheme();
    const isDark = scheme === 'dark';

    const value = useMemo<ThemeContextValue>(
        () => ({
            colors: (isDark ? colorsDark : lightColors) as AppColors,
            isDark,
            fonts,
            spacing,
            radius,
            fontSize,
            controlHeight,
        }),
        [isDark],
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

/** The one hook screens/components should use to render theme-aware — read
 * `colors`/`isDark` from here instead of importing the static `colors`
 * export from `@config/theme` directly, so dark mode actually applies. */
export const useAppTheme = () => useContext(ThemeContext);
