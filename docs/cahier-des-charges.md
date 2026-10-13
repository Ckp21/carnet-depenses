# Cahier des charges

**Projet** : Carnet de dépenses
**Objet** : application web personnelle de gestion financière, utilisée seul, principalement sur téléphone.

---

## 1. Périmètre V1 (livré)

- Saisie rapide : montant, catégorie, date, moyen de paiement (Espèces, MTN MoMo, Airtel Money, Banque/Carte), note.
- Budgets mensuels par catégorie, alertes à 80 % et 100 %.
- Tableau de bord : solde du mois, répartition par catégorie, évolution sur 6 mois, budgets, top 5, part par moyen de paiement.
- Export CSV compatible Excel.
- Devise FCFA, format français (125 000 FCFA).
- Onglet Conseils fondé sur les statistiques du Congo.

## 2. Feuille de route

| Version | Contenu |
|---|---|
| V1 | Artifact claude.ai avec base privée (livré) |
| V2 | Application installable (PWA), base en ligne, mode hors ligne |
| V3 | Application complète si besoin |

## 3. Évolutions retenues pour la V2

1. Dépenses récurrentes (loyer, forfait data, factures) ajoutées automatiquement chaque mois.
2. Objectif d'épargne mensuel, cumul et courbe.
3. Frais Mobile Money sur les paiements MTN MoMo et Airtel Money.
4. Plusieurs entrées d'argent par mois (salaire, primes, missions).
5. Bilan mensuel automatique.
6. Sauvegarde complète et restauration.
7. Application installable, fonctionnement hors ligne.

## 3 bis. Évolutions livrées en V2.5

1. Catégories personnalisables et modèles locaux (dîme, solidarité, scolarité, coiffure, groupe électrogène).
2. Cycle de paie et scénario « salaire en retard ».
3. Modèles d'objectifs (rentrée, terrain, caution, cérémonie, fêtes, chantier).
4. Rappels par notification (guide : `docs/notifications.md`).
5. Copie automatique quotidienne, restauration avec aperçu, synchronisation durable avec nouvel essai.
6. Rapport mensuel imprimable et résumé partageable.
7. Polices hébergées (aucun site externe contacté hors Supabase).

Évolutions écartées pour l'instant : lecture automatique des SMS (impossible dans une application web, la saisie par collage reste) et contrôle de solde avec les opérateurs.

## 4. Règles de travail

- Toute évolution conserve le lien et les données.
- Aucune suppression ni écrasement de données sans confirmation explicite.
- Évolutions proposées par ordre de valeur.
- Réponses courtes, en français, sans jargon inutile.
