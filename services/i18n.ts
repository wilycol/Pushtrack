import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'es',
    supportedLngs: ['es', 'en', 'ar'],
    ns: ['common'],
    defaultNS: 'common',
    backend: { loadPath: '/locales/{{lng}}/{{ns}}.json' },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag', 'querystring', 'cookie'],
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false }, // react already safes from xss
    react: { useSuspense: true },
    initImmediate: false,
  });

export default i18n;
