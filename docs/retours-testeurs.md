# Faire tester l'application et recueillir les retours

## 1. Donner accès à un testeur

Chaque testeur a son propre compte. Ses données sont invisibles pour les autres : les règles RLS limitent chaque ligne à son propriétaire.

1. *Supabase > Authentication > Users > Add user > Create new user* : adresse du testeur, mot de passe provisoire, case « Auto Confirm User » cochée.
2. Lui envoyer l'adresse de l'application et le mot de passe provisoire par un canal privé.
3. Lui demander de changer son mot de passe dans *Réglages* dès la première connexion.

### Mot de passe oublié

Le bouton « Mot de passe oublié » envoie un courriel par le service de Supabase. Tant qu'aucun service d'envoi personnalisé (SMTP) n'est configuré, Supabase n'envoie qu'aux adresses de l'équipe du projet et limite le nombre d'envois par heure. Pour un testeur extérieur, deux solutions :

- *Authentication > Users*, menu du compte > réinitialiser le mot de passe à la main, puis le lui transmettre ;
- configurer un SMTP (*Authentication > Emails > SMTP Settings*, avec un service d'envoi de ton choix) : le bouton fonctionne alors pour tout le monde.

## 2. Ce que le testeur peut faire

*Réglages > Aide et retours*, écrire quelques mots puis **Envoyer le retour** (ou **Partager par message**). « Voir ce qui est joint » montre le diagnostic avant l'envoi :

| Joint | Jamais joint |
|---|---|
| Version de l'application | Montants |
| Écran affiché | Notes et libellés |
| Type d'appareil, application installée ou non | Adresse e-mail |
| État de la connexion et de la synchronisation | Contenu du carnet |

Hors ligne, le retour est gardé et envoyé au retour de la connexion. Le bouton « Partager par message » passe par le menu du téléphone (WhatsApp, courriel).

## 3. Journal des erreurs

Quand l'application rencontre une erreur, elle l'enregistre dans la table `journal` (type `erreur`) avec la version et l'écran seulement. Avant l'envoi, tout nombre long et toute adresse e-mail sont masqués. Sans connexion, l'erreur attend dans le téléphone. Garde-fous : 60 lignes par heure et par compte, 300 conservées.

## 4. Lire les retours (SQL Editor)

```sql
-- Derniers retours et erreurs, tous testeurs
select created_at, kind, message, context->>'v' as version, context->>'tab' as ecran
from public.journal order by created_at desc limit 50;

-- Erreurs les plus fréquentes
select message, count(*) as fois, max(created_at) as derniere
from public.journal where kind = 'erreur'
group by message order by fois desc, derniere desc limit 20;
```

Le SQL Editor lit tous les comptes. Les testeurs, eux, ne voient que leurs propres lignes.

## 5. Parcours de test conseillé (10 minutes)

1. Se connecter, suivre le démarrage guidé (soldes, jour de paie, une charge fixe).
2. Noter 3 dépenses, dont une avec le bouton **Annuler** juste après.
3. Toucher **Vérifier mon solde** sur un portefeuille et corriger l'écart.
4. Payer une charge fixe depuis « À payer » avec un montant différent du prévu.
5. Passer en mode avion, noter une dépense, rétablir le réseau, vérifier qu'elle arrive.
6. Envoyer un retour : « Ce que j'ai trouvé confus ».

Trois questions à poser ensuite : qu'est-ce qui t'a ralenti ? Qu'est-ce que tu ne comprends pas dans l'écran d'accueil ? Qu'est-ce que tu aurais voulu noter et que tu n'as pas pu ?
