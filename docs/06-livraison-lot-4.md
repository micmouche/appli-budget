# Livraison — Lot 4 (Locatif)

Date : 10 novembre 2026

## Ce qui est livré
- **Logements** : fiche complète (adresse, type, surface, prix, frais, travaux, charges annuelles par nature, crédit), couleur, suppression en cascade.
- **Baux** : locataire, loyer hors charges, provisions, dépôt de garantie (maximum légal affiché : 1 mois nu, 2 mois meublé), jour d'exigibilité, meublé, indice IRL de référence, dates d'entrée et de sortie. Outil de **révision IRL** (nouveau loyer = loyer × nouvel indice / ancien indice).
- **Échéances** : générées automatiquement chaque mois pour chaque bail actif (rattrapage jusqu'à 12 mois), statut à venir / encaissé / partiel / impayé (délai de grâce paramétrable, 5 jours par défaut), encaissement total ou partiel avec date.
- **Quittance de loyer PDF** avec mentions usuelles (bailleur, locataire, logement, période, loyer, charges, total, date d'encaissement, formule de quittance, « annule tous les reçus… »), et **reçu partiel** en cas de paiement incomplet. Identité du bailleur saisie une fois (écran « Bailleur »).
- **Dépenses déductibles** par nature (taxe foncière, copropriété, assurance, gestion, travaux, intérêts, autre).
- **Rentabilité** : brute, nette, nette-nette (micro-foncier 30 % ou réel, TMI au choix, prélèvements sociaux 17,2 %), cash-flow mensuel, vacance locative.
- **Déclaration annuelle** (tous logements) : loyers encaissés dans l'année, charges par nature, résultat foncier, export CSV.
- **Accueil** : tuile « Loyers du mois » (encaissé / dû) et alertes impayé / partiel. **Démo** : 2 T2 à Nantes, 13 mois d'échéances, un loyer impayé ce mois-ci. **Sauvegarde JSON** étendue. Migration 4.

## Vérifications
| Contrôle | Résultat |
| --- | --- |
| `tsc --noEmit` | 0 erreur |
| `expo lint` | 0 erreur, 0 avertissement |
| `jest` | 78 tests verts (14 suites), dont 4 nouveaux (statuts, périodes, déclaration) |
| `expo export` iOS | bundle généré sans erreur |

## À vérifier sur le téléphone
1. Accueil (démo) : alerte rouge « T2 rue des Lilas : loyer de … impayé » ; la toucher ouvre l'échéance ; « Encaisser la totalité » puis « Quittance PDF ».
2. Immo › Locatif : loyers du mois, les deux logements avec pastille de statut.
3. Logement › Rentabilité : changer la TMI, la rentabilité nette-nette bouge.
4. Icône document en haut à droite : déclaration de l'année, export CSV.
5. Bailleur : renseigner nom et adresse, regénérer une quittance.
