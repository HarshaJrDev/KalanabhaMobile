import COLOR from '@utils/color';
import FONTS from '@utils/fonts';
import { H, S } from '@utils/responsive';

/**
 * Centralized design tokens — NOT a new design system. Every value here is
 * extracted from what screens/components already use (verified via a
 * codebase-wide audit before this file was written), not invented. The
 * canonical `App*` components (src/components/ui/) are the only things that
 * should read from this file; screens should keep using `AppText`/
 * `AppButton`/etc. instead of reaching into `theme` directly.
 *
 * `COLOR`/`FONTS`/`S`/`H` (utils/color.ts, utils/fonts.ts, utils/responsive.ts)
 * stay the source of truth for those three things — this file re-exports
 * them plus the handful of values that were hardcoded ad hoc across
 * components (white, borders, danger/error red, muted grays, radii).
 */
export const colors = {
    ...COLOR,
    WHITE: '#FFFFFF',
    BLACK: '#000000',
    BORDER: '#DDDDDD',
    PLACEHOLDER: '#999999',
    MUTED: '#777777',
    DANGER: '#E53935', // error borders/text — InputField, AlertBanner
    INFO: '#1E88E5', // AlertBanner 'info'
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
