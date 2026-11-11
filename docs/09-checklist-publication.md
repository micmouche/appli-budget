# Checklist de publication — pas à pas, depuis un navigateur

Cette checklist est conçue pour quelqu'un **sans ordinateur personnel utilisable** : tout se fait depuis un navigateur web, sauf mention contraire. Comptez environ une demi-journée répartie sur une à deux semaines (délais de validation des comptes et des tests).

Légende : ☐ à faire · ⏱ délai externe · 💶 coût.

## Étape 0 — Décisions à prendre avant tout

- ☐ **Nom définitif** : vérifier sur l'App Store, Google Play, INPI (bases-marques.inpi.fr) et un registraire de domaines. Si « Pécule » est indisponible, choisir un autre nom : il se change dans `app.json` (`name`, `slug`, `scheme`), `src/i18n/fr.json` et `en.json` (`app.name`), `legal/*.md`, `docs/08-fiches-stores.md`.
- ☐ **Identifiant d'application** (bundle ID / package) : `fr.<votresociete>.pecule`, en minuscules, sans accent. Il ne pourra plus changer après la première publication. À reporter dans `app.json` (`ios.bundleIdentifier` et `android.package`).
- ☐ **Statut juridique** : une micro-entreprise suffit (SIREN nécessaire pour un compte Apple « Organisation » ; un compte Apple « Individuel » est possible sans SIREN, votre nom personnel apparaîtra alors comme vendeur).
- ☐ **Nom de domaine** (💶 ≈ 10 €/an) pour héberger confidentialité et CGU, ou utilisation gratuite de GitHub Pages (voir étape 3).

## Étape 1 — Créer les comptes

| Compte | Où | Coût | Délai |
| --- | --- | --- | --- |
| ☐ GitHub | github.com | gratuit | immédiat |
| ☐ Expo (EAS) | expo.dev | gratuit (plan Free : builds limités mais suffisants) | immédiat |
| ☐ RevenueCat | app.revenuecat.com | gratuit jusqu'à 2 500 $ de revenus mensuels | immédiat |
| ☐ Apple Developer Program | developer.apple.com/programs | 💶 99 $/an | ⏱ 24 à 48 h (Individuel) ; D-U-N-S requis pour Organisation (⏱ 1 à 2 semaines) |
| ☐ Google Play Console | play.google.com/console | 💶 25 $ une fois | ⏱ 1 à 3 jours de vérification d'identité |

> Apple : inscrivez-vous au **App Store Small Business Program** (15 % de commission au lieu de 30 %) dès que le compte est actif. Google applique 15 % automatiquement sur le premier million.

## Étape 2 — Mettre le code sur GitHub

1. ☐ Sur github.com : « New repository », nom `pecule`, **Private**, ne cochez rien d'autre.
2. ☐ Donnez-moi l'adresse du dépôt (ex. `https://github.com/votre-compte/pecule`) : je pousse le code. Alternative sans moi : sur la page du dépôt, « uploading an existing file », glissez le contenu décompressé de `pecule.zip` (sans `node_modules`).
3. ☐ Vérifiez que `app.json`, `eas.json`, `package.json` et le dossier `app/` apparaissent à la racine.

## Étape 3 — Héberger confidentialité et CGU (gratuit avec GitHub Pages)

1. ☐ Les fichiers sont prêts dans le dossier `legal/` : `index.html`, `confidentialite.html`, `cgu.html`. Complétez d'abord les champs entre crochets (nom, SIREN, adresse, e-mail, médiateur) dans `legal/confidentialite.md` et `legal/cgu.md`, puis demandez-moi de régénérer les HTML (ou éditez directement les HTML).
2. ☐ Sur GitHub : Settings › Pages › Source « Deploy from a branch », branche `main`, dossier `/legal`. Après ⏱ 2 minutes, les pages sont en ligne à `https://<compte>.github.io/pecule/confidentialite.html` et `.../cgu.html`.
3. ☐ Reportez ces deux adresses dans `app.json › extra.links` et dans les fiches des stores (ou utilisez votre domaine).

## Étape 4 — Configurer Expo / EAS (sans installer quoi que ce soit)

