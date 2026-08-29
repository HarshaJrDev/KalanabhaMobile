// AppAlert — the app's alert/notice system already has a single source of
// truth in src/ui/alert/ (useAlert + AlertBanner for an inline, persistent
// banner inside one screen's form — used by Signup; toastStore + GlobalToast
// for the app-wide transient toast, reachable from anywhere via `showToast`).
// This file re-exports that system under the `App*` naming used by the rest
// of src/components/ui/, rather than building a second alert implementation.
export { default as AppAlert } from '@ui/alert/AlertBanner';
export { useAlert as useAppAlert, type AlertType as AppAlertType, type AlertState as AppAlertState } from '@ui/alert/useAlert';
export { showToast, useToastStore as useAppToastStore } from '@ui/alert/toastStore';
export { GlobalToast as AppGlobalToast } from '@ui/alert/GlobalToast';
