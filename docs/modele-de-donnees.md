# Modèle de données (V2, Supabase)

Montants en FCFA, entiers. Dates au format `AAAA-MM-JJ`. Chaque table porte `user_id`, protégé par les règles RLS.

---

## `expenses` : dépenses

| Colonne | Type | Remarque |
|---|---|---|
| `id` | texte | identifiant unique ; `rec-<récurrente>-<AAAA-MM>` pour une dépense générée |
| `amount` | entier | > 0 |
| `fee` | entier | frais Mobile Money, 0 par défaut |
| `category` | texte | alimentation, transport, logement, factures, communication, sante, famille, loisirs, vetements, education, autres |
| `method` | texte | especes, mtn, airtel, banque |
| `date` | date | |
| `note` | texte | 120 caractères max |
| `recurring_id` | texte | récurrente d'origine, sinon vide |

## `incomes` : entrées d'argent

`id`, `amount`, `source` (salaire, prime, mission, autre), `date`, `note`.

## `budgets` : budgets mensuels

Clé (`user_id`, `category`), `amount`.

## `recurring` : dépenses récurrentes

`id`, `label`, `amount`, `fee`, `category`, `method`, `day` (1 à 28), `last_month` (dernier mois généré, `AAAA-MM`), `active`.

## `settings` : réglages

Une ligne par utilisateur : `savings_goal` (objectif d'épargne mensuel).

## Règles de calcul

- Dépense comptée = `amount` + `fee`.
- Solde du mois = somme des entrées du mois − somme des dépenses du mois.
- Projection de fin de mois = dépenses récurrentes du mois + récurrentes encore à venir + autres dépenses × (jours du mois ÷ jour actuel).
