// Backward-compat shim — this file's implementation was extracted into
// src/components/ui/AppButton.tsx (the "solid" variant, matching this
// file's original visuals exactly) so it's the single source of truth for
// button styling. Existing imports of `@components/AppButton` keep working
// unchanged; new code should import AppButton from `@components/ui` directly.
export { default } from './ui/AppButton';
