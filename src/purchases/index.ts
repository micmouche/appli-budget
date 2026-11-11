/**
 * Achats intégrés via RevenueCat, avec repli gracieux :
 * - en Expo Go / simulateur / web, le module natif est absent → mode « indisponible » ;
 * - en développement, un interrupteur `devPremium` (Réglages) simule Premium.
 *
 * Entitlement unique : `premium`. Offre : `default` (mensuel, annuel, à vie).
 * Les clés API publiques sont lues dans app.json → expo.extra.revenueCat.
 */
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { create } from 'zustand';

import { getSettings, useSettings } from '@/store/settings';

export const ENTITLEMENT_ID = 'premium';

type PurchasesModule = typeof import('react-native-purchases').default;
type PurchasesUiModule = typeof import('react-native-purchases-ui').default;

let Purchases: PurchasesModule | null = null;
let PurchasesUI: PurchasesUiModule | null = null;

function loadNativeModules(): boolean {
  if (Purchases) return true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Purchases = require('react-native-purchases').default as PurchasesModule;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    PurchasesUI = require('react-native-purchases-ui').default as PurchasesUiModule;
    return true;
  } catch {
    Purchases = null;
    PurchasesUI = null;
    return false;
  }
}

interface PremiumState {
  /** true si l'entitlement est actif côté store (hors forçage dev). */
  entitled: boolean;
  configured: boolean;
  available: boolean;
  loading: boolean;
}

export const usePremiumStore = create<PremiumState>(() => ({
  entitled: false,
  configured: false,
  available: false,
  loading: false,
}));

function apiKey(): string | undefined {
  const extra = (Constants.expoConfig?.extra ?? {}) as { revenueCat?: { ios?: string; android?: string } };
  return Platform.OS === 'ios' ? extra.revenueCat?.ios : extra.revenueCat?.android;
}

/** À appeler une fois au démarrage. Sans clé ni module natif, reste silencieux. */
export async function configurePurchases(): Promise<void> {
  const key = apiKey();
  if (!key || key.startsWith('REPLACE_') || !loadNativeModules() || !Purchases) {
    usePremiumStore.setState({ available: false, configured: false });
    return;
  }
  try {
    Purchases.configure({ apiKey: key });
    usePremiumStore.setState({ available: true, configured: true });
    Purchases.addCustomerInfoUpdateListener((info) => {
      usePremiumStore.setState({ entitled: Boolean(info.entitlements.active[ENTITLEMENT_ID]) });
    });
    const info = await Purchases.getCustomerInfo();
    usePremiumStore.setState({ entitled: Boolean(info.entitlements.active[ENTITLEMENT_ID]) });
  } catch (error) {
    console.warn('RevenueCat non configuré', error);
    usePremiumStore.setState({ available: false });
  }
}

/** Présente le paywall RevenueCat natif. Retourne true si Premium est actif après fermeture. */
export async function presentPaywall(): Promise<boolean> {
  const state = usePremiumStore.getState();
  if (!state.available || !PurchasesUI || !Purchases) return false;
  usePremiumStore.setState({ loading: true });
  try {
    await PurchasesUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: ENTITLEMENT_ID,
      displayCloseButton: true,
    });
    const info = await Purchases.getCustomerInfo();
    const entitled = Boolean(info.entitlements.active[ENTITLEMENT_ID]);
    usePremiumStore.setState({ entitled });
    return entitled;
  } finally {
    usePremiumStore.setState({ loading: false });
  }
}

export async function restorePurchases(): Promise<boolean> {
  if (!usePremiumStore.getState().available || !Purchases) return false;
  const info = await Purchases.restorePurchases();
  const entitled = Boolean(info.entitlements.active[ENTITLEMENT_ID]);
  usePremiumStore.setState({ entitled });
  return entitled;
}

export async function presentCustomerCenter(): Promise<void> {
  if (!usePremiumStore.getState().available || !PurchasesUI) return;
  await PurchasesUI.presentCustomerCenter();
}

/**
 * Déverrouillage de test : défini à la compilation (EXPO_PUBLIC_TEST_UNLOCK=1) uniquement
 * pour les builds de test internes. Jamais défini pour les builds destinés aux stores.
 */
export const TEST_UNLOCK = process.env.EXPO_PUBLIC_TEST_UNLOCK === '1';

/** Premium effectif : entitlement store, déverrouillage de test, ou forçage développeur. */
export function isPremiumNow(): boolean {
  const { entitled } = usePremiumStore.getState();
  return entitled || TEST_UNLOCK || (__DEV__ && getSettings().devPremium);
}

export function usePremium(): { isPremium: boolean; available: boolean; loading: boolean } {
  const entitled = usePremiumStore((s) => s.entitled);
  const available = usePremiumStore((s) => s.available);
  const loading = usePremiumStore((s) => s.loading);
  const devPremium = useSettings((s) => s.devPremium);
  return { isPremium: entitled || TEST_UNLOCK || (__DEV__ && devPremium), available, loading };
}
