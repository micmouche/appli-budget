/**
 * Démarrage de l'application : base de données, préférences, i18n, démo,
 * récurrences échues, achats. Appelé une seule fois par le layout racine.
 */
import { getAppDb, getDemoDb, setDemoActive } from '@/db/client';
import { bumpDataVersion } from '@/db/dataVersion';
import { seedDemo } from '@/db/demo';
import {
  ensureDefaultAccount,
  ensureDefaultCategories,
  ensureHousehold,
  generateDueRecurring,
  generateRentSchedule,
} from '@/db/repositories';
import i18n, { detectLocale, initI18n } from '@/i18n';
import { configurePurchases } from '@/purchases';
import { getSettings, hydrateSettings } from '@/store/settings';
import { preloadSounds } from '@/utils/sound';

let booted = false;

export async function bootstrap(): Promise<void> {
  if (booted) return;
  booted = true;
  // 0. Langue du système (indépendante de la base, pour que l'interface reste lisible même si la base échoue)
  initI18n(detectLocale());
  // 1. Base réelle + préférences
  getAppDb();
  hydrateSettings(detectLocale());
  const settings = getSettings();
  initI18n(settings.locale);
  // 2. Démo
  setDemoActive(settings.demoMode);
  if (settings.demoMode) ensureDemoSeeded();
  // 3. Données par défaut de la base réelle
  ensureDefaultCategories(getAppDb());
  ensureDefaultAccount(i18n.t('budget.accounts.types.checking'), getAppDb());
  if (settings.onboardingDone) {
    ensureHousehold(settings.couple, [i18n.t('common.me'), i18n.t('budget.person2')], getAppDb());
  }
  // 4. Récurrences échues et échéances de loyer (base active)
  generateDueRecurring();
  generateRentSchedule();
  // 5. Achats (asynchrone, non bloquant)
  preloadSounds();
  void configurePurchases();
}

/** Alimente la base de démo si elle est vide. */
export function ensureDemoSeeded(): void {
  const db = getDemoDb();
  const count = db.$client.getFirstSync<{ n: number }>('SELECT count(*) AS n FROM expenses')?.n ?? 0;
  if (count === 0) seedDemo(db);
}

/** Active ou désactive la démo (bascule de base de données). */
export function setDemoMode(enabled: boolean): void {
  getSettings().set('demoMode', enabled);
  setDemoActive(enabled);
  if (enabled) ensureDemoSeeded();
  generateDueRecurring();
  generateRentSchedule();
  bumpDataVersion();
}
