# Pécule — gestion financière du foyer (iOS + Android)

Application Expo / React Native / TypeScript strict, données 100 % locales (SQLite), cinq modules :
Budget (gratuit), Épargne, Immobilier, Locatif, Travaux (Premium via RevenueCat).

## Lancer le projet

```bash
npm install --legacy-peer-deps
npx expo start
```

- **Expo Go** : tout fonctionne sauf les achats intégrés (module natif RevenueCat absent → mode « indisponible », un interrupteur « Simuler Premium (dev) » existe dans Réglages › Premium).
- **Build de développement** (recommandé) : `npx eas-cli@latest build --profile development --platform ios|android`, puis `npx expo start --dev-client`.

## Commandes

| Commande | Rôle |
| --- | --- |
| `npm test` | Tests Jest (calculs financiers, utilitaires) |
| `npm run test:coverage` | Couverture (seuil 95 % sur `src/finance`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (config Expo + règles du compilateur React) |
| `npm run build:dev` / `build:preview` / `build:prod` | EAS Build |
| `npm run submit:ios` / `submit:android` | EAS Submit |
| `npm run icons` | Régénère les icônes et le splash depuis le SVG (Playwright) |
| `npm run legal` | Régénère les pages HTML de confidentialité et CGU |

## Organisation

```
app/                    Routes Expo Router (écrans)
  _layout.tsx           Polices, démarrage, fournisseurs, pile + modales
  onboarding/           3 écrans
  (tabs)/               Accueil · budget/ · epargne/ · immo/ · reglages/
  saisie-rapide.tsx     Modale : dépense en 2 tapes
  paywall.tsx           Modale : offres Premium
src/
  finance/              Calculs purs + tests (prêt, notaire, intérêts composés, locatif, budget, travaux)
  db/                   Schéma Drizzle, migrations SQL, dépôts, démo, sauvegarde JSON
  features/budget/      Hooks, exports CSV/PDF, composants du module Budget
  ui/                   Design system (Text, Card, Button, NumPad, charts…)
  theme/                Jetons clair/sombre, typographie, ThemeProvider
  i18n/                 fr.json (complet), en.json
  purchases/            Adaptateur RevenueCat avec repli
  store/                Préférences (zustand, persistées en SQLite)
  utils/                Formatage, CSV, partage/PDF, haptique
docs/                   Cadrage, design system, notes de livraison, fiches stores, checklist
legal/                  Confidentialité et CGU (Markdown + HTML hébergeables)
scripts/                Génération des icônes et des pages légales
```

## Points à remplacer avant publication

Dans `app.json` : `ios.bundleIdentifier`, `android.package`, `extra.eas.projectId`, `updates.url`,
`extra.revenueCat.*`, `extra.links.*`. Dans `eas.json` : identifiants Apple et chemin du compte de service Google Play.
Les pages `legal/*.md` contiennent des champs entre crochets à compléter (éditeur, SIREN, e-mail), puis `npm run legal`.

> Avertissement affiché dans l'app : « Simulation indicative, ne constitue pas un conseil financier. »
