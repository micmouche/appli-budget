# Livraison — Lot 0 (socle) et Lot 1 (Budget)

Date : 10 novembre 2026 · Expo SDK 58 · React Native 0.88 · TypeScript 6 (strict)

## Ce qui est livré

### Socle (lot 0)
- Projet Expo Router, TypeScript strict (`noUncheckedIndexedAccess`), alias `@/`.
- Thème clair / sombre (jetons validés), typographie Manrope + Inter, 24 composants UI (`src/ui`), graphiques Skia (donut, barres, sparkline).
- SQLite via Drizzle : schéma typé, migrations SQL versionnées (`PRAGMA user_version`), deux bases (réelle et démo), préférences persistées, export / import JSON versionné.
- i18n : français complet, anglais préparé, formats `fr-FR` (monnaie, dates).
- Onboarding en 3 écrans (promesse, usage principal, seul / couple + démo), accueil tableau de bord (solde, variation, sparkline 6 mois, alertes, tuiles par module ordonnées selon l'onboarding, rappel d'export), réglages (apparence, données, sécurité biométrique, à propos, Premium).
- Verrou Premium (`PremiumGate`) et adaptateur RevenueCat avec repli (Expo Go) + interrupteur « Simuler Premium » en développement.
- Verrouillage Face ID / empreinte avec re-verrouillage après 30 s en arrière-plan.
- Jeu de démo déterministe : couple Camille & Hugo, 6 mois de dépenses, enveloppes, récurrences.
- `app.json` / `eas.json` prêts (permissions minimales, manifeste de confidentialité iOS, profils development / preview / production).

### Budget (lot 1)
- Saisie en 2 tapes (montant au pavé numérique → tap catégorie = enregistré), toast avec « Annuler ».
- Catégories (16 par défaut, personnalisables : nom, icône, couleur, enveloppe) ; suppression avec déplacement vers « Autres ».
- Enveloppes avec alertes à 80 % et 100 % (accueil + écran budget).
- Dépenses récurrentes (hebdo / mensuel / annuel) générées automatiquement au lancement, avec rattrapage.
- Foyer : 1 ou 2 personnes, revenus, répartition 50/50, prorata, personnalisée ; jour de début du mois budgétaire (jour de paie).
- Règlement du mois « qui doit quoi », marquage réglé, historique.
- Donut par catégorie, barres 6 / 12 mois, filtres par catégorie, regroupement par jour.
- Export CSV (Excel FR : `;` + BOM) et PDF de synthèse.

### Calculs financiers (`src/finance`, 51 tests)
Mensualité et amortissement, TAEG approché, capacité d'emprunt HCSF 35 %, frais de notaire (barème, DMTO ancien / neuf), intérêts composés, versement pour objectif, rentabilités brute / nette / nette-nette, IRL, répartition couple, enveloppes, TVA travaux. Montants en centimes entiers.

## Vérifications effectuées

| Vérification | Résultat |
| --- | --- |
| `tsc --noEmit` | 0 erreur |
| `expo lint` | 0 erreur, 0 avertissement |
| `jest` | 64 tests verts (11 suites) |
| Couverture `src/finance` | 95,7 % instructions, 88,3 % branches, 98,4 % fonctions |
| `expo export` iOS + Android | bundles Hermes générés sans erreur |

Non vérifié ici (pas de simulateur dans cet environnement) : le rendu réel sur appareil. À faire par vous : `npx expo start` puis scanner avec Expo Go, ou un build de développement EAS.

## Ce que vous devez vérifier sur votre téléphone
1. Onboarding → « Découvrir avec la démo » → l'accueil affiche le couple Camille & Hugo.
2. Bouton « + » : taper `42,30` puis « Alimentation » → toast, la dépense apparaît.
3. Budget › icône en haut à droite › Foyer : passer en prorata et vérifier « Camille doit … à Hugo ».
4. Budget › icônes CSV / PDF : la feuille de partage s'ouvre avec le fichier.
5. Réglages › Données : export JSON, puis import du même fichier.
6. Réglages › Apparence : mode sombre, anglais.

## Décisions techniques à connaître
- Migrations écrites à la main dans `src/db/migrations.ts` (pas de drizzle-kit) : moins de configuration Babel/Metro, lisible, versionné.
- Préférences dans la table `settings` de la base réelle ; la démo bascule uniquement la base de données métier.
- Les prix affichés dans le paywall sont indicatifs ; le flux d'achat passe par le paywall natif RevenueCat (prix réels du store).
- `expo install` est bloqué par le proxy de cet environnement : les versions ont été prises dans `expo/bundledNativeModules.json` (équivalent). `npm install --legacy-peer-deps` est nécessaire (conflit de peer dependency react-dom du gabarit Expo).

## Lot suivant
Lot 2 — Épargne : comptes, mouvements, objectifs, simulateur d'intérêts composés (calculs déjà prêts et testés).
