/**
 * Préférences de l'application, persistées dans la table `settings` de la base réelle.
 * Hydratées au démarrage (`hydrateSettings`), écrites à chaque changement.
 */
import { create } from 'zustand';

import { kvGet, kvSet } from '@/db/kv';
import type { AppLocale } from '@/i18n';
import type { SplitMode } from '@/finance/budget';
import type { ModuleId } from '@/theme/tokens';

import type { Scope } from '@/features/budget/scope';

export type ThemePreference = 'system' | 'light' | 'dark';
export type HomeCardId = 'topCategory' | 'savings' | 'property' | 'rental' | 'works';
export const ALL_HOME_CARDS: HomeCardId[] = ['savings', 'topCategory', 'rental', 'works', 'property'];
export const DEFAULT_HOME_CARDS: HomeCardId[] = ['savings', 'topCategory'];

export interface SettingsState {
  hydrated: boolean;
  onboardingDone: boolean;
  theme: ThemePreference;
  locale: AppLocale;
  demoMode: boolean;
  lockEnabled: boolean;
  /** Modules choisis à l'onboarding. */
  modules: ModuleId[];
  /** Cartes affichées sur l'accueil (ordre d'affichage). */
  homeCards: HomeCardId[];
  couple: boolean;
  /** Périmètre affiché : tout, commun ou une personne (`p:<id>`). */
  scope: Scope;
  splitMode: SplitMode;
  customPctPerson1: number;
  monthStartDay: number;
  currency: string;
  lastExportAt: string | null;
  /** Forçage Premium en développement (jamais actif en production). */
  devPremium: boolean;
  /** Locatif : jours de grâce avant alerte d'impayé. */
  rentalGraceDays: number;
  rentalTmiPct: number;
  rentalRegime: 'micro' | 'reel';
  rentalVacancyWeeks: number;
  landlordName: string;
  landlordAddress: string;
  landlordCity: string;
}

export interface SettingsActions {
  set: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
  patch: (partial: Partial<SettingsState>) => void;
}

const DEFAULTS: SettingsState = {
  hydrated: false,
  onboardingDone: false,
  theme: 'system',
  locale: 'fr',
  demoMode: false,
  lockEnabled: false,
  modules: ['budget'],
  homeCards: DEFAULT_HOME_CARDS,
  couple: false,
  scope: 'all',
  splitMode: 'prorata',
  customPctPerson1: 50,
  monthStartDay: 1,
  currency: 'EUR',
  lastExportAt: null,
  devPremium: false,
  rentalGraceDays: 5,
  rentalTmiPct: 30,
  rentalRegime: 'micro',
  rentalVacancyWeeks: 0,
  landlordName: '',
  landlordAddress: '',
  landlordCity: '',
};

const PERSISTED_KEYS = (Object.keys(DEFAULTS) as (keyof SettingsState)[]).filter((k) => k !== 'hydrated');

export const useSettings = create<SettingsState & SettingsActions>((set) => ({
  ...DEFAULTS,
  set: (key, value) => {
    set({ [key]: value } as Partial<SettingsState>);
    persist(key, value);
  },
  patch: (partial) => {
    set(partial);
    for (const [k, v] of Object.entries(partial)) persist(k as keyof SettingsState, v);
  },
}));

function persist(key: keyof SettingsState, value: unknown): void {
  if (key === 'hydrated') return;
  try {
    kvSet(`settings.${key}`, value);
  } catch (error) {
    console.warn('Impossible de persister le réglage', key, error);
  }
}

/** Charge les préférences depuis SQLite (appelé une fois au démarrage). */
export function hydrateSettings(initialLocale: AppLocale): void {
  const loaded: Partial<SettingsState> = {};
  for (const key of PERSISTED_KEYS) {
    const value = kvGet<SettingsState[typeof key]>(`settings.${key}`);
    if (value !== undefined) (loaded as Record<string, unknown>)[key] = value;
  }
  if (loaded.locale === undefined) loaded.locale = initialLocale;
  useSettings.setState({ ...loaded, hydrated: true });
}

export function getSettings(): SettingsState & SettingsActions {
  return useSettings.getState();
}

export { DEFAULTS as SETTINGS_DEFAULTS };