1. ☐ Sur expo.dev : « Create a project », nom `pecule`. Notez l'**ID du projet** (format UUID).
2. ☐ Dans `app.json`, remplacez `REPLACE_WITH_EAS_PROJECT_ID` (deux occurrences : `extra.eas.projectId` et `updates.url`).
3. ☐ Sur expo.dev › projet › Settings › **GitHub** : connectez votre compte GitHub et liez le dépôt `pecule`. Cela permet de lancer les builds depuis le site, sans ligne de commande.
4. ☐ Credentials : laissez EAS **générer et gérer** les certificats iOS et la clé de signature Android (option par défaut au premier build). Pour iOS, EAS vous demandera de vous connecter à votre compte Apple Developer une fois (depuis le navigateur, via le flux guidé).

## Étape 5 — Créer les apps dans les stores

**App Store Connect** (appstoreconnect.apple.com)
1. ☐ Users and Access › Integrations › **App Store Connect API** : créez une clé (rôle Admin), téléchargez le fichier `.p8`, notez Key ID et Issuer ID (EAS Submit en a besoin ; vous les saisirez dans expo.dev › Credentials).
2. ☐ Apps › « + » › New App : plateforme iOS, nom, langue principale **Français**, bundle ID (créez-le d'abord dans developer.apple.com › Identifiers s'il n'apparaît pas), SKU `pecule`, accès complet.
3. ☐ Notez l'**Apple ID de l'app** (numérique, page App Information) → `eas.json › submit.production.ios.ascAppId`. Renseignez aussi `appleId` (votre e-mail Apple) et `appleTeamId` (developer.apple.com › Membership).

**Google Play Console** (play.google.com/console)
1. ☐ « Créer une application » : nom, langue par défaut Français, Application, Gratuite.
2. ☐ Configuration › Accès à l'API : créez un **compte de service** (lien vers Google Cloud), rôle « Administrateur des versions », téléchargez la clé JSON. Elle s'appelle `google-play-service-account.json` dans `eas.json` : ne la mettez **jamais** sur GitHub ; envoyez-la plutôt dans expo.dev › projet › Credentials › Android › Google Service Account Key.
3. ☐ Renseignez la fiche (étape 7) et le questionnaire « Sécurité des données » (`docs/08-fiches-stores.md` § 10).

## Étape 6 — Achats intégrés et RevenueCat

1. ☐ **App Store Connect** › votre app › Monetization › Subscriptions : créez le groupe « Premium », puis les abonnements `pecule_premium_monthly` (4,99 €) et `pecule_premium_yearly` (29,99 €, offre d'introduction : 7 jours gratuits). In-App Purchases : `pecule_premium_lifetime` non consommable (79,99 €). Remplissez les textes affichés (`docs/08` § 11) et ajoutez une capture d'écran par produit (obligatoire pour la review).
2. ☐ Accord « Paid Apps » : Agreements, Tax, and Banking → compléter coordonnées bancaires et formulaires fiscaux (sinon les achats ne fonctionnent pas en test).
3. ☐ **Google Play Console** › Monétiser › Produits : abonnements `pecule_premium_monthly`, `pecule_premium_yearly` (offre : essai 7 jours) et produit intégré `pecule_premium_lifetime`. Profil de paiement obligatoire.
4. ☐ **RevenueCat** : « New project » Pécule ; ajoutez une app iOS (bundle ID + clé App Store Connect « In-App Purchase » téléchargée depuis App Store Connect › Integrations) et une app Android (package + clé JSON du compte de service Google avec accès à l'API Google Play Developer).
5. ☐ RevenueCat › Products : importez les 3 produits de chaque store. Entitlements : créez `premium` et attachez les 6 produits. Offerings : `default` avec les packages `$rc_monthly`, `$rc_annual`, `$rc_lifetime`. Paywalls : créez un paywall sur l'offering `default` (template au choix, couleur `#1E5A48`).
6. ☐ RevenueCat › API keys : copiez la clé **publique** iOS (`appl_…`) et Android (`goog_…`) dans `app.json › extra.revenueCat`.

## Étape 7 — Fiches des stores

- ☐ Copiez les textes de `docs/08-fiches-stores.md` (§ 1 à 6) dans App Store Connect (version 1.0 › App Information et Version Information) et dans Google Play Console (Fiche Google Play principale).
- ☐ Captures d'écran : après le premier build (étape 8), ouvrez l'app en mode démo et prenez les 8 captures du § 7 sur votre téléphone. Pour les cadres et textes, un outil gratuit en ligne (ex. « screenshots.pro », « AppMockUp ») suffit ; exportez aux tailles demandées.
- ☐ App Privacy (Apple) et Sécurité des données (Google) : réponses du § 9 et § 10.
- ☐ Classification de contenu Google : questionnaire → aucune violence, pas de contenu généré par les utilisateurs, etc. → « Tous publics ».
- ☐ Apple › App Review Information : collez la note du § 8, cochez « Sign-in not required ».

## Étape 8 — Premier build et tests

1. ☐ expo.dev › projet › Builds › **Create a build** : plateforme iOS, profil `production`, branche `main`. ⏱ 15 à 30 min. Même chose pour Android.
   - Si vous préférez tester avant : profil `preview` (iOS : installation « ad hoc » limitée aux appareils enregistrés ; Android : fichier APK installable directement).
2. ☐ **iOS** : expo.dev › Submissions › Submit to App Store (choisissez le build) ; le build apparaît dans App Store Connect › TestFlight ⏱ 10 à 30 min. Ajoutez-vous comme testeur interne, installez l'app TestFlight sur votre iPhone.
3. ☐ **Android** : Submit to Google Play, piste **Internal testing**. Ajoutez votre adresse e-mail comme testeur, installez via le lien.
4. ☐ Parcourez la **liste de tests** (ci-dessous). Les achats se testent avec un compte Sandbox Apple (App Store Connect › Users and Access › Sandbox) et des testeurs de licence Google (Play Console › Paramètres › Test de licence).
5. ☐ ⏱ **Google Play, compte personnel créé après novembre 2023** : avant toute publication en production, l'app doit être testée par **au moins 12 testeurs pendant 14 jours** en test fermé. Recrutez famille/amis (un lien suffit), puis demandez l'accès à la production depuis la console.

**Liste de tests (sur téléphone)**
- Onboarding → démo → accueil ; saisie d'une dépense ; règlement du couple ; export CSV/PDF ; import JSON.
- Épargne : compte, mouvement, objectif, simulateur.
- Immobilier : capacité, mensualité, amortissement, notaire, scénarios et comparateur.
- Locatif : encaisser un loyer, quittance PDF, déclaration.
- Travaux : devis retenu, paiement, planning, PDF.
- Paywall : achat sandbox mensuel, restauration ; annulation ; achat à vie.
- Mode sombre, taille de texte maximale (Réglages système), VoiceOver / TalkBack sur l'accueil.
- Verrouillage biométrique, retour après 30 s en arrière-plan.

## Étape 9 — Soumission

1. ☐ Corrigez ce qui doit l'être (je produis les correctifs ; relancez un build depuis expo.dev).
2. ☐ **Apple** : App Store Connect › version 1.0 › sélectionnez le build TestFlight › « Add for Review » › « Submit ». ⏱ 24 à 72 h. Réponse fréquente : demande de précisions sur les achats → répondre dans Resolution Center avec la note du § 8.
3. ☐ **Google** : Production › Créer une version › choisir le bundle déjà envoyé en test › Vérifier et déployer. ⏱ 1 à 7 jours la première fois.
4. ☐ Après approbation : laissez « Publication manuelle » (Apple) si vous voulez choisir le jour, sinon automatique.

## Étape 10 — Après la mise en ligne

- ☐ RevenueCat › Dashboard : vérifiez que les premiers achats remontent.
- ☐ Mises à jour JS sans resoumission (textes, constantes, corrections) : expo.dev › Updates (`eas update`) sur le canal `production`. Les changements natifs (nouvelles dépendances) exigent un nouveau build et une soumission.
- ☐ Préparez le code promo de lancement pour vos clients Etsy : Apple › Offer Codes sur l'abonnement annuel / l'achat à vie ; Google › codes promotionnels.
- ☐ Répondez aux avis dans les 48 h ; les avis mentionnant des bugs reçoivent une réponse et un correctif via Update.

## Ce que je fais pour vous à chaque étape
Donnez-moi simplement les valeurs à reporter (ID de projet Expo, bundle ID, clés RevenueCat, adresses des pages légales, identifiants Apple) : je mets à jour les fichiers, je pousse sur GitHub et je vous dis quand lancer le build. Ne me transmettez jamais de mots de passe ni de fichiers de clés (`.p8`, `.json` du compte de service) : ils se déposent uniquement dans expo.dev › Credentials.
