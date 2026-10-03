import COLOR, { DARK } from '@utils/color';
import FONTS from '@utils/fonts';
import { H, S } from '@utils/responsive';

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




export const radius = {
    sm: 5,
    md: 8,
    lg: S(10),
} as const;



export const spacing = {
    xs: S(4),
    sm: S(8),
    md: S(12),
    lg: S(16),
    xl: S(20),
} as const;



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
