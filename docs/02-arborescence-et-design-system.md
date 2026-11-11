# Arborescence des écrans et design system

> Version 0.1 — 10 novembre 2026 — complément de la note de cadrage. Le nom « Pécule » est utilisé à titre provisoire.

---

## 1. Principes de navigation

- **5 onglets maximum** (limite iOS lisible) : Accueil · Budget · Épargne · Immo · Réglages. L'onglet **Immo** est un *hub* qui regroupe les trois modules immobiliers (Simulateur, Locatif, Travaux) : ils partagent les mêmes objets (un logement loué peut avoir un chantier et un prêt).
- **Personnalisation par l'onboarding** : l'usage principal choisi devient l'onglet ouvert au premier lancement et ordonne les cartes de l'accueil. Les onglets ne bougent jamais (repères stables).
- **Bouton flottant « + »** présent sur Accueil et Budget : ouvre la saisie rapide (feuille modale). Sur les autres onglets, le « + » contextuel se trouve dans l'en-tête (ajouter un compte, un logement, un devis).
- **Modales en feuille** (bottom sheet) pour toute saisie courte ; **écran plein** pour les formulaires longs (logement, bail) et les détails.
- **Verrou Premium** : un module Premium reste visible et navigable en lecture (écran d'accueil du module avec données de démo floutées ou vide + argumentaire) ; toute action de création ou d'export ouvre le paywall. Jamais d'écran mort.
- **Retour** : geste système + bouton « Fermer » explicite sur chaque feuille. Confirmation uniquement pour les suppressions et l'abandon d'un formulaire modifié.

---

## 2. Arborescence (routes Expo Router)

```
app/
├─ _layout.tsx                      Providers (thème, i18n, SQLite, RevenueCat), polices, splash
├─ onboarding/
│  ├─ _layout.tsx                   Pile sans en-tête, indicateur 1/3
│  ├─ index.tsx                     1. Promesse + illustration + « Commencer »
│  ├─ usage.tsx                     2. « Quel est votre usage principal ? » (multi-choix 5 modules)
│  └─ demarrage.tsx                 3. « Découvrir avec des données de démo » ou « Partir de zéro » ; foyer 1 ou 2 personnes
├─ (tabs)/
│  ├─ _layout.tsx                   Barre d'onglets + FAB
│  ├─ index.tsx                     ACCUEIL (tableau de bord)
│  ├─ budget/
│  │  ├─ index.tsx                  Mois courant : solde, donut, enveloppes, liste des dépenses
│  │  ├─ depense/[id].tsx           Détail / édition d'une dépense
│  │  ├─ categories.tsx             Gestion des catégories et budgets d'enveloppe
│  │  ├─ recurrences.tsx            Dépenses récurrentes
│  │  ├─ foyer.tsx                  Revenus de chaque personne, mode de répartition
│  │  ├─ reglement.tsx              « Qui doit quoi » du mois + historique des règlements
│  │  └─ historique.tsx             Barres 12 mois, navigation mois par mois
│  ├─ epargne/
│  │  ├─ index.tsx                  Total, courbe de l'encours, comptes, objectifs
│  │  ├─ compte/[id].tsx            Détail compte : mouvements, plafond, taux
│  │  ├─ compte/nouveau.tsx         Création (type → plafond et taux pré-remplis)
│  │  ├─ objectif/[id].tsx          Détail objectif : progression, projection, versement conseillé
│  │  ├─ objectif/nouveau.tsx
│  │  └─ simulateur.tsx             Intérêts composés (gratuit, sauvegarde Premium)
│  ├─ immo/
│  │  ├─ index.tsx                  HUB : 3 cartes (Simulateur, Locatif, Travaux) + alertes immo
│  │  ├─ simulateur/
│  │  │  ├─ index.tsx               Choix : capacité d'emprunt · mensualité · frais de notaire · scénarios
│  │  │  ├─ capacite.tsx
│  │  │  ├─ mensualite.tsx          + tableau d'amortissement (route enfant)
│  │  │  ├─ amortissement/[id].tsx
│  │  │  ├─ notaire.tsx
│  │  │  ├─ scenarios.tsx           Liste + comparateur côte à côte
│  │  │  └─ scenario/[id].tsx
│  │  ├─ locatif/
│  │  │  ├─ index.tsx               Logements, loyers du mois (encaissés / en attente / impayés), rentabilité
│  │  │  ├─ logement/[id].tsx       Onglets internes : Loyers · Locataire & bail · Charges · Rentabilité
│  │  │  ├─ logement/nouveau.tsx
│  │  │  ├─ bail/[id].tsx           Bail, locataire, dépôt, IRL
│  │  │  ├─ loyer/[id].tsx          Échéance : encaisser (total/partiel), quittance PDF
│  │  │  └─ declaration.tsx         Tableau annuel pour la 2044, export CSV
│  │  └─ travaux/
│  │     ├─ index.tsx               Chantiers avec engagé/payé/budget
│  │     ├─ chantier/[id].tsx       Onglets internes : Lots · Devis · Paiements · Planning · Synthèse
│  │     ├─ chantier/nouveau.tsx
│  │     ├─ lot/[id].tsx
│  │     ├─ devis/[id].tsx
│  │     └─ paiement/[id].tsx
│  └─ reglages/
│     ├─ index.tsx                  Liste : Premium, Apparence, Foyer & devise, Données, Sécurité, À propos
│     ├─ premium.tsx                Statut, gérer l'abonnement, restaurer
│     ├─ apparence.tsx              Thème, taille de texte (aperçu), langue
│     ├─ donnees.tsx                Export JSON, import JSON, exports CSV, démo on/off, tout effacer
│     ├─ securite.tsx               Verrouillage biométrique / code
│     └─ a-propos.tsx               Version, confidentialité, CGU, licences, contact, noter
├─ saisie-rapide.tsx                FEUILLE MODALE : montant → catégorie (2 tapes)
├─ paywall.tsx                      FEUILLE MODALE : RevenueCat Paywall + argumentaire par module
└─ verrou.tsx                       Écran de verrouillage biométrique (si activé)
```

Soit environ **55 écrans**, dont 12 pour le socle + Budget (lot 0 et 1).

---

## 3. Parcours clés

### Saisie d'une dépense en 2 tapes
1. Tap sur **« + »** (FAB) → la feuille s'ouvre, pavé numérique visible, champ montant focalisé, catégorie la plus utilisée pré-sélectionnée, date = aujourd'hui, payeur = moi, commune = oui.
2. Saisie du montant au pavé (ex. `42,30`).
3. Tap sur une **catégorie** → enregistrement immédiat, retour haptique « succès », toast « Courses · 42,30 € ajouté · Annuler ».
   Options secondaires (date, payeur, note, récurrence) accessibles par un chevron « Plus » sans quitter la feuille.
   Si l'utilisateur tape sur la catégorie déjà pré-sélectionnée après le montant, cela compte bien comme 2 tapes au total.

### Onboarding (3 écrans)
1. **Promesse** : titre « Votre foyer, vos finances, votre téléphone. », trois puces (sans compte, données locales, cinq modules), bouton « Commencer ».
2. **Usage principal** : 5 grandes cartes à cocher avec icône et une phrase ; au moins une obligatoire ; « Continuer ».
3. **Démarrage** : « Vous êtes… » (seul · en couple) et deux boutons : « Découvrir avec la démo » (recommandé) · « Partir de zéro ». Une ligne : « Vous pourrez changer à tout moment dans Réglages. »

### Accueil (tableau de bord)
- En-tête : salutation + mois courant, icône réglages.
- Carte héros « Solde du mois » : revenus − dépenses, mini barres des 6 mois, variation vs mois dernier.
- Bandeau **alertes** (si présentes) : loyer impayé, échéance de travaux dans 7 jours, enveloppe dépassée, plafond livret proche, objectif atteint. Chaque alerte est actionnable.
- Grille de **tuiles** ordonnée selon l'onboarding : Épargne totale (avec sparkline), Objectifs (anneaux), Loyers du mois, Chantier en cours, Dernier scénario immo. Tuiles Premium non souscrites : affichées avec un badge « Premium » et un contenu d'exemple.
- Pied : « Dernier export : il y a 34 jours · Exporter » (rappel doux).

### Gating Premium
`usePremium()` → `{ isPremium, loading, present(paywallContext) }`. Composant `<PremiumGate module="locatif">` qui enveloppe l'écran : rendu normal si Premium, sinon rendu « vitrine » (contenu démo flouté en arrière-plan, carte explicative, bouton « Débloquer »). Les écrans de calcul gratuits affichent le résultat et un bandeau « Sauvegarder ce scénario — Premium ».

---

## 4. Design system

### 4.1 Direction
Sobre, chaleureux, « papier et encre » : fonds légèrement crème, texte presque noir, un seul accent vert profond, chiffres en caractères tabulaires. Aucune carte avec ombre lourde ; la hiérarchie vient des surfaces, des bordures fines et de l'espace. Les couleurs vives sont réservées aux données (graphiques, statuts).

### 4.2 Couleurs — jetons sémantiques

| Jeton | Clair | Sombre | Usage |
|---|---|---|---|
| `bg` | `#F6F5F1` | `#0F1114` | Fond d'écran |
| `surface` | `#FFFFFF` | `#171A1F` | Cartes, feuilles |
| `surface2` | `#EFEDE7` | `#1F232A` | Champs, segments, puces |
| `border` | `#E3E1DA` | `#2A2F37` | Séparateurs, contours |
| `text` | `#17191D` | `#F2F1EC` | Texte principal |
| `textSecondary` | `#5E6470` | `#A0A6B1` | Libellés, aides |
| `textMuted` | `#8B9098` | `#6E7480` | Placeholders, méta (jamais pour une info essentielle) |
| `brand` | `#1E5A48` | `#6FCBA6` | Accent, boutons primaires, liens, onglet actif |
| `onBrand` | `#FFFFFF` | `#0F1114` | Texte sur `brand` |
| `brandSoft` | `#E3EFEA` | `#1C332B` | Fond d'accent discret |
| `positive` | `#187A4F` (texte) / `#1F8A5B` (fill) | `#4CC38A` | Revenus, encaissé, objectif atteint |
| `negative` | `#C8403A` | `#F0766F` | Dépenses, impayé, dépassement |
| `warning` | `#96620A` (texte) / `#D8A118` (fill) | `#E0A93A` | Échéance proche, enveloppe à 80 % |
| `info` | `#2F6BBF` | `#6FA3EE` | Information, scénario |
| `premium` | `#8A6A1E` sur `#F5ECD3` | `#E8C66B` sur `#2E2714` | Badge Premium (doré discret) |

Contrastes vérifiés (WCAG) : texte principal ≥ 15:1 dans les deux modes, texte secondaire 5,9:1 (clair) et 7,1:1 (sombre), `brand` 8:1, statuts en version texte ≥ 4,5:1, statuts en version remplissage ≥ 3:1 (utilisés avec icône + libellé, jamais seuls).

**Couleur de module** (identité, utilisée pour l'icône de la carte et la pastille d'onglet du hub) :

| Module | Clair | Sombre |
|---|---|---|
| Budget | `#2F6BBF` | `#4F8BE0` |
| Épargne | `#1E9E78` | `#2BA37E` |
| Immobilier (simulateur) | `#D9712E` | `#D96B2E` |
| Locatif | `#6B5BD2` | `#9085E9` |
| Travaux | `#D8A118` | `#B88412` |

### 4.3 Palette de données (graphiques)
Catégorielle à 8 crans, **ordre fixe**, attribuée à la catégorie et jamais à son rang. Validée par le script de contrôle daltonisme/contraste de la méthode dataviz : toutes les vérifications passent en clair (surface `#FFFFFF`) et en sombre (surface `#171A1F`) ; en clair, le jaune est sous 3:1 → les parts de donut et les barres portent toujours un libellé direct ou une légende avec valeur.

| Cran | Clair | Sombre | Catégorie budget par défaut |
|---|---|---|---|
| 1 | `#2F6BBF` | `#4F8BE0` | Logement |
| 2 | `#D9712E` | `#D96B2E` | Alimentation |
| 3 | `#1E9E78` | `#2BA37E` | Transports |
| 4 | `#D8A118` | `#B88412` | Loisirs |
| 5 | `#C25A8A` | `#D0659A` | Santé |
| 6 | `#2E7D32` | `#3E9A44` | Abonnements |
| 7 | `#6B5BD2` | `#9085E9` | Vêtements |
| 8 | `#C8403A` | `#E35F5A` | Autres |

Au-delà de 8 catégories, les plus petites sont regroupées dans « Autres ». Séquentiel (intensité, ex. carte thermique des dépenses par jour) : une seule teinte `brand` du clair au foncé. Divergent (écart au budget) : `positive` ↔ gris neutre ↔ `negative`.

Règles de marque des graphiques : traits de 2 pt, barres avec extrémités arrondies 4 pt, espace de 2 pt entre segments de donut, grille discrète en `border`, textes toujours en `text`/`textSecondary` (jamais de la couleur de la série), légende dès 2 séries, info-bulle au toucher avec valeur formatée en euros, animation d'entrée 400 ms.

### 4.4 Typographie
- **Titres et chiffres héros** : *Manrope* (700, 600) — géométrique, moderne, chiffres bien dessinés.
- **Corps, libellés, montants dans les listes** : *Inter* (400, 500, 600) avec **chiffres tabulaires** (`fontVariant: ['tabular-nums']`) pour aligner les colonnes de montants.
- Les deux via `@expo-google-fonts/manrope` et `@expo-google-fonts/inter`.

| Style | Police | Taille / interligne | Usage |
|---|---|---|---|
| `display` | Manrope 700 | 40 / 44 | Montant héros de l'accueil |
| `title1` | Manrope 700 | 28 / 34 | Titre d'écran |
| `title2` | Manrope 600 | 22 / 28 | Titre de section, montant de carte |
| `headline` | Inter 600 | 17 / 22 | Titre de ligne, bouton |
| `body` | Inter 400 | 17 / 24 | Texte courant |
| `callout` | Inter 500 | 15 / 20 | Libellés de champs, puces |
| `caption` | Inter 400 | 13 / 18 | Méta, aides, axes de graphiques |
| `micro` | Inter 600 | 11 / 14 | Badges (toujours en majuscules espacées) |

Tailles dynamiques : `allowFontScaling` activé partout, `maxFontSizeMultiplier` 1,6 pour les titres et 2,0 pour le corps ; les mises en page passent en colonne au-delà de 1,3 (vérifié par un hook `useLargeText()`).

Format monétaire : `Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })` → « 1 159,92 € » (espace fine insécable avant €). Les montants négatifs sont affichés avec le signe « − » (vrai signe moins) et en `negative`.

### 4.5 Espacement, formes, profondeur
- Grille de 4 pt : `space.1 = 4`, `2 = 8`, `3 = 12`, `4 = 16`, `5 = 20`, `6 = 24`, `8 = 32`, `10 = 40`.
- Marges d'écran 20 pt ; gouttière entre cartes 12 pt.
- Rayons : `sm 10` (puces, champs), `md 16` (cartes), `lg 24` (feuilles), `full` (FAB, anneaux).
- Profondeur : cartes = `surface` + bordure 1 pt `border` ; aucune ombre en clair ; en sombre, légère élévation par éclaircissement de surface. Seul le FAB porte une ombre douce (y 8, flou 24, opacité 0,18 de la couleur `brand`).
- Icônes : **Lucide** (`lucide-react-native`), trait 1,75 pt, tailles 20 (listes) / 24 (onglets, actions) / 28 (catégories).

### 4.6 Mouvement et haptique
| Événement | Animation (Reanimated) | Haptique (expo-haptics) |
|---|---|---|
| Ouverture de feuille | ressort (damping 18, stiffness 180) | `impactLight` à l'ouverture |
| Sélection d'une catégorie / segment | scale 0,96 → 1 en 120 ms | `selectionChanged` |
| Enregistrement réussi | coche animée 300 ms + toast glissant | `notificationSuccess` |
| Erreur de validation | secousse horizontale 3×, 250 ms | `notificationError` |
| Chiffre héros qui change de mois | interpolation du nombre 400 ms | aucun |
| Graphiques | tracé/déploiement 400 ms, `Easing.out(cubic)` | aucun |
| Progression d'objectif atteinte | anneau se complète + confettis sobres (une fois) | `notificationSuccess` |
| Changement d'onglet | fondu 150 ms | aucun |

Toujours respecter « Réduire les animations » (iOS) et « Supprimer les animations » (Android) : durées à 0 via `useReducedMotion()`.

### 4.7 Composants (dossier `src/ui/`)

| Composant | Rôle | Variantes / notes |
|---|---|---|
| `Screen` | Conteneur avec safe area, fond `bg`, défilement, grand titre optionnel | `scroll`, `fixed` |
| `Card` | Surface bordée, padding 16 | `pressable`, `tone: default | brand | premium` |
| `StatTile` | Libellé + grande valeur + variation + mini-graphe optionnel | utilisé sur l'accueil |
| `Amount` | Montant formaté, chiffres tabulaires, couleur selon signe | tailles `display`…`caption` |
| `Button` | Bouton 48 pt mini | `primary`, `secondary`, `ghost`, `destructive`, `loading`, icône |
| `IconButton` | 44 × 44 pt mini (cible tactile) | |
| `Fab` | Bouton flottant 56 pt | masqué au défilement vers le bas |
| `Chip` | Puce sélectionnable (filtres, répartition) | |
| `Segmented` | Contrôle segmenté (mois/année, 50-50/prorata) | animé |
| `ListRow` | Ligne avec icône, titre, sous-titre, montant/chevron | `swipeable` (supprimer, éditer) |
| `Sheet` | Feuille modale basée sur `@gorhom/bottom-sheet` | points d'arrêt 50 % / 90 % |
| `NumPad` | Pavé numérique personnalisé (virgule, effacer, 00) | grand, haptique |
| `CategoryGrid` | Grille d'icônes de catégories 4 colonnes | sélection animée |
| `FormField` + `TextInput`, `CurrencyInput`, `PercentInput`, `DateField`, `Select`, `Switch` | Champs avec libellé, aide, erreur | validation inline |
| `ProgressBar`, `ProgressRing` | Progression d'enveloppe / d'objectif | couleur d'état automatique |
| `DonutChart`, `LineChart`, `BarChart`, `Sparkline` | Graphiques Skia | info-bulle, légende, état vide |
| `Banner` | Alerte en-tête (info, warning, negative) avec action | empilable |
| `Toast` | Confirmation éphémère avec « Annuler » | |
| `EmptyState` | Illustration légère + texte + action | par module |
| `PremiumBadge`, `PremiumGate`, `PaywallSheet` | Monétisation | |
| `Disclaimer` | Encadré « Simulation indicative, pas un conseil financier » | obligatoire sous chaque simulateur |
| `MonthSwitcher` | « ‹ Novembre 2026 › » | geste de balayage |
| `ThemedIcon` | Icône Lucide colorée par jeton ou par module | |

### 4.8 Accessibilité
- Toutes les cibles tactiles ≥ 44 × 44 pt ; `accessibilityLabel` et `accessibilityRole` sur chaque contrôle ; montants lus sous forme « quarante-deux euros trente » grâce à `accessibilityLabel` dédié.
- Les graphiques exposent un résumé textuel (« Alimentation 32 %, Logement 28 %… ») et un bouton « Voir en tableau ».
- Aucune information portée par la couleur seule : icône + texte pour chaque statut (encaissé ✓, impayé ⚠).
- Focus visible, ordre de lecture logique, contraste AA vérifié (§ 4.2).
- Mode sombre sélectionné et non inversé automatiquement (jetons distincts).

### 4.9 Icône et splash (à produire au lot 6)
- Icône : monogramme « P » stylisé en forme de pièce/bourse, encre `#17191D` sur fond crème `#F6F5F1`, variante sombre pour iOS 18+ et icône adaptative Android (premier plan + fond uni `#1E5A48`).
- Splash : fond `bg` du thème système, logo centré, aucune animation (chargement des polices et migration SQLite derrière).

---

## 5. Points à valider sur ce document
1. Structure à 5 onglets avec un hub « Immo » regroupant Simulateur, Locatif et Travaux (alternative : 4 onglets Accueil · Budget · Patrimoine · Réglages, où Patrimoine regroupe Épargne + Immo).
2. Direction visuelle « papier et encre » avec accent vert profond (alternatives possibles : bleu nuit `#1F3A5F`, ou terracotta `#B5603A`).
3. Couple de polices Manrope + Inter.
4. Jeu d'icônes Lucide.
