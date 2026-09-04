import COLOR, { DARK } from '@utils/color';
import FONTS from '@utils/fonts';
import { H, S } from '@utils/responsive';

/**
 * Centralized design tokens. Kalanabha brand palette (see utils/color.ts)
 * plus the handful of values that were hardcoded ad hoc across components
 * (white, black, placeholder, muted gray) — DANGER/INFO/BORDER now alias
 * the real brand tokens (ERROR/INFO/BORDER) instead of the old
 * pre-rebrand hardcoded hex values, so every component reading
 * `colors.DANGER` etc. picks up the rebrand too. The canonical `App*`
 * components (src/components/ui/) are the only things that should read
 * from this file; screens should keep using `AppText`/`AppButton`/etc.
 * instead of reaching into `theme` directly.
 *
 * `colorsDark` is the same shape over utils/color.ts's DARK set — real
 * tokens, ready for a ThemeContext/useColorScheme wiring to switch to at
 * runtime (not yet built — no screen currently renders in dark mode).
 */
export const colors = {
    ...COLOR,
    WHITE: '#FFFFFF',
    BLACK: '#000000',
    PLACEHOLDER: '#94A3B8',
    MUTED: COLOR.TEXT_SECONDARY,
    DANGER: COLOR.ERROR,
    INFO: COLOR.INFO,
} as const;

export const colorsDark = {
    ...DARK,
    WHITE: '#FFFFFF',
    BLACK: '#000000',
    PLACEHOLDER: DARK.TEXT_SECONDARY,
    MUTED: DARK.TEXT_SECONDARY,
    DANGER: DARK.ERROR,
    INFO: DARK.INFO,
} as const;

export const fonts = FONTS;

// Radii actually in use across components today (AppButton: 8, Button: 5,
// CustomInput: S(10)) — kept distinct rather than collapsed into one value,
// since collapsing them would visually change existing screens.
export const radius = {
    sm: 5,
    md: 8,
    lg: S(10),
} as const;

// Spacing scale wrapping the existing S()/H() responsive scalers — most
// components space things at these exact increments already.
export const spacing = {
    xs: S(4),
    sm: S(8),
    md: S(12),
    lg: S(16),
    xl: S(20),
} as const;

// Control heights already standardized on in practice (AppButton/Button/
// InputField all use H(50); CustomInput uses S(48)).
export const controlHeight = {
    input: H(50),
    inputCompact: S(48),
    button: H(50),
} as const;

export const fontSize = {
    xs: 12,
    sm: 13,
    md: 14,
    lg: 15,
    xl: 16,
} as const;
