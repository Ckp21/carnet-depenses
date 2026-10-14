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

## `moves` : mouvements entre portefeuilles

`id`, `kind`, `amount`, `fee`, `date`, `from_wallet`, `to_wallet`, `note`, `ref_id` (tontine, prêt, dette ou projet concerné). Types : `transfer`, `tontine_out`, `tontine_in`, `loan_out`, `loan_back`, `debt_in`, `debt_pay`, `project` et, depuis la 2.6, `adjust`.

Un `adjust` vient de « Vérifier mon solde » : un seul portefeuille (`from_wallet` si l'argent manque, `to_wallet` s'il y en a plus), note `Ajustement : <motif>` (120 caractères). Il corrige le solde sans jamais compter comme une dépense ou un revenu.

## `budgets` : budgets mensuels

Clé (`user_id`, `category`), `amount`.

## `recurring` : dépenses récurrentes

`id`, `label`, `amount`, `fee`, `category`, `method`, `day` (1 à 28), `last_month` (dernier mois réglé, `AAAA-MM`), `active`.

Depuis la 2.6, une échéance n'est jamais enregistrée toute seule : elle apparaît « À payer » jusqu'à ce que tu confirmes le paiement (montant réel, portefeuille, date), ce qui crée la dépense `rec-<id>-<AAAA-MM>` et fait avancer `last_month`. Les mois ignorés sont mémorisés dans `settings.opening.__skip`.

## `settings` : réglages

Une ligne par utilisateur : `savings_goal` (objectif d'épargne mensuel), `opening` (soldes de départ et configuration, taille limitée à 48 Ko), `opening_date`, `emergency_months`, `inflation`.

Le champ `opening` contient les soldes de départ par portefeuille (`especes`, `mtn`, `airtel`, `banque`, `epargne` et les portefeuilles ajoutés) et des clés de configuration commençant par deux tirets bas :

| Clé | Contenu |
|---|---|
| `__wallets` | Portefeuilles personnalisés : `id`, `label`, `color`, `kind`, `archived` |
| `__cats` | Catégories personnalisées et réglages des catégories de base : `id`, `label`, `color` (liste fermée), `need`, `words` (12 maximum), `archived` |
| `__biens` | Biens du patrimoine : `id`, `name`, `value` |
| `__cycle` | Jour de paie réglé à la main : `{ "day": 1 à 28 }` |
| `__rem` | Rappels : `lead` (0, 1 ou 2 jours avant), `hour` (7, 8, 12 ou 18 h, heure de Brazzaville), `amounts` (montant dans la notification), `evening` (rappel du soir à 20 h, sans montant) |
| `__skip` | Échéances récurrentes ignorées : liste de `<id>\|<AAAA-MM>` |
| `__hz` | Horizon du budget quotidien : `pay` (jusqu'à la prochaine paie) ou `month` (fin du mois) |
| `__start` | Démarrage guidé : `{ "done": true }` une fois terminé ou passé |
| `__chk` | Dernière vérification de solde par portefeuille : `{ <portefeuille>: <date> }` |

Toutes ces clés sont relues avec un repli sûr : une valeur inattendue est ignorée sans toucher à la base.

## `push_subscriptions` : appareils inscrits aux rappels

`endpoint` (clé), `user_id`, `p256dh`, `auth`, `agent`, `created_at`. Supprimée à la déconnexion ou quand le serveur Apple ou Google répond 404 ou 410.

## `reminders` : rappels à envoyer

`id` (déterministe : `r-<type>-<élément>-<date>`), `user_id`, `fire_at` (UTC), `title` (80 caractères), `body` (200), `tag`, `sent_at`, `note`. Recalculés par l'application à chaque synchronisation pour les 45 prochains jours ; un rappel déjà envoyé n'est jamais réécrit. Les rappels envoyés depuis plus de 14 jours sont purgés.

## `backups` : copies automatiques

`id` (uuid), `user_id`, `kind` (`auto`, `manuel` ou `serveur`), `counts` (nombre d'éléments et signature `sig` du contenu, pour l'affichage et la détection de changement), `payload` (copie complète au format du fichier JSON, moins de 20 Mo), `created_at`. Un déclencheur conserve les 14 dernières copies automatiques, les 14 dernières copies serveur et les 6 dernières copies manuelles.

Les copies `serveur` sont créées chaque nuit par la fonction `snapshot_backups()` (planifiée par `supabase/cron-sauvegarde.sql`), sans ouvrir l'application. Voir `docs/sauvegardes.md`.

## `journal` : incidents et retours

`id`, `user_id`, `kind` (`erreur` ou `retour`), `message` (1000 caractères), `context` (JSON de moins de 4 Ko : version, écran, diagnostic technique), `created_at`. L'application anonymise avant l'envoi : aucun montant, aucune note, aucune adresse e-mail. L'utilisateur peut lire et ajouter, pas modifier ni supprimer. 60 lignes par heure au plus, 300 conservées. Voir `docs/retours-testeurs.md`.

## Règles de calcul

- Dépense comptée = `amount` + `fee`.
- Solde du mois = somme des entrées du mois − somme des dépenses du mois.
- Projection de fin de mois = dépenses récurrentes du mois + récurrentes encore à venir + autres dépenses × (jours du mois ÷ jour actuel).
