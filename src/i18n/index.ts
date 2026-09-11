import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import hi from './locales/hi.json';
import te from './locales/te.json';
import ta from './locales/ta.json';
import { getStoredLanguage, setStoredLanguage } from '@services/storage';

export const SUPPORTED_LANGUAGES = ['en', 'hi', 'te', 'ta'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
    en: 'English',
    hi: 'हिन्दी',
    te: 'తెలుగు',
    ta: 'தமிழ்',
};

const resources = {
    en: { translation: en },
    hi: { translation: hi },
    te: { translation: te },
    ta: { translation: ta },
};

// No react-native-localize dependency — that's a native module and this
// app's default has always just been English; a stored preference (set via
// Profile > Language) is the only thing that should ever override it, not
// a guess at device locale.
const initialLanguage = (getStoredLanguage() as SupportedLanguage | null) ?? 'en';

i18n.use(initReactI18next).init({
    resources,
    lng: initialLanguage,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v4',
});

export const setAppLanguage = (lang: SupportedLanguage): void => {
    i18n.changeLanguage(lang);
    setStoredLanguage(lang);
};

export default i18n;
