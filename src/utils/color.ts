// color.ts — Kalanabha brand palette.
//
// Rebranded from the old #FF6347 placeholder to the real Kalanabha brand
// color (#FF7518). Every screen/component that reads COLOR.PRIMARY (or
// `colors.PRIMARY` via config/theme.ts) picks this up automatically —
// AppButton, AppTextInput's card variant, AppText, etc.
//
// Existing keys (PRIMARY/BACKGROUND/TEXT_PRIMARY/etc.) are kept so nothing
// that already reads them breaks; DARK holds the dark-mode surface set
// (§7 of the brand spec — proper dark surfaces, not colors inverted).
// Nothing currently switches to DARK at runtime (no ThemeContext/
// useColorScheme wiring exists yet) — it's the real token set, ready for
// that to be wired in as a follow-up, not a decorative placeholder.
const COLOR = {
    PRIMARY: '#FF7518',
    PRIMARY_DARK: '#E9600A',
    PRIMARY_LIGHT: '#FFE8D6',

    BACKGROUND: '#F8FAFC',
    SURFACE: '#FFFFFF',

    TEXT_PRIMARY: '#111827',
    TEXT_SECONDARY: '#64748B',

    BORDER: '#E2E8F0',

    SUCCESS: '#16A34A',
    WARNING: '#F59E0B',
    ERROR: '#DC2626',
    INFO: '#2563EB',

    GRAY: '#94A3B8',
};

export const DARK = {
    PRIMARY: '#FF7518',
    PRIMARY_DARK: '#E9600A',
    PRIMARY_LIGHT: '#3A2414',

    BACKGROUND: '#0F1115',
    SURFACE: '#171A21',
    ELEVATED: '#20242C',

    TEXT_PRIMARY: '#F8FAFC',
    TEXT_SECONDARY: '#94A3B8',

    BORDER: '#2A2E38',

    SUCCESS: '#22C55E',
    WARNING: '#FBBF24',
    ERROR: '#F87171',
    INFO: '#60A5FA',

    GRAY: '#64748B',
} as const;

export default COLOR;
