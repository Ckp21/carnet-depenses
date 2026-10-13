# Carnet de dépenses V2.5

Application personnelle de gestion des dépenses en FCFA, installable sur téléphone et utilisable hors ligne.
Version 2.5, octobre 2026. Auteur : Prince Quenauld Christian EKOUYA.

---

## 1. Ce que fait la V2

- **Saisie rapide** des dépenses et des **entrées d'argent** (salaire, prime, mission, autre), avec montants rapides.
- **Frais Mobile Money** : champ dédié pour MTN MoMo et Airtel Money, total du mois et de l'année.
- **Dépenses récurrentes** : loyer, forfait, factures, ajoutés automatiquement chaque mois au jour choisi.
- **Objectif d'épargne** : épargne du mois, cumul depuis le début, graphique sur 6 mois.
- **Bilan mensuel** : résumé du mois précédent affiché la première semaine du mois, et dans l'onglet Conseils.
- **Conseils Congo** : projection de fin de mois, propositions par poste, comparaison INS Brazzaville, budgets proposés.
- **Sauvegarde et restauration** complètes en fichier JSON, export CSV pour Excel.
- **Hors ligne** : saisie possible sans connexion, envoi automatique au retour du réseau.
- **Installable** sur l'écran d'accueil (PWA).

## 1 bis. Nouveautés de la V2.1

- Design conforme à la charte graphique (registre « Outil »), police Montserrat.
- Portefeuilles et mouvements : transferts, tontines, prêts, dettes, projets d'épargne.
- Budget par jour, reste à vivre, taux d'épargne, fonds d'urgence, dépenses inhabituelles.
- Onglet Analyse : graphiques et statistiques sur 3, 6 ou 12 mois, pouvoir d'achat corrigé de l'inflation.

**Mise à jour d'une base V2.0** : exécuter une fois `supabase/migration-2.1.sql` dans *SQL Editor*, avant ou juste après la mise en ligne.

## 1 ter. Nouveautés de la V2.5

- **Catégories personnalisables** : renommer, recolorer, ajouter les tiennes (dîme, solidarité, coiffure, scolarité, groupe électrogène en un geste).
- **Cycle de paie** et scénario « salaire en retard » : combien de jours tu tiens, et quelle limite par jour respecter.
- **Modèles d'objectifs** : rentrée scolaire, terrain par tranches, caution de loyer, cérémonie, fêtes, chantier.
- **Rappels par notification** : loyer, tontines, dettes, projets, jour de paie, bilan du mois. Guide : `docs/notifications.md`.
- **Sauvegarde** : copie automatique quotidienne côté serveur (14 jours), restauration avec aperçu, fichier JSON partageable.
- **Synchronisation** : file d'envoi durable, nouvel essai automatique, indicateur d'état et journal dans Réglages.
- **Rapport mensuel** : document imprimable en PDF et résumé à envoyer par WhatsApp.
- **Police hébergée** : plus aucune requête vers un site externe en dehors de Supabase.

**Mise à jour d'une base V2.4** : exécuter `supabase/migration-2.5.sql` dans *SQL Editor* (relançable sans risque). Les rappels demandent en plus la fonction `send-reminders` et sa planification, voir `docs/notifications.md`.

## 2. Architecture

```mermaid
flowchart LR
  T[Téléphone<br/>application installée] -- lecture et saisie --> C[(Cache local)]
  C -- file d'attente --> S[(Supabase<br/>base PostgreSQL)]
  S -- synchronisation --> C
  G[GitHub Pages] -- code de l'application --> T
```

| Élément | Rôle |
|---|---|
| `index.html`, `styles.css`, `app.js` | L'application |
| `config.js` | Adresse et clé publique Supabase |
| `lib/supabase.js` | Bibliothèque supabase-js 2.117.2 (MIT), hébergée ici plutôt que sur un CDN |
| `sw.js`, `manifest.webmanifest`, `icons/` | Installation, fonctionnement hors ligne, réception des notifications |
| `fonts/` | Police Montserrat (licence OFL), hébergée dans le dépôt |
| `supabase/schema.sql` et `migration-*.sql` | Création et évolution des tables et des règles de sécurité |
| `supabase/functions/send-reminders/` | Fonction qui envoie les rappels (Web Push) |
| `supabase/cron-rappels.sql` | Modèle de planification de l'envoi, à remplir hors dépôt |
| `docs/` | Cahier des charges, modèle de données, repères Congo, guide des notifications |

## 3. Mise en service (une seule fois)

### 3.1 Supabase

1. Créer un projet sur supabase.com, région Europe.
2. *SQL Editor > New query* : coller le contenu de `supabase/schema.sql`, puis *Run*.
3. *Authentication > URL Configuration* : mettre l'adresse GitHub Pages dans *Site URL* (exemple : `https://ton-compte.github.io/carnet-depenses/`).
4. *Project Settings > API* : copier l'**URL du projet** et la **clé publique** (`anon` ou `publishable`) dans `config.js`.

