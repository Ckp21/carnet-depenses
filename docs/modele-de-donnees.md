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

Une ligne par utilisateur : `savings_goal` (objectif d'épargne mensuel), `opening` (soldes de départ et configuration, taille limitée à 48 Ko), `opening_date`, `emergency_months`, `inflation`.

Le champ `opening` contient les soldes de départ par portefeuille (`especes`, `mtn`, `airtel`, `banque`, `epargne` et les portefeuilles ajoutés) et des clés de configuration commençant par deux tirets bas :

| Clé | Contenu |
|---|---|
| `__wallets` | Portefeuilles personnalisés : `id`, `label`, `color`, `kind`, `archived` |
| `__cats` | Catégories personnalisées et réglages des catégories de base : `id`, `label`, `color` (liste fermée), `need`, `words` (12 maximum), `archived` |
| `__biens` | Biens du patrimoine : `id`, `name`, `value` |
| `__cycle` | Jour de paie réglé à la main : `{ "day": 1 à 28 }` |
| `__rem` | Rappels : `lead` (0, 1 ou 2 jours avant), `hour` (7, 8, 12 ou 18 h, heure de Brazzaville), `amounts` (montant dans la notification) |

Toutes ces clés sont relues avec un repli sûr : une valeur inattendue est ignorée sans toucher à la base.

## `push_subscriptions` : appareils inscrits aux rappels

`endpoint` (clé), `user_id`, `p256dh`, `auth`, `agent`, `created_at`. Supprimée à la déconnexion ou quand le serveur Apple ou Google répond 404 ou 410.

## `reminders` : rappels à envoyer

`id` (déterministe : `r-<type>-<élément>-<date>`), `user_id`, `fire_at` (UTC), `title` (80 caractères), `body` (200), `tag`, `sent_at`, `note`. Recalculés par l'application à chaque synchronisation pour les 45 prochains jours ; un rappel déjà envoyé n'est jamais réécrit. Les rappels envoyés depuis plus de 14 jours sont purgés.

## `backups` : copies automatiques

`id` (uuid), `user_id`, `kind` (`auto` ou `manuel`), `counts` (nombre d'éléments, pour l'affichage), `payload` (copie complète au format du fichier JSON, moins de 20 Mo), `created_at`. Un déclencheur conserve les 14 dernières copies automatiques et les 6 dernières copies manuelles.

## Règles de calcul

- Dépense comptée = `amount` + `fee`.
- Solde du mois = somme des entrées du mois − somme des dépenses du mois.
- Projection de fin de mois = dépenses récurrentes du mois + récurrentes encore à venir + autres dépenses × (jours du mois ÷ jour actuel).
