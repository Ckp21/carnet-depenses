# Tests du Carnet de dépenses

Chaque modification doit passer toute la suite avant d'être fusionnée dans `main`.

```bash
tests/run-all.sh          # suite complète
tests/run-all.sh rapide   # sans la base SQL ni la fonction Deno
```

| Dossier | Ce qui est vérifié | Outils |
|---|---|---|
| `browser/` | L'application réelle dans Chromium avec un faux Supabase en mémoire : saisie, solde, budgets, récurrentes, sauvegardes, import hostile, XSS, CSP, accès (connexion, mot de passe oublié), confort (accueil, favoris, vérifier mon solde, démarrage guidé) | Python, Playwright |
| `node/` | Service worker (notifications, version du cache alignée sur l'application) et résistance de l'analyse des SMS aux textes piégés | Node |
| `edge/` | La vraie fonction d'envoi des rappels sous Deno, avec base et service Web Push simulés | Deno, openssl |
| `serveur/` | Migrations relançables, sécurité par ligne (RLS), copie serveur de nuit, journal, sur une vraie base PostgreSQL | PostgreSQL |

## Principes

- Les tests n'utilisent jamais le vrai projet Supabase ni de vraies données : `browser/fake-supabase.js` et `browser/seed.json` sont fictifs.
- L'horloge est figée dans les tests qui dépendent d'une date (13 octobre 2026, 10 h à Brazzaville), sinon leurs résultats changeraient chaque jour.
- Le démarrage guidé est repoussé par défaut dans `common.boot` (paramètre `onb=True` pour le tester).
- Un test qui échoue doit être corrigé ou expliqué, jamais supprimé pour faire passer la suite.

## Prérequis locaux

```bash
pip install playwright && python -m playwright install chromium
# Fonction Deno : installer Deno, ou  cd tests/edge && npm i deno  puis  DENO=tests/edge/node_modules/.bin/deno
# SQL : un PostgreSQL local (DATABASE_URL=postgresql://... tests/serveur/test-sql.sh) ou tests/serveur/pg-local.sh
```

## Protection de la branche main (à régler une fois sur GitHub)

Dépôt > Settings > Branches > Add branch protection rule, branche `main` :
- Require a pull request before merging
- Require status checks to pass : choisir « tests »
- Do not allow force pushes
