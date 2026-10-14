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

## 3 ter. Évolutions livrées en V2.6

1. Intégrité : opérations refusées gardées visibles jusqu'à correction, récurrentes « À payer » puis « Payé » avec le montant réel, restauration avec aperçu, détection des changements sur le contenu.
2. Sauvegarde indépendante de l'application : copie serveur de nuit, date de la dernière copie réussie (guide : `docs/sauvegardes.md`).
3. Accès : mot de passe oublié, changement et affichage du mot de passe.
4. Testeurs : « Envoyer le retour » et journal d'erreurs anonymisé (guide : `docs/retours-testeurs.md`).
5. Confort : accueil allégé, budget quotidien avec horizon, « Vérifier mon solde », favoris et Annuler, démarrage guidé, rappel du soir, séparation perso et pro, conseils tirés de ses propres chiffres.
6. Tests automatiques dans le dépôt et contrôle à chaque modification.

## 3 quater. Prévu en V2.7 : abonnements en ligne

Besoin exprimé : de nombreux abonnements en ligne, payés par carte prépayée (le courant passe par MTN MoMo). Le risque principal d'une carte prépayée est un renouvellement refusé faute de solde.

1. Écran « Abonnements » : prochain prélèvement, périodicité (mensuelle, trimestrielle, annuelle), coût mensuel équivalent, total par mois et par an.
2. Carte prépayée comme portefeuille à part, rechargée depuis MoMo (frais de recharge compris), alerte « Recharge la carte avant le X : il faut N FCFA ».
3. Prix en USD ou EUR avec un taux réglé par l'utilisateur, puis confirmation du montant réellement débité.
4. Détection d'abonnements dans l'historique, rappels avant renouvellement et fin d'essai gratuit.

Les charges récurrentes existantes deviennent des abonnements mensuels sans perte de données.

Évolutions écartées pour l'instant : lecture automatique des SMS (impossible dans une application web, la saisie par collage reste) et contrôle de solde avec les opérateurs.

## 4. Règles de travail

- Toute évolution conserve le lien et les données.
- Aucune suppression ni écrasement de données sans confirmation explicite.
- Évolutions proposées par ordre de valeur.
- Réponses courtes, en français, sans jargon inutile.
