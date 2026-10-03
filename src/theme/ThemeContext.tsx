import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { colors as lightColors, colorsDark, fonts, spacing, radius, fontSize, controlHeight } from '@config/theme';

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

export const useAppTheme = () => useContext(ThemeContext);
