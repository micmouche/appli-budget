# Livraison — Lots 6 (finitions) et 7 (publication)

Date : 11 novembre 2026

## Lot 6 — Finitions
- **Icône définitive** : monogramme « P » sur pièce vert profond `#1E5A48`, fond crème ; variantes iOS clair, sombre et teinté (iOS 18), icône adaptative Android (premier plan + fond vert + monochrome), splash transparent, favicon. Générées depuis un SVG par `npm run icons` (script `scripts/render-icons.js`, Chromium via Playwright) : modifiables à volonté.
- `app.json` : variantes d'icônes branchées, splash clair / sombre, permissions minimales, manifeste de confidentialité iOS, `allowBackup: false` sur Android (les données ne partent pas dans les sauvegardes Google non chiffrées).
- Écran « page introuvable », script d'icônes et script de pages légales ajoutés au projet.
- `expo-doctor` : 18 contrôles sur 20 passés ; les 2 restants nécessitent l'accès réseau à l'API Expo (bloqué dans cet environnement), à relancer chez vous : `npx expo-doctor`.

## Lot 7 — Publication
- **`legal/`** : politique de confidentialité et CGU en français (Markdown + HTML autonomes, clair/sombre, hébergeables sur GitHub Pages ou n'importe quel hébergeur). Champs entre crochets à compléter : identité de l'éditeur, SIREN, adresse, e-mail, médiateur. Régénération des HTML : `npm run legal`.
- **`docs/08-fiches-stores.md`** : nom, sous-titre, mots-clés (99 caractères), texte promotionnel, descriptions courte et longue, nouveautés, plan et textes des 8 captures, note pour la relecture, réponses complètes aux questionnaires **App Privacy** (Apple) et **Sécurité des données** (Google), liste des 3 produits d'achat intégré à créer.
- **`docs/09-checklist-publication.md`** : 10 étapes depuis un navigateur (comptes, GitHub, GitHub Pages, Expo/EAS avec intégration GitHub, App Store Connect, Google Play Console, RevenueCat, fiches, builds, TestFlight et test interne, règle des 12 testeurs Google, soumission, après-lancement), avec la liste de tests sur téléphone.

## Vérifications
| Contrôle | Résultat |
| --- | --- |
| `tsc --noEmit` | 0 erreur |
| `expo lint` | 0 erreur, 0 avertissement |
| `jest` | 83 tests verts (15 suites) |
| `expo export` iOS + Android | bundles générés sans erreur |

## État global du projet
Les 7 lots sont livrés. L'application est complète : socle, Budget (gratuit), Épargne, Immobilier, Locatif, Travaux, monétisation RevenueCat, icônes, textes légaux, fiches des stores, checklist.

Ce qui reste et ne dépend que de vous :
1. Vérifier le nom, créer les comptes (étapes 0 et 1 de la checklist).
2. Me donner le dépôt GitHub pour y pousser le code.
3. Compléter les crochets des pages légales et des fiches.
4. Lancer les builds depuis expo.dev, tester sur votre téléphone, me remonter les éventuels bugs.