> Ne jamais mettre la clé `service_role` dans le code : elle contourne toutes les protections.

### 3.2 GitHub Pages

1. Pousser le contenu de ce dossier dans le dépôt `carnet-depenses` (branche `main`).
2. *Settings > Pages* : *Source* = *Deploy from a branch*, branche `main`, dossier `/ (root)`.
3. L'application est disponible après une à deux minutes à l'adresse `https://ton-compte.github.io/carnet-depenses/`.

### 3.3 Premier lancement

1. Ouvrir l'adresse sur le téléphone, toucher **Créer mon compte**, confirmer l'e-mail reçu, puis se connecter.
2. Dans Supabase, *Authentication > Sign In / Providers* : désactiver **Allow new users to sign up**. Plus personne d'autre ne pourra créer de compte.
3. *Réglages > Restaurer un fichier* : importer une sauvegarde JSON si tu reprends des données existantes. Garde tes sauvegardes hors du dépôt public (le dossier `data/` est ignoré par Git).
4. Installer l'application : sur Android, menu ⋮ puis *Installer l'application* ; sur iPhone, *Partager* puis *Sur l'écran d'accueil*.

## 3 bis. Activer Face ID (une seule fois)

Dans Supabase, *Authentication > Passkeys* : activer, puis renseigner

| Champ | Valeur |
|---|---|
| Relying Party Display Name | Carnet de dépenses |
| Relying Party ID | ckp21.github.io |
| Relying Party Origins | https://ckp21.github.io |

Ensuite, dans l'application : *Réglages > Sécurité > Connexion avec Face ID > Activer*.

> Ne jamais modifier le Relying Party ID après coup : les clés déjà créées deviendraient inutilisables.

## 4. Sécurité

- Chaque ligne de la base porte l'identifiant de son propriétaire. Les règles RLS empêchent tout autre compte de la lire ou de la modifier.
- La clé publique présente dans `config.js` ne donne accès à rien sans connexion.
- Le dépôt public ne contient que le code, jamais les données personnelles. Si l'adresse Supabase change, mettre à jour aussi la politique CSP dans `index.html`.
- Politique CSP : scripts limités à l'application elle-même ; un script injecté ne s'exécute pas.
- La déconnexion efface la copie locale du téléphone.

## 5. Sauvegarde, synchronisation et rapports

```mermaid
flowchart TD
  A[Saisie sur le téléphone] --> B[Cache local + file d'envoi]
  B -->|connexion disponible| C[(Supabase)]
  B -->|hors ligne ou échec| D[Nouvel essai automatique<br/>5 s, 15 s, 45 s, 2 min, puis 5 min]
  D --> B
  C --> E[Copie automatique<br/>toutes les 20 h si changement]
  A --> F[Fichier JSON<br/>Fichiers ou WhatsApp]
  A --> G[Rapport du mois<br/>PDF ou résumé]
```

| Niveau | Où | Durée de conservation |
|---|---|---|
| 1. Cache du téléphone | Navigateur de l'appareil | Jusqu'à la déconnexion |
| 2. Base Supabase | Serveur | Tant que le projet existe |
| 3. Copies automatiques | Table `backups` | 14 copies, plus 6 copies manuelles |
| 4. Fichier JSON | Fichiers, WhatsApp, courriel | À ta charge, rappel après 45 jours |

Le niveau 4 est le seul qui te protège si le compte Supabase est perdu : télécharge un fichier chaque mois. L'offre gratuite de Supabase ne propose pas de sauvegardes téléchargeables et met le projet en pause après environ une semaine sans activité.

Restaurer ne supprime jamais rien : les éléments de la copie sont remis, le reste est conservé.

## 6. Mettre à jour l'application

Modifier les fichiers, puis changer la constante `VERSION` dans `sw.js` (par exemple `carnet-v2.5.1`) avant de pousser. Les téléphones récupèrent la nouvelle version au lancement suivant.

## 7. Limites connues

- Structure de consommation INS de 2011 et prix alimentaires de 2022-2023 (voir `docs/reperes-cout-de-la-vie-congo.md`).
- En cas de modification du même élément sur deux appareils hors ligne, la dernière synchronisation l'emporte.
- Le bilan mensuel est calculé dans l'application ; il n'est pas envoyé par e-mail. Une notification te prévient le 1er du mois.
- Les rappels demandent l'application installée sur l'écran d'accueil (iPhone 16.4 minimum) et un serveur de rappels configuré par toi (voir `docs/notifications.md`).
- La lecture automatique des SMS n'est pas possible dans une application web : la saisie se fait en collant le SMS.
