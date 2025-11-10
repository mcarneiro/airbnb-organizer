import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import ptBR from '../locales/pt-BR/translation.json';
import enUS from '../locales/en-US/translation.json';

// Language detection configuration
const languageDetector = new LanguageDetector();
languageDetector.addDetector({
  name: 'customDetector',
  lookup() {
    // Priority order:
    // 1. localStorage (user preference)
    const stored = localStorage.getItem('i18nextLng');
    if (stored) return stored;

    // 2. Browser language with pt-BR preference
    const browserLang = navigator.language || (navigator as any).userLanguage;

    // If browser language is any Portuguese variant, use pt-BR
    if (browserLang?.startsWith('pt')) {
      return 'pt-BR';
    }

    // 3. If browser language is English, use en-US
    if (browserLang?.startsWith('en')) {
      return 'en-US';
    }

    // 4. Default fallback to en-US for any other language
    return 'en-US';
  },
  cacheUserLanguage(lng: string) {
    localStorage.setItem('i18nextLng', lng);
  },
});

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'pt-BR': {
        translation: ptBR,
      },
      'en-US': {
        translation: enUS,
      },
    },
    fallbackLng: 'en-US',
    supportedLngs: ['pt-BR', 'en-US'],
    detection: {
      order: ['customDetector'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false, // React already handles escaping
    },
    react: {
      useSuspense: false, // Disable suspense to avoid loading flicker
    },
  });

export default i18n;
