// Shared color/spacing tokens for every Home-screen section component.
// Kept separate from the screen's own useAppTheme() colors object so each
// section file can import just this, not the whole Home.tsx.
import { useAppTheme } from '@theme/ThemeContext';

export const makeHomeColors = (BRAND: ReturnType<typeof useAppTheme>['colors']) => ({
    primary: BRAND.PRIMARY,
    primaryDark: BRAND.PRIMARY_DARK,
    primaryLight: BRAND.PRIMARY_LIGHT,
    accent: BRAND.WARNING,
    success: BRAND.SUCCESS,
    warning: BRAND.WARNING,
    danger: BRAND.ERROR,
    background: BRAND.BACKGROUND,
    card: BRAND.SURFACE,
    textPrimary: BRAND.TEXT_PRIMARY,
    textSecondary: BRAND.TEXT_SECONDARY,
    textLight: BRAND.GRAY,
    border: BRAND.BORDER,
    gradientStart: BRAND.PRIMARY,
    gradientEnd: BRAND.PRIMARY_DARK,
});
export type HomeColors = ReturnType<typeof makeHomeColors>;
export type HomeFonts = ReturnType<typeof useAppTheme>['fonts'];

export const SPACING = {
    s: 8,
    m: 12,
    l: 16,
    xl: 20,
    xxl: 24,
};
