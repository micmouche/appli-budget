/**
 * Compteur de version des données : chaque écriture l'incrémente, les hooks de
 * lecture s'y abonnent pour se recharger. Simple et suffisant pour une base locale.
 */
import { create } from 'zustand';

interface DataVersionState {
  version: number;
  bump: () => void;
}

export const useDataVersion = create<DataVersionState>((set) => ({
  version: 0,
  bump: () => set((s) => ({ version: s.version + 1 })),
}));

export function bumpDataVersion(): void {
  useDataVersion.getState().bump();
}
