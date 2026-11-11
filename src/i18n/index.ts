/**
 * Internationalisation : français complet, anglais préparé.
 * La langue suit le système, avec surcharge possible dans les réglages.
 */
/* eslint-disable import/no-named-as-default-member */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import fr from './fr.json';
import en from './en.json';

export type AppLocale = 'fr' | 'en';
export const SUPPORTED_LOCALES: AppLocale[] = ['fr', 'en'];

export function detectLocale(): AppLocale {
  const code = getLocales()[0]?.languageCode ?? 'fr';
  return code === 'en' ? 'en' : 'fr';
}

export function initI18n(locale: AppLocale = detectLocale()): typeof i18n {
  if (!i18n.isInitialized) {
    void i18n.use(initReactI18next).init({
      resources: { fr: { translation: fr }, en: { translation: en } },
      lng: locale,
      fallbackLng: 'fr',
      interpolation: { escapeValue: false },
      returnNull: false,
    });
  } else if (i18n.language !== locale) {
    void i18n.changeLanguage(locale);
  }
  return i18n;
}

export function setLocale(locale: AppLocale): void {
  void i18n.changeLanguage(locale);
}

export default i18n;
