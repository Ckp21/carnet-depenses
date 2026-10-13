# Historique des versions

## 2.5.0 (octobre 2026)
- Catégories personnalisables : renommer et recolorer les 11 catégories de base, ajouter les tiennes (jusqu'à 20) avec nature besoin ou envie et mots-clés pour la proposition automatique. Modèles prêts pour le contexte congolais (dîme et offrandes, solidarité deuil et mariage, coiffure, scolarité, groupe électrogène). Une catégorie utilisée s'archive, elle ne se supprime pas.
- Cycle de paie : jour de paie détecté depuis les salaires notés (ou réglé à la main), compte à rebours jusqu'au prochain salaire, nombre de jours que tes liquidités permettent de tenir à ton rythme actuel, charges à venir comprises.
- Scénario « salaire en retard » : si le salaire n'est pas arrivé, ce que devient ton budget par jour s'il arrive dans 7, 14, 21 ou 30 jours, avec la limite quotidienne à respecter pour tenir 14 jours.
- Modèles d'objectifs pour le contexte congolais : rentrée scolaire, terrain par tranches, caution de loyer, cérémonie, fêtes de fin d'année, construction par étapes. Le montant et la mise de côté mensuelle sont calculés avant création dans l'onglet Plan.
- Rappels par notification (Web Push) : loyer et récurrentes, cotisations et réceptions de tontine, échéances de dettes, prêts et projets, jour de paie, salaire non noté, bilan du mois. Aucun montant dans la notification par défaut. Mise en service : docs/notifications.md.
- Police Montserrat hébergée dans le dépôt (fonts/) : plus aucune requête vers Google Fonts, CSP réduite à `font-src 'self'`.

### Sauvegarde, synchronisation et reporting
- Synchronisation à la reconnexion : file d'envoi conservée même après fermeture de l'application, nouvel essai automatique après 5 s, 15 s, 45 s, 2 min 15 s puis toutes les 5 minutes, indicateur d'état (hors ligne, en attente, nouvel essai dans N s), appui sur l'indicateur pour relancer, journal des 8 dernières synchronisations dans Réglages. Un envoi rejoué ne crée jamais de doublon.
- Copie automatique quotidienne côté serveur (table `backups`) : une copie complète au plus toutes les 20 heures et seulement si les données ont changé, 14 copies conservées plus 6 copies manuelles. Restauration depuis la liste dans Réglages, avec aperçu. Restaurer ne supprime jamais rien.
- Sauvegarde sur fichier : partage vers Fichiers ou WhatsApp sur iPhone, rappel après 45 jours sans fichier (14 jours après la première utilisation), une fois 20 dépenses notées.
- Rapport mensuel : document propre (chiffres du mois, catégories et budgets, cinq plus grosses dépenses, moyens de paiement, soldes des portefeuilles, engagements), impression en PDF, résumé partageable par WhatsApp. Le rapport affiche les vrais montants même en mode discret.
- Bilan du mois précédent : boutons « Rapport complet » et « Partager » dans l'accueil la première semaine du mois.

### Sécurité
- Nouvelles tables `push_subscriptions`, `reminders` et `backups` : RLS propriétaire, aucun droit pour le rôle anonyme, bornes de taille.
- Fonction `send-reminders` : POST uniquement, secret partagé comparé à temps constant, clé privée VAPID uniquement dans les secrets, inscriptions expirées supprimées.
- Service worker : titre, texte et étiquette des notifications bornés et forcés en texte, lien du message ignoré.
- Import et restauration : identifiants de type texte uniquement et sans nom hérité de l'objet (toString, valueOf), montants plafonnés comme en base (moins de 1 milliard, frais moins de 100 millions), dates limitées à 2000-2100, configuration fusionnée puis nettoyée avant réécriture.
- Catégories, cycle de paie et rappels lus avec repli sûr : couleurs hors liste, mots-clés, identifiants et valeurs numériques inattendus ignorés.
- `supabase/migration-2.5.sql` : relançable sans risque. `supabase/cron-rappels.sql` : modèle sans secret.

## 2.4.0 (octobre 2026)
- Portefeuilles personnalisables : renommer et recolorer ceux qui existent, en ajouter (type, couleur, solde de départ), les archiver quand leur solde est à 0 et les restaurer. L'historique est toujours conservé.
- Mode discret refait : les montants sont remplacés par des étoiles (****) partout, comme dans une application bancaire. Les champs de saisie restent lisibles.
- Structure d'application : en-tête vert jusqu'en haut de l'écran (plus de bande floue), barre d'onglets et bouton Ajouter immobiles quel que soit le contenu, seul le contenu défile.
- Prix de repère : la fibre Congo Telecom et CanalBox passent à 15 000 FCFA par mois (offre d'entrée).

### Sécurité
- Faille corrigée : un fichier de sauvegarde piégé pouvait exécuter du code dans l'onglet Plan (nombre de membres d'une tontine non échappé). Les données de plan, les soldes et les identifiants sont maintenant assainis à l'import.
- Politique de sécurité du contenu (CSP) : seul le code de l'application et Supabase sont autorisés, aucun script injecté ne peut s'exécuter.
- Bibliothèque Supabase hébergée dans le dépôt (lib/supabase.js) : plus de dépendance à un CDN externe.
- Export CSV : les cellules commençant par = + - @ sont neutralisées (injection de formules Excel).
- Export calendrier : retours chariot retirés des textes.
- Identifiants spéciaux (__proto__, constructor) refusés ; anti-cadre contre le détournement de clic ; en-tête Referrer désactivé.
- Valeurs inattendues venant de la base : repli sûr à l'affichage sans toucher aux données. Tables de correspondance sans prototype.
- Fichier data/import-v1.json retiré du dépôt public ; empreinte SHA-384 de la bibliothèque dans lib/LISEZ-MOI.txt.
- supabase/migration-2.4-securite.sql : droits retirés au rôle anonyme, bornes de taille et de valeur côté serveur.

## 2.3.2 (octobre 2026)
- Lecture des SMS Airtel Money Congo : montant écrit « CFA 1500.00 », frais « CFA 0.00 », date tirée de la référence (Trans.ID CI… ou Ref MP…), marchand après « a » (DATABUNDLE, CANAL PLUS).
- Jeu de tests SMS anonymisé (MTN et Airtel) : tests/sms-mobile-money-congo.json.

## 2.3.1 (octobre 2026)
- Lecture des SMS calée sur les vrais messages MTN Mobile Money Congo : envoi, paiement (« pour leap »), réception, dépôt et retrait chez l'agent, avec frais et date. Opérateur MTN par défaut, Airtel reconnu à son nom.

## 2.3 (octobre 2026)
- Saisie depuis un SMS MTN MoMo ou Airtel Money : montant, frais, date, opérateur et type (paiement, argent reçu, retrait) remplis automatiquement. Un SMS collé dans la fenêtre est reconnu tout seul.
- Catégorie proposée d'après la note (mots-clés locaux et historique des dépenses).
- Alerte de rythme quand le reste à vivre se consomme plus vite que le mois.
- « Chaque franc a une mission » : reste à affecter après budgets, épargne, tontines et projets, avec envoi du reste vers l'épargne.
- Patrimoine net : liquidités, biens (parcelle, véhicule), créances et dettes.
- Échéances des 10 prochains jours et export vers le calendrier du téléphone (fichier .ics avec rappels).
- Mode discret qui masque les montants.

## 2.2 (octobre 2026)
- Connexion avec Face ID (clés d'accès Supabase), verrouillage à l'ouverture et après 2 minutes en arrière-plan, déverrouillage biométrique aussi hors ligne.
- Option « Rester connecté sur cet appareil » ; adresse mémorisée ; mot de passe confié au trousseau du téléphone, jamais à l'application.
- Comportement d'application sur iPhone : pas de zoom, pas de rebond de l'arrière-plan, fond figé quand une fenêtre est ouverte, barre d'état verte, guide d'installation depuis Safari.
- Bibliothèque Supabase mise à jour (2.117.2).

## 2.1 (octobre 2026)
- Refonte selon la charte graphique : Vert #04382A, Orange #F47521, Brume, Montserrat (repli officiel de Gotham), cartes arrondies sans ombre, boutons en pilule, un seul élément orange par écran, icônes Lucide avec libellé, messages en quatre tons avec icône.
- Portefeuilles (Espèces, MTN MoMo, Airtel Money, Banque/Carte, Épargne) avec soldes de départ et mouvements : transferts, tontines, prêts, dettes, projets. Les frais deviennent des « Frais financiers ».
- Besoin ou envie sur chaque dépense, proposé automatiquement selon la catégorie.
- Indicateurs : budget par jour, reste à vivre, taux d'épargne, fonds d'urgence en mois couverts, dépenses inhabituelles, alertes d'échéance.
- Plan : projets d'épargne avec effort mensuel, tontines avec date du tour, prêts et dettes.
- Analyse sur 3, 6 ou 12 mois : statistiques, entrées et dépenses, rythme du mois, catégories, écarts à la moyenne, jour de la semaine, besoins et envies, pouvoir d'achat corrigé de l'inflation, moyens de paiement.
- Migration de base : supabase/migration-2.1.sql. L'application garde les saisies en attente tant que la migration n'est pas faite.

## 2.0 (octobre 2026)
- Application installable (PWA) hébergée sur GitHub Pages, données dans Supabase avec connexion par e-mail et mot de passe.
- Fonctionnement hors ligne : cache local et file d'attente synchronisée au retour du réseau.
- Dépenses récurrentes ajoutées automatiquement chaque mois, sans doublon.
- Objectif d'épargne, épargne du mois, cumul et graphique sur 6 mois.
- Frais Mobile Money (MTN MoMo, Airtel Money) sur chaque dépense, totaux du mois et de l'année.
- Plusieurs entrées d'argent par mois (salaire, prime, mission, autre).
- Bilan mensuel du mois précédent.
- Sauvegarde complète en JSON et restauration ; recherche dans les dépenses ; montants rapides.
- Projection de fin de mois qui compte les charges fixes une seule fois.
- Un budget atteint exactement n'est plus signalé comme dépassé.

## 1.2 (13 octobre 2026)
- Onglet Conseils : retrait du bloc « Ton revenu face aux repères ».

## 1.1 (13 octobre 2026)
- Onglet Conseils basé sur les statistiques du Congo.

## 1.0 (13 octobre 2026)
- Première version sous forme d'artifact claude.ai.
