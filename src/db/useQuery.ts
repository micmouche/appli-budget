/**
 * Hook de lecture synchrone (SQLite est rapide en local) qui se recharge quand
 * la version des données change ou quand les dépendances changent.
 */
import { useMemo } from 'react';

import { useDataVersion } from './dataVersion';

export function useQuery<T>(query: () => T, deps: readonly unknown[]): T {
  const version = useDataVersion((s) => s.version);
  const key = `${version}|${JSON.stringify(deps)}`;
  // La fonction `query` est volontairement exclue : seule la clé (version + dépendances) déclenche un rechargement.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => query(), [key]);
}
