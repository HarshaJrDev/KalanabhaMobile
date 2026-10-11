import { Linking } from 'react-native';
import { confirmDialog } from '@ui/alert/confirmStore';
import { showToast } from '@ui/alert/toastStore';

// The practical, buildable version of BlackBuck's "Caller ID shows
// counterpart name + rating before answering" — that's real OS-level
// telecom integration (CallKit/ConnectionService, carrier-level caller
// ID), out of reach without native call-screening work far beyond this
// app. This delivers the same actual value (know who you're about to
// call, and their rating, before you dial) as a lightweight in-app
// confirm, reusing the existing confirmDialog rather than a new screen —
// a full-screen detour for every single call would be worse UX than
// what it replaces.
export const confirmCall = async (
    phone: string | null | undefined,
    name: string | null | undefined,
    rating: number | null | undefined,
    t: (key: string, opts?: Record<string, unknown>) => string,
): Promise<void> => {
    if (!phone) {
        showToast(t('common.phoneNumberNotAvailable'), 'info');
        return;
    }

    const confirmed = await confirmDialog({
        title: t('common.callSomeone', { name: name || t('common.thisPerson') }),
        message: rating != null ? t('common.callRatingHint', { rating: rating.toFixed(1) }) : undefined,
        confirmText: t('common.call'),
        cancelText: t('common.cancel'),
    });
    if (!confirmed) return;

    Linking.openURL(`tel:${phone}`).catch(() => showToast(t('common.unableToOpenDialer'), 'error'));
};
