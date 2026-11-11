# Livraison — Lot 5 (Travaux)

Date : 11 novembre 2026

## Ce qui est livré
- **Chantiers** : nom, budget global, logement lié (optionnel), dates prévues, couleur.
- **Lots** par corps de métier (12 types), budget par lot, TVA par lot (20 %, 10 % rénovation, 5,5 % rénovation énergétique), dates de début et de fin, case « terminé ».
- **Devis** : artisan, lot, montant HT, TVA, TTC calculé, statut reçu / retenu / refusé, date, note. **Comparateur par lot** : écart au budget, « le moins cher », retenir un devis refuse automatiquement les autres du même lot.
- **Échéancier** : acomptes, situations, soldes, autres ; date prévue, marquage payé en un tap, statuts prévu / à payer (7 jours) / en retard / payé.
- **Planning** : barres par lot sur une grille hebdomadaire, couleur selon dans les temps / en retard / terminé.
- **Synthèse** : budget, engagé (devis retenus TTC), écart et %, payé, reste à payer, avancement ; tableau par lot ; **export PDF** complet (lots, devis, paiements).
- **Accueil** : tuile « Chantier en cours » (% payé) et alertes : budget dépassé, paiement à venir sous 7 jours, paiement en retard.
- **Démo** : rénovation d'une maison, 5 lots, 8 devis, 6 échéances (dont une à payer dans 4 jours). **Sauvegarde JSON** étendue. Migration 5.

## Vérifications
| Contrôle | Résultat |
| --- | --- |
| `tsc --noEmit` | 0 erreur |
| `expo lint` | 0 erreur, 0 avertissement |
| `jest` | 83 tests verts (15 suites), dont 5 nouveaux (TVA, statuts, engagé/payé, totaux, planning) |
| `expo export` iOS | bundle généré sans erreur |

## À vérifier sur le téléphone
1. Accueil (démo) : alerte « Rénovation maison Caluire : Solde électricité à payer le … ».
2. Immo › Travaux › chantier : onglets Lots (cuisine en dépassement orange/rouge), Devis (comparateur salle de bain), Paiements (marquer payé), Planning (barres), Synthèse (PDF).
3. Créer un lot, un devis « retenu », vérifier que l'engagé du lot change.

## Bilan : les 5 modules sont construits
Il reste le lot 6 (icône et splash définitifs, finitions) et le lot 7 (confidentialité, CGU, fiches des stores, questionnaires, checklist de publication).
