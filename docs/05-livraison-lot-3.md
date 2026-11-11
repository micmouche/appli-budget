# Livraison — Lot 3 (Immobilier)

Date : 10 novembre 2026

## Ce qui est livré
- **Hub Immo** → **Simulateur** avec quatre entrées : capacité d'emprunt, mensualité d'un prêt, frais de notaire, scénarios d'achat.
- **Capacité d'emprunt** (gratuit) : revenus, charges en cours, taux d'endettement maximal (35 % HCSF, modifiable), taux, assurance, durée, apport, frais d'acquisition → mensualité maximale, capital empruntable, budget total, prix du bien maximal, reste à vivre, endettement actuel. Bouton « Sauvegarder en scénario » (Premium) pré-rempli.
- **Mensualité** (gratuit) : capital, taux, durée, assurance, frais de dossier et de garantie → mensualité hors et avec assurance, intérêts, assurance, coût total, TAEG approché. Accès au **tableau d'amortissement** par année ou mois par mois, export CSV / PDF (Premium).
- **Frais de notaire** (gratuit) : ancien / neuf, mobilier déduit, option « département à 5 % », détail droits de mutation, émoluments, TVA, contribution de sécurité immobilière, débours.
- **Scénarios** (Premium) : fiche complète (hypothèses + synthèse en direct avec code couleur d'endettement), liste, **comparateur** côte à côte de 2 ou 3 scénarios (prix, apport, notaire, emprunt, durée, taux, mensualité, coût total, endettement, reste à vivre).
- **Accueil** : tuile « Dernier scénario » branchée (mensualité, endettement).
- **Démo** : 2 scénarios (T3 Villeurbanne, Maison Caluire). **Sauvegarde JSON** étendue. Migration 3.
- Avertissement « Simulation indicative » sous chaque écran du simulateur.

## Vérifications
| Contrôle | Résultat |
| --- | --- |
| `tsc --noEmit` | 0 erreur |
| `expo lint` | 0 erreur, 0 avertissement |
| `jest` | 74 tests verts (13 suites), dont 4 nouveaux sur l'enchaînement notaire → emprunt → endettement |
| `expo export` iOS | bundle généré sans erreur |

## À vérifier sur le téléphone
1. Immo › Simulateur › Capacité : 4 000 € nets, 3,5 %, 20 ans → prix max ≈ 232 k€ avec 20 k€ d'apport et 8 % de frais.
2. Mensualité : 200 000 € à 3,5 % sur 20 ans → 1 159,92 € hors assurance ; ouvrir le tableau d'amortissement.
3. Notaire : 250 000 € ancien → ≈ 18 840 € (7,5 %) ; basculer en neuf → ≈ 2,3 %.
4. Scénarios (démo) : comparer « T3 Villeurbanne » et « Maison Caluire », l'endettement de la maison apparaît en rouge.
