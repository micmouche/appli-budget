# Note de cadrage — application mobile de gestion financière du foyer

> Version 0.1 — 10 novembre 2026 — à valider avant démarrage du code.
> Les points marqués **[DÉCISION]** attendent votre arbitrage ; une recommandation est donnée à chaque fois.

---

## 1. Vision et positionnement

**Promesse** : « Toute la gestion financière de votre foyer dans une seule application, sans compte, sans banque connectée, sans publicité. »

Une application iOS + Android qui réunit les cinq fichiers Excel vendus sur Etsy en cinq **modules** cohérents, reliés par un tableau de bord unique :

| Module | Fichier Excel d'origine | Rôle dans l'app |
|---|---|---|
| Budget | Budget de couple | Dépenses, revenus, répartition, catégories |
| Épargne | Tracker d'épargne | Comptes, objectifs, intérêts composés |
| Immobilier | Simulateur immobilier | Capacité d'emprunt, mensualités, frais de notaire, scénarios |
| Locatif | Gestionnaire locatif | Logements, locataires, loyers, rentabilité, quittances |
| Travaux | Gestionnaire de travaux | Lots, devis, échéancier, planning |

**Ce qui nous différencie des apps bancaires (Bankin', Linxo, Finary, etc.)**

- Aucune connexion bancaire : zéro friction d'inscription, zéro risque perçu, zéro serveur. Argument RGPD fort (« vos données ne quittent jamais votre téléphone »).
- Spécifique France : règle HCSF des 35 %, frais de notaire ancien/neuf, Livret A/LDDS/PEL/PEA, quittances de loyer conformes, TVA travaux.
- Les cinq usages d'un foyer qui construit son patrimoine (budget → épargne → achat → location → travaux), là où chaque concurrent n'en couvre qu'un.
- Modèle économique lisible : un module gratuit complet, un Premium sans publicité ni revente de données.

**Hors périmètre v1** (à dire explicitement pour tenir le planning) : synchronisation multi-appareils, partage de compte entre conjoints en temps réel, agrégation bancaire, comptabilité professionnelle (SCI à l'IS, LMNP avec amortissements), widgets, Apple Watch. Ces points constituent la feuille de route v2 (voir § 9).

---

## 2. Personas

### P1 — Camille (29) & Hugo (31), couple en concubinage, Lyon
- Deux salaires inégaux (2 100 € / 2 900 € nets). Loyer, courses, abonnements partagés.
- **Douleur** : disputes sur « qui paie quoi », tableur partagé illisible sur mobile, oubli de dépenses.
- **Attente** : saisir une dépense en 5 secondes au supermarché, voir en fin de mois qui doit combien à l'autre, répartition au prorata des revenus.
- **Modules** : Budget (gratuit), puis Épargne quand ils commencent à constituer un apport.
- **Déclencheur Premium** : objectif commun « apport appartement » + simulateur immobilier.

### P2 — Nadia (34), cadre célibataire, Paris
- 3 400 € nets, épargne dispersée (Livret A plein, LDDS, PEA débutant, assurance-vie).
- **Douleur** : ne sait pas combien elle a au total ni quand elle pourra acheter.
- **Attente** : vue consolidée de l'épargne, projection à 5 ans, capacité d'emprunt réaliste avec la règle des 35 %.
- **Modules** : Épargne + Immobilier. Budget utilisé « en lecture » pour connaître son reste à vivre.
- **Déclencheur Premium** : sauvegarder et comparer plusieurs scénarios d'achat.

### P3 — Thomas (45), propriétaire-bailleur de deux appartements, Nantes
- Loue deux T2 en nu, gère seul (pas d'agence). Déclare en micro-foncier / réel simplifié.
- **Douleur** : relances d'impayés oubliées, quittances faites à la main dans Word, pas de vision de la rentabilité nette.
- **Attente** : alerte quand un loyer n'est pas encaissé au 5 du mois, quittance PDF en un tap, export CSV pour la déclaration 2044.
- **Modules** : Locatif (cœur), Travaux (remise en état entre deux locataires), Épargne (trésorerie).
- **Déclencheur Premium** : immédiat, c'est son outil de travail.

### P4 — Sophie (38) & Marc (40), achat d'une maison à rénover, périphérie de Bordeaux
- Compromis signé, 60 000 € de travaux, 4 artisans, 3 devis par lot.
- **Douleur** : dépassement de budget invisible jusqu'à la fin, acomptes payés sans suivi, planning qui glisse.
- **Attente** : budget par lot (plomberie, électricité, cuisine…), comparateur de devis, échéancier d'acomptes, alertes d'échéances.
- **Modules** : Travaux + Immobilier (ils ont utilisé le simulateur avant l'achat) + Budget.
- **Déclencheur Premium** : Travaux dès le premier devis.

### Anti-persona
Agence immobilière, SCI avec comptable, professionnel du bâtiment : besoins de comptabilité, multi-utilisateurs, facturation. On refuse ce périmètre pour garder une app simple et éviter les demandes de fonctionnalités « pro ».

---

## 3. Fonctionnalités par module

Légende : **V1** = livré dans la première version soumise aux stores · **V1.x** = mise à jour rapide après lancement · 🔒 = Premium (selon l'option retenue au § 4).

### 3.0 Socle transversal (V1)
- Onboarding 3 écrans : promesse → « Quel est votre usage principal ? » (choix multiple parmi les 5 modules) → mode démo ou départ à vide. L'ordre des cartes de l'accueil et l'onglet par défaut dépendent de la réponse.
- Accueil « tableau de bord » : solde du mois (revenus − dépenses), épargne totale, progression des objectifs, alertes (loyer impayé, échéance de travaux, objectif atteint, budget de catégorie dépassé).
- Bouton flottant « + » : saisie d'une dépense en 2 tapes (montant au pavé numérique → tap sur une catégorie = enregistré).
- Données de démo : jeu cohérent (un couple, 4 comptes d'épargne, 2 scénarios immo, 2 logements loués, 1 chantier) activable/désactivable sans écraser les données réelles (base séparée).
- Export / import JSON complet (sauvegarde et portabilité RGPD) via la feuille de partage système. Import avec aperçu et confirmation.
- Export CSV par tableau, export PDF (quittance, synthèse budget, tableau d'amortissement, synthèse travaux).
- Mode clair / sombre (suit le système, forçable), tailles de texte dynamiques, contrastes AA, labels d'accessibilité sur tous les contrôles.
- Verrouillage par biométrie / code (Face ID, Touch ID, empreinte) — optionnel, données déjà locales.
- Réglages : devise (€ par défaut), premier jour du mois budgétaire (ex. le 25, jour de paie), langue (fr, en préparé), thème, gestion de l'abonnement, politique de confidentialité, CGU, « Noter l'app », « Contacter le support ».
- Avertissement systématique sous chaque simulateur : « Simulation indicative, ne constitue pas un conseil financier. »

### 3.1 Budget (module gratuit)
**V1**
- Foyer : 1 ou 2 personnes, revenus nets mensuels de chacun (plusieurs sources possibles : salaire, prime, aides).
- Mode de répartition des dépenses communes : 50/50, prorata des revenus, pourcentage personnalisé.
- Dépenses : montant, catégorie (16 catégories par défaut avec icônes, personnalisables), date, payeur, commune / personnelle, note, récurrence (mensuelle, hebdomadaire, annuelle).
- Dépenses récurrentes générées automatiquement (loyer, abonnements) avec confirmation.
- Budgets par catégorie (enveloppes) avec barre de progression et alerte à 80 % / 100 %.
- Vue mensuelle : donut par catégorie, barres revenus/dépenses des 6 derniers mois, liste filtrable (catégorie, payeur, recherche).
- Règlement du mois : « Camille doit 143,50 € à Hugo » calculé d'après la répartition et les paiements effectués, avec bouton « marquer comme réglé ».
- Export CSV du mois et PDF de synthèse.

**V1.x**
- Catégories multi-niveaux, pièces jointes (photo de ticket), modèles de dépenses favorites.

### 3.2 Épargne 🔒
**V1**
- Comptes : Livret A, LDDS, LEP, PEL, CEL, livret bancaire, assurance-vie (fonds €/UC), PEA, compte-titres, crypto, autre. Plafond réglementaire pré-rempli et alerte quand il est proche (Livret A 22 950 €, LDDS 12 000 €, LEP 10 000 €, à maintenir dans un fichier de constantes).
- Mouvements : versement, retrait, intérêts/plus-value, avec historique et courbe de l'encours total.
- Objectifs : nom, montant cible, date cible, comptes rattachés, suggestion de versement mensuel pour tenir la date, projection « atteint le … » au rythme actuel.
- Simulateur d'intérêts composés : capital initial, versement périodique (début/fin de période), taux annuel, durée, fréquence de capitalisation ; tableau année par année (versé, intérêts, total) et courbe ; export CSV.
- Taux de référence pré-remplis (Livret A, LDDS, LEP) modifiables par l'utilisateur, avec date de validité affichée.

**V1.x**
- Répartition par classe d'actif (sécurisé / dynamique), fiscalité simplifiée (PFU 30 % vs livrets exonérés).

### 3.3 Immobilier (simulateur) 🔒 (voir option « calculs gratuits, sauvegarde Premium » au § 4)
**V1**
- Capacité d'emprunt : revenus nets du foyer, charges de crédit existantes, loyer conservé ou non, taux d'endettement maximal (35 % HCSF par défaut, modifiable), taux nominal, assurance (% du capital ou mensualité fixe), durée (max 25 ans par défaut) → mensualité max, capital empruntable, prix d'achat max avec apport et frais.
- Mensualité et coût total d'un prêt : capital, taux, durée, assurance, frais de dossier et de garantie → mensualité, intérêts totaux, TAEG approché, tableau d'amortissement complet (export CSV/PDF).
- Frais de notaire : ancien vs neuf, barème des émoluments par tranche, droits de mutation (taux départemental par défaut 4,50 % + taxe communale + prélèvement État), débours forfaitaires, avec affichage du détail et avertissement d'estimation.
- Comparateur de scénarios : jusqu'à N scénarios sauvegardés et comparés côte à côte (prix, apport, durée, taux, mensualité, coût total, reste à vivre).
- Reste à vivre et taux d'endettement après projet, code couleur vert/orange/rouge.

**V1.x**
- Simulation de renégociation / remboursement anticipé, prêt à taux zéro (PTZ) simplifié, prêt relais.

### 3.4 Locatif 🔒
**V1**
- Logements : adresse, type, surface, prix d'achat, frais d'acquisition, travaux initiaux, charges annuelles (taxe foncière, copropriété, assurance PNO, gestion), crédit associé (mensualité).
- Locataires et baux : nom, date d'entrée/sortie, loyer hors charges, provisions pour charges, dépôt de garantie, jour d'exigibilité, indexation IRL (saisie manuelle de l'indice, calcul de la révision).
- Loyers : échéances générées automatiquement chaque mois ; statut attendu / encaissé / partiel / impayé ; alerte dans l'accueil au-delà du jour d'exigibilité + délai paramétrable.
- Quittance de loyer PDF conforme (mentions obligatoires, période, détail loyer/charges, signature bailleur en texte) et reçu partiel, partage par e-mail/messagerie.
- Rentabilité : brute, nette de charges, nette-nette approximative (option : après impôt estimé au TMI choisi, micro-foncier 30 % ou réel) ; cash-flow mensuel.
- Tableau annuel pour la déclaration : loyers encaissés, charges déductibles par nature, export CSV.

**V1.x**
- Régularisation annuelle des charges, états des lieux (check-list), relances par modèle de message.

### 3.5 Travaux 🔒
**V1**
- Chantiers (projets) : nom, logement lié (optionnel), budget global, dates prévues.
- Lots : plomberie, électricité, maçonnerie, menuiserie, peinture, cuisine, salle de bain, isolation, etc. ; budget prévu par lot ; TVA (20 %, 10 % rénovation, 5,5 % rénovation énergétique) appliquée par ligne.
- Devis : par lot, artisan, montant HT/TVA/TTC, statut (reçu, retenu, refusé) ; comparateur de devis par lot avec écart au budget.
- Échéancier de paiements : acomptes, situations intermédiaires, solde ; statut prévu / payé ; alertes d'échéance dans l'accueil.
- Planning : date de début/fin par lot, vue chronologique simple (barres par semaine), détection de retard.
- Dashboard chantier : engagé vs budget, payé vs engagé, reste à payer, par lot et au global ; export PDF de synthèse.

**V1.x**
- Photos avant/après, suivi des garanties (parfait achèvement, décennale), import d'un devis par scan.

---

## 4. Découpage gratuit / Premium **[DÉCISION]**

Le principe (gratuit = Budget) est posé. Trois façons de le mettre en œuvre :

### Option A — « Un module gratuit, quatre Premium » (simple)
- Gratuit : Budget complet + accueil + export/import JSON + démo.
- Premium : Épargne, Immobilier, Locatif, Travaux, export CSV/PDF.
- ✅ Message limpide, implémentation la plus simple, cohérent avec l'offre Etsy (un fichier = un module).
- ❌ Le simulateur immobilier, meilleur aimant ASO (« simulateur prêt immobilier » est très recherché), reste caché derrière le paywall : perte d'acquisition.

### Option B — « Tout visible, limité en volume »
- Tous les modules ouverts, mais plafonnés : 1 objectif d'épargne, 1 scénario immo, 1 logement, 1 chantier, pas d'export PDF.
- ✅ Meilleure découverte, conversion à l'usage (« vous avez atteint la limite »).
- ❌ Plus complexe à expliquer et à coder (limites partout), perception « bridée », risque d'avis négatifs.

### Option C — « Budget gratuit + calculateurs gratuits, sauvegarde et gestion Premium » **(recommandée)**
- Gratuit : Budget complet ; simulateurs utilisables sans sauvegarde (capacité d'emprunt, mensualité, frais de notaire, intérêts composés) ; export/import JSON ; démo.
- Premium : Épargne (comptes, objectifs), Immobilier (sauvegarde + comparateur de scénarios + amortissement exportable), Locatif, Travaux, exports CSV/PDF.
- ✅ Capte le trafic ASO des simulateurs, montre la qualité de l'app, garde une frontière claire : « calculer est gratuit, gérer et conserver est Premium ».
- ❌ Un peu plus de travail d'écran (états « résultat non sauvegardé » + incitation).

**Dans tous les cas** : pas de publicité, pas de limite de durée sur le gratuit, et l'import/export JSON reste gratuit (portabilité RGPD, confiance).

---

## 5. Prix recommandés pour le marché français **[DÉCISION]**

Repères : les apps de gestion de budget françaises grand public se situent entre 3 et 6 € par mois ou 25 à 60 € par an ; les outils patrimoniaux « premium » montent à 10–15 € par mois. Vos fichiers Etsy fixent un ancrage psychologique : l'achat à vie doit rester proche du prix du « pack » de vos cinq fichiers. Apple et Google prélèvent 15 % la première année en dessous d'1 M$ de revenus (programmes petits développeurs, inscription à faire), puis 15 % sur les abonnements conservés plus d'un an.

| | Option 1 « Accessible » | Option 2 « Équilibrée » **(recommandée)** | Option 3 « Premium » |
|---|---|---|---|
| Mensuel | 3,99 € | 4,99 € | 6,99 € |
| Annuel | 24,99 € (≈ 2,08 €/mois, −48 %) | 29,99 € (≈ 2,50 €/mois, −50 %) | 44,99 € (≈ 3,75 €/mois, −46 %) |
| À vie | 59,99 € | 79,99 € | 119,99 € |
| Essai gratuit | 7 jours sur l'annuel | 7 jours sur l'annuel | 14 jours sur l'annuel |
| Positionnement | volume, conversion facile | marge correcte, crédible face aux apps bancaires | niche bailleurs/investisseurs |

Arguments pour l'option 2 : l'annuel à 29,99 € est le prix « sans réfléchir » en France (ordre de grandeur d'un an de Bankin' ou Linxo Premium), le mensuel à 4,99 € est 2 fois le prix d'un café ce qui facilite la conversion, et le « à vie » à 79,99 € est l'équivalent de 2,7 années d'abonnement : il rassure les allergiques à l'abonnement tout en protégeant le revenu récurrent. Prévoir un **prix de lancement** à vie à 49,99 € pendant 30 jours (offre introductory configurée dans RevenueCat) pour vos clients Etsy, avec un code promo distribué dans vos fiches Etsy.

Mécanique proposée dans RevenueCat : entitlement unique `premium` ; offering `default` avec trois packages (`$rc_monthly`, `$rc_annual`, `$rc_lifetime`) ; paywall natif présentant l'annuel en premier avec badge « Le plus choisi », mensuel ensuite, à vie en bas.

---

## 6. Nom de l'application **[DÉCISION]**

Critères : prononçable en français, 1 ou 2 mots, pas de confusion avec une banque, disponible comme nom d'app (App Store refuse les doublons exacts), domaine .fr ou .app disponible pour héberger confidentialité/CGU, dépôt INPI possible en classe 9/36/42. **Je n'ai pas vérifié les disponibilités : à faire avant de trancher** (recherche App Store + Google Play + INPI + nom de domaine).

| Nom | Sous-titre App Store (30 car. max) | Pour | Contre |
|---|---|---|---|
| **Pécule** (recommandé) | « Budget, épargne, immo, loyers » | Mot français chaleureux et rare, évoque l'épargne et le patrimoine du foyer, marque forte, se décline (« mon pécule ») | Accent sur le « é » (prévoir `pecule` pour le domaine et le bundle ID), ne dit pas « budget » |
| **Les Bons Comptes** | « Budget de couple & patrimoine » | Proverbe connu (« font les bons amis »), parfait pour le budget de couple, humain | Long, générique pour l'ASO, moins crédible pour locatif/travaux |
| **Foyer Finances** | « Budget, épargne et immobilier » | Descriptif, ASO direct sur « finances », explicite | Froid, nom difficile à protéger, ressemble à un template |

Bundle ID proposé (à adapter à votre raison sociale) : `fr.<votresociete>.pecule` (iOS et Android identiques).

---

## 7. Architecture technique (synthèse, détaillée au moment du code)

- **Expo SDK courant** au moment de la création du projet (`npx create-expo-app@latest`), React Native, TypeScript `strict`, **Expo Router** (routes typées), New Architecture activée.
- **Données** : `expo-sqlite` + **Drizzle ORM** (schéma typé, migrations versionnées embarquées, requêtes testables). Deux bases : `app.db` (réel) et `demo.db` (démo), basculables sans mélange.
- **État** : Zustand pour l'état d'interface (thème, module actif, premium), données lues via des hooks de dépôt (`useExpenses(month)`) avec invalidation simple.
- **Calculs financiers** : package interne `src/finance/` en TypeScript pur, zéro dépendance React : `loan.ts` (mensualité, amortissement, capacité), `notary.ts`, `compound.ts`, `rental.ts`, `budget.ts` (répartition), `works.ts` (TVA, écarts). Montants manipulés en **centimes entiers** pour éviter les erreurs flottantes, arrondis bancaires documentés. Chaque fichier a son `*.test.ts` Jest avec cas de référence vérifiés à la main (ex. 200 000 € à 3,5 % sur 20 ans → 1 159,92 €/mois).
- **Graphiques** : `victory-native` (Skia + Reanimated) pour donut, courbes et barres animés ; palette validée (voir design system).
- **Animations / haptique** : `react-native-reanimated`, `react-native-gesture-handler`, `expo-haptics`, `@gorhom/bottom-sheet`.
- **Achats** : `react-native-purchases` (RevenueCat) + `react-native-purchases-ui` (paywall), entitlement `premium`, restauration des achats, vérification hors ligne via cache RevenueCat.
- **i18n** : `i18next` + `react-i18next` + `expo-localization`, fichiers `fr.json` (complet) et `en.json` (squelette), formatage monnaie/dates via `Intl` (`fr-FR`).
- **Export** : `expo-file-system`, `expo-sharing`, `expo-print` (PDF via HTML), CSV généré en interne (séparateur `;`, encodage UTF‑8 avec BOM pour Excel français).
- **Sécurité** : `expo-local-authentication` (biométrie), `expo-secure-store` pour le flag de verrouillage.
- **Qualité** : ESLint + Prettier, Jest (`jest-expo`), tests des calculs à 100 % de couverture, tests de composants ciblés (saisie rapide, paywall gating).
- **Build** : EAS Build (profils `development`, `preview`, `production`), EAS Submit, EAS Update pour les correctifs JS sans resoumission.

---

## 8. Plan de livraison du code (après validation du cadrage)

| Lot | Contenu | Critère de fin |
|---|---|---|
| 0 — Socle | Projet Expo, Router, thème clair/sombre, design system (composants), SQLite + migrations, i18n, démo, onboarding, accueil vide, réglages, tests Jest configurés | `npx expo start` affiche l'onboarding puis l'accueil ; tests verts |
| 1 — Budget | Modèle, saisie 2 tapes, catégories, récurrences, répartition couple, donut/barres, export CSV/PDF | Persona P1 utilisable de bout en bout |
| 2 — Épargne | Comptes, mouvements, objectifs, intérêts composés + tests, courbe | Persona P2 partiellement |
| 3 — Immobilier | Capacité, mensualité, amortissement, notaire, scénarios + tests | Persona P2 complète |
| 4 — Locatif | Logements, baux, échéances, alertes, quittance PDF, rentabilité + tests | Persona P3 |
| 5 — Travaux | Chantiers, lots, devis, échéancier, planning + tests | Persona P4 |
| 6 — Monétisation & finitions | RevenueCat, paywall, gating, biométrie, import JSON, accessibilité, micro-animations, icône/splash | App complète en TestFlight / test interne |
| 7 — Publication | app.json / eas.json finaux, confidentialité + CGU, fiches stores, questionnaires de confidentialité, checklist | Soumission possible |

Chaque lot est livré avec ses tests et une courte note « ce qui a été fait / ce que vous devez vérifier ».

---

## 9. Feuille de route v2 (hors périmètre, pour décision ultérieure)
Synchronisation iCloud/Google Drive chiffrée, partage du foyer entre deux téléphones, widgets iOS/Android, import CSV bancaire, notifications locales programmées (échéances), version anglaise complète, mode tablette.

---

## 10. Risques et points d'attention

- **Validation Apple (règle 3.1.1 et 2.1)** : les achats doivent passer par l'App Store (RevenueCat le garantit) ; le relecteur doit pouvoir tester toute l'app → la démo et un code promo de test RevenueCat (ou un compte sandbox) sont indispensables. Le bouton « Restaurer les achats » est obligatoire.
- **Conseil financier** : l'app ne doit pas se présenter comme un conseil ; mention systématique « simulation indicative », pas de recommandation d'achat de produit financier. Évite la catégorie « Finance » réglementée : on reste dans « Finance » côté store mais sans service financier au sens légal.
- **Exactitude des constantes françaises** : taux Livret A, plafonds, barème notarial, seuils HCSF évoluent. Toutes dans `src/finance/constants.fr.ts` avec date de validité, modifiables par l'utilisateur, mises à jour via EAS Update sans resoumission.
- **Google Play, compte développeur personnel** : depuis 2023, un compte personnel créé récemment doit faire tester l'app par au moins 12 testeurs pendant 14 jours avant la production. Prévoir ce délai (voir checklist finale) ou créer un compte « organisation » (nécessite SIREN et D‑U‑N‑S côté Apple).
- **Pas de Mac** : tout passe par EAS Build/Submit ; les tests iOS réels se font via TestFlight sur votre iPhone (indispensable d'avoir un iPhone ou un testeur).
- **RGPD** : données locales, pas de traceur ; RevenueCat reçoit un identifiant anonyme et les reçus d'achat → à déclarer dans la politique de confidentialité et les questionnaires stores (prévu dans le livrable 6).
- **Perte de données** : local uniquement signifie que la désinstallation efface tout. Rappel d'export mensuel (bannière douce) et export JSON facile ; v2 : sauvegarde cloud chiffrée.

---

## 11. Décisions attendues de votre part

1. Découpage gratuit / Premium : option A, B ou **C** (§ 4).
2. Grille de prix : option 1, **2** ou 3, et prix de lancement à vie oui/non (§ 5).
3. Nom : **Pécule**, Les Bons Comptes, Foyer Finances, ou autre (§ 6) — après vérification des disponibilités.
4. Confirmation du périmètre V1 / V1.x des § 3.1 à 3.5 (points à déplacer ?).
5. Onglets et parcours proposés dans le document 02 (arborescence).
