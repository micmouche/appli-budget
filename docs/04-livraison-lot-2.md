# Livraison — Lot 2 (Épargne)

Date : 10 novembre 2026

## Ce qui est livré
- **Comptes** : 12 types (Livret A, LDDS, LEP, PEL, CEL, livret bancaire, assurance-vie, PEA, compte-titres, crypto, compte courant, autre) avec taux et plafond pré-remplis depuis les constantes réglementaires, solde de départ, couleur.
- **Mouvements** : versement, retrait, intérêts / plus-value ; solde calculé à partir des mouvements ; plafond apprécié sur le capital versé net des retraits, alerte à 90 % et à l'atteinte.
- **Objectifs** : montant cible, date cible optionnelle, comptes rattachés (ou tous), icône et couleur ; projection avec versement mensuel conseillé pour tenir la date et date d'atteinte au rythme moyen des 3 derniers mois (taux pondéré des comptes rattachés).
- **Courbe de l'encours** sur 12 mois (fin de mois) ; **simulateur d'intérêts composés** gratuit (capital, versement mensuel, taux, durée, versement en début ou fin de mois) avec courbe, tableau année par année et création d'un objectif à partir du résultat (Premium).
- **Accueil** : tuile Épargne branchée sur les vraies données (total, objectifs atteints), alertes plafond et objectif atteint.
- **Démo** : 4 comptes, 18 mois de mouvements, 2 objectifs. **Sauvegarde JSON** étendue aux tables épargne (import rétro-compatible avec les sauvegardes du lot 1).
- **Base** : migration 2 (3 tables), appliquée automatiquement au lancement.

## Vérifications
| Contrôle | Résultat |
| --- | --- |
| `tsc --noEmit` | 0 erreur |
| `expo lint` | 0 erreur, 0 avertissement |
| `jest` | 70 tests verts (12 suites), dont 6 nouveaux sur la logique épargne |
| `expo export` iOS | bundle généré sans erreur |

## À vérifier sur le téléphone
1. Épargne (démo) : total ≈ 60 k€, courbe croissante, 4 comptes, 2 objectifs avec versement conseillé.
2. Ouvrir « Livret A » : plafond affiché, ajouter un versement, vérifier le solde.
3. Icône calculatrice : simulateur, modifier les valeurs, bouton « Créer un objectif ».
4. Réglages › Données : export JSON puis import (les comptes doivent revenir).
