// Backward-compat shim — implementation now lives in
// src/components/ui/AppLoader.tsx (single source of truth). Existing
// imports of `@components/CustomLoader` keep working unchanged; new code
// should import AppLoader from `@components/ui` directly.
export { AppLoader as CustomLoader, default } from './ui/AppLoader';
