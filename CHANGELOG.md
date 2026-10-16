# Historique des versions

## 2.8.1 (octobre 2026)

Correctif de cohérence entre « Ma situation » et les budgets déjà saisis. Aucune nouvelle donnée, aucun changement du formulaire de dépense.

### Budget sans objet
- Dans **Plan > Budgets mensuels**, un bandeau signale un budget réservé pour un poste que tu as indiqué ne pas payer (par exemple 80 000 FCFA de Logement alors que tu es hébergé). Il n'apparaît que si tu n'as noté aucune dépense récente sur ce poste ni de charge régulière active.
- Deux gestes : **Retirer ce budget** (un second appui confirme, puis un message permet d'annuler pendant quelques secondes) ou **Je le paie** (ton choix est mémorisé dans Ma situation, le budget est conservé).
- Un budget n'est jamais retiré sans ton accord. Sans situation renseignée, rien n'est deviné. Un budget Sport, Soins ou Abonnements sans historique n'est signalé que si tu as décoché ce poste toi-même.

### Éditeur de budgets plus court
- Les postes que tu ne paies pas, sans budget ni dépense ce mois-ci, passent sous **Autres postes (N)**, replié au départ. Les 14 postes restent saisissables : il suffit d'ouvrir le repli. Un poste dès qu'il reçoit un budget ou une dépense revient dans la liste principale.

### Tests
- Nouveau lot `test_coherence_2_8_1` (40 vérifications).

### Mise à jour depuis la 2.8
Aucune action Supabase : pas de migration, pas de fonction à redéployer. L'application se met à jour toute seule au lancement suivant. Les budgets et réponses existants sont repris tels quels.

## 2.8.0 (octobre 2026)

### Le carnet s'adapte à ta situation
- Nouveau bloc **Réglages > Ma situation** (premier de l'écran) : statut (stagiaire ou étudiant, CDD, CDI ou fonctionnaire, indépendant, retraité, sans revenu régulier), logement (locataire, propriétaire, hébergé), déplacements (taxi et bus, moto, voiture, à pied ou trajet pris en charge), personnes à charge. Chaque réponse est facultative.
- Les **budgets proposés ne réservent plus rien pour ce que tu ne paies pas** : hébergé sans loyer, pas de budget Logement ; déplacements pris en charge, pas de budget Transport ; sans enfant ni famille à charge, pas de budget Éducation (sauf pour un stagiaire ou un étudiant). La part de ces postes est répartie sur les autres.
- Tes dépenses réelles passent toujours avant tes réponses : un poste où tu as noté des dépenses dans les 90 derniers jours, ou une charge régulière active, reste proposé. Chaque poste peut aussi être coché ou décoché à la main (« Postes que je paie »), et ce choix l'emporte sur tout.
- L'écran des budgets proposés dit ce qui a été écarté et pourquoi, avec un lien « Modifier ma situation ».
- Fin de stage ou de contrat : une date de fin facultative déclenche, dans les 90 jours, une alerte sur l'accueil qui indique combien de mois ton argent disponible couvre. Pour un revenu instable (stage, CDD, indépendant, sans revenu régulier), un conseil propose de viser 6 mois de fonds d'urgence, en un geste.
- Le **démarrage guidé** passe à 4 étapes et commence par la situation. Les étapes suivantes s'adaptent : un stagiaire parle d'indemnité, un indépendant de revenus irréguliers (budget du jour calculé jusqu'à la fin du mois, sans rappel insistant pour un jour de paie), un retraité de pension. Les charges proposées changent aussi (pas de loyer pour une personne hébergée).

### Nouvelles lignes de budget
- Trois catégories de base : **Soins du corps** (coiffure, tresses, manucure, pédicure, parfum, pommade), **Sport et activités** (salle de sport, foot en salle, tennis, piscine) et **Abonnements en ligne** (musique, cloud, vidéo). Les mots-clés les reconnaissent à la saisie.
- Elles n'ont pas de repère national : leur budget proposé part de tes montants réels (moyenne de tes mois notés, ou charges régulières), plafonné à 15 % des entrées. Sans dépense notée, rien n'est proposé et l'écran l'indique.
- Un nouvel abonnement est rangé par défaut dans « Abonnements en ligne ». La suggestion « Coiffure et beauté » disparaît des modèles, remplacée par la catégorie de base. Les catégories déjà créées ne changent pas.

### Types d'entrées plus variés
- Trois familles : **revenus de travail** (salaire, primes et commissions, honoraires et missions, pourboires, indemnité de stage), **revenus de capital** (revenus locatifs, dividendes, intérêts), **prestations et dons** (pension, indemnisation, allocations et aides, dons et cadeaux), plus « Autre ». Les anciennes entrées gardent leur type.
- Le jour de paie peut être déduit d'un salaire, d'une indemnité de stage ou d'une pension.

### Sécurité et tests
- Les réponses (`settings.opening.__profil`) sont assainies à chaque lecture et à l'import : valeurs hors liste, clés dangereuses, dates impossibles et plus de 40 choix de postes sont écartés sans toucher à la base.
- Nouveaux lots : `test_situation_2_8` (52 vérifications) et `test_securite_2_8` (18 vérifications). Les lots du démarrage guidé, de la catégorie « Autres » hors ligne et du plafond de catégories sont adaptés.

### Mise à jour depuis la 2.7
Aucune action Supabase : pas de migration, pas de fonction à redéployer. L'application se met à jour toute seule au lancement suivant. Les données existantes sont reprises telles quelles, les budgets déjà enregistrés ne bougent pas. Retour à la 2.7 possible : la clé `__profil` est simplement ignorée.

## 2.7.0 (octobre 2026)

### Accueil plus clair
- Bloc principal repensé : « Argent disponible », puis « Budget du jour » (le montant à ne pas dépasser, avec ce qui a déjà été dépensé aujourd'hui et ce qui reste), puis « Prochaine sortie prévue ». Plus de formule ni de vocabulaire technique : le calcul s'ouvre sur demande avec « Comment c'est calculé ? ».
- Le budget du jour reste stable pendant la journée : une dépense saisie le matin ne le fait plus baisser, elle apparaît dans « Aujourd'hui ».
- La date du jour s'affiche dans l'en-tête à la place du mois et de l'année (« Mercredi 14 octobre 2026 »). En parcourant les autres mois, l'en-tête affiche le mois ; toucher le libellé ramène à aujourd'hui.
- Le choix « Jusqu'à la prochaine paie » ou « Jusqu'à la fin du mois » quitte l'accueil : il se règle dans Réglages, sous « Salaire et cycle de paie ». Le réglage déjà choisi est conservé.
- Si l'argent disponible est nul ou négatif, le bloc l'explique et renvoie vers Comptes au lieu d'afficher des zéros.

### Abonnements
- Nouvel écran **Plan > Abonnements** : prochain prélèvement de chacun, périodicité (mensuelle, trimestrielle, semestrielle, annuelle), coût mensuel équivalent, total par mois et par an, répartition par moyen de paiement.
- Les charges récurrentes existantes deviennent des abonnements mensuels, sans aucune écriture au démarrage et sans perte de données. Les paiements déjà enregistrés ne changent pas.
- Prix en dollars ou en euros avec un taux réglé par toi. À chaque paiement, tu peux saisir le montant réellement débité : le carnet propose de retenir le taux observé (et recalcule les autres abonnements dans cette devise) ou le nouveau prix en FCFA.
- Carte prépayée comme portefeuille à part, rechargée depuis Mobile Money (frais de recharge réglables). Alerte « Recharge la carte avant le 25 octobre : il faut 15 494 FCFA de plus pour 2 abonnements », bouton « Recharger » qui prépare le transfert. Un solde de carte négatif est signalé sans fausse alerte.
- Détection d'abonnements dans l'historique : un paiement qui revient à intervalle régulier ou un service en ligne connu est proposé, avec « Ajouter » (formulaire prérempli) ou « Ignorer ».
- Rappels avant le renouvellement (annuel : une semaine avant), fin d'essai gratuit la veille, changement de prix annoncé trois jours avant, recharge de la carte. L'agenda exporté tient compte de la périodicité.
- Sur l'accueil, une alerte apparaît seulement quand quelque chose demande une action : recharge de carte, fin d'essai, nouveau prix.
- Un abonnement se met en pause, se reprend ou se retire avec confirmation ; les dépenses déjà payées sont toujours conservées.

### Sécurité et tests
- Les nouvelles données (`settings.opening.__subs`) sont assainies à chaque lecture et à l'import : clés dangereuses, nombres absurdes, dates impossibles et textes piégés sont écartés sans toucher à la base.
- Deux nouveaux lots : `test_abonnements` (75 vérifications) et `test_securite_2_7` (91 vérifications), plus `test_accueil_2_7` (27). Les lots existants sont adaptés au nouvel accueil.

### Mise à jour depuis la 2.6
Aucune action Supabase : pas de migration, pas de fonction à redéployer. L'application se met à jour toute seule au lancement suivant. Les données existantes sont reprises telles quelles. Retour à la 2.6 possible depuis GitHub : la version 2.6.0 correspond au commit `020c168` de `main`.

## 2.6.0 (octobre 2026)

### Intégrité des données
- Opérations refusées par le serveur : elles restent visibles dans « Opérations à corriger » (accueil et Réglages) avec la cause, jamais présentées comme enregistrées. Pour chacune : Réessayer, Modifier (saisie préremplie) ou Abandonner (avec confirmation). Elles survivent à la fermeture de l'application.
- Dépenses récurrentes : plus de dépense créée toute seule. Chaque échéance passe par « À payer » puis « Payé » avec « Confirmer le paiement » : montant réel, portefeuille et date du paiement (le loyer prévu le 5 et payé le 12 pour 82 000 FCFA est noté tel quel). « Pas ce mois-ci » demande confirmation. Retard affiché en jours, limité aux 3 derniers mois, pas de retard cumulé après une pause. Les prévisions et le reste à vivre réservent les montants à payer. Les mois déjà générés par la 2.5 restent considérés comme payés.
- Détection des changements de sauvegarde sur le contenu et non plus sur la taille : un budget ou un réglage modifié sans changer la longueur du fichier est maintenant détecté. Les dates techniques et l'ordre sont ignorés.
- Restauration avec aperçu : ajoutés, remplacés, conservés (absents de la copie), budgets compris, avec exemples lisibles. Annuler ne change rien. Une copie de sécurité est faite juste avant. Rien n'est jamais supprimé.

### Sauvegarde indépendante de l'application
- Copie serveur de nuit (03 h 30 à Brazzaville) faite par la base elle-même, sans ouvrir l'application, seulement si le contenu a changé : 14 copies conservées. Elle se restaure depuis Réglages comme les autres. Voir docs/sauvegardes.md.
- Date de la dernière copie réussie affichée en clair, avec explication du fonctionnement, alerte si aucune copie récente, et message clair si la copie de nuit n'est pas encore activée.

### Accès et retours des testeurs
- « Mot de passe oublié » : e-mail de réinitialisation avec lien de retour vers l'application, compte à rebours anti-répétition, limite de débit expliquée, lien expiré expliqué, réponse qui ne révèle pas si l'adresse existe.
- Choix du nouveau mot de passe (8 caractères, lettres et chiffres, pas un mot de passe courant, confirmation) et changement du mot de passe depuis Réglages. Case « Afficher le mot de passe » à la connexion.
- « Aide et retours » dans Réglages : « Envoyer le retour » avec un diagnostic joint (version, appareil, écran, aucune donnée financière), partage par le menu du téléphone, conservé hors ligne et envoyé au retour de la connexion.
- Journal des incidents anonymisé : une erreur de l'application est enregistrée sans aucun montant, nombre long ni adresse e-mail, avec la version et l'écran seulement. Limité à 60 lignes par heure et 300 conservées. Voir docs/retours-testeurs.md.

### Confort d'usage
- Accueil allégé : trois informations (argent disponible, utilisable par jour, prochaine échéance) et un bouton pour voir les détails. Le reste (reste à vivre du mois, budgets, à venir, projections) est replié.
- Un seul budget quotidien avec son horizon : jusqu'à la prochaine paie ou jusqu'à la fin du mois, au choix, avec l'explication du calcul. Les charges à payer d'ici là sont déduites.
- Vocabulaire clarifié : « excédent du mois » (entrées moins dépenses) distinct de « mis de côté » (épargne).
- « Vérifier mon solde » : on saisit ce que contient réellement le portefeuille, l'écart devient un ajustement daté avec un motif, jamais compté comme une dépense. Annulable depuis la liste des mouvements.
- Dépenses fréquentes en un geste (favoris proposés d'après l'historique, modifiables dans Réglages) et bouton « Annuler » après chaque saisie.
- Démarrage guidé en 3 étapes (soldes de départ, jour de paie et salaire, charges fixes) puis première dépense, repoussable, relançable depuis Réglages.
- Rappel du soir facultatif à 20 h : « As-tu noté tes dépenses d'aujourd'hui ? », sans montant, annulé si une dépense est déjà notée ce jour-là (l'application et le serveur le vérifient).
- Séparation perso et pro : portefeuilles et catégories marqués Pro, filtre Tout, Perso, Pro en haut de l'accueil. Les soldes réels ne changent jamais, seule la vue change, et le rapport annonce la vue utilisée.
- Conseils tirés de tes propres chiffres (moyenne des 3 derniers mois par catégorie) avant les repères nationaux, qui portent maintenant leur date (INS 2011, prix 2022-2023).

### Tests et qualité
- Les tests entrent dans le dépôt (dossier tests/) : 21 lots et plus de 650 vérifications sur l'application réelle dans Chromium avec un faux Supabase, service worker, analyse des SMS piégés, fonction d'envoi des rappels sous Deno, migrations et sécurité sur PostgreSQL. Lancement : tests/run-all.sh.
- Contrôle automatique GitHub Actions à chaque modification (.github/workflows/tests.yml).

### Mise à jour d'une base 2.5
1. Supabase > SQL Editor : exécuter `supabase/migration-2.6.sql` puis `supabase/cron-sauvegarde.sql` (relançables, aucune donnée touchée).
2. Edge Functions : redéployer `send-reminders` avec le nouveau contenu de `supabase/functions/send-reminders/index.ts` (rappel du soir).
3. L'application se met à jour toute seule au lancement suivant.

### Sécurité
- Table `journal` : RLS propriétaire, écriture seule pour l'utilisateur, aucun droit pour le rôle anonyme, bornes de taille, limite horaire.
- Fonction `snapshot_backups` : réservée à la base (aucun droit public), un utilisateur en échec ne bloque pas les autres.
- Configuration étendue (`__hz`, `__start`, `__chk`, rappel du soir) relue avec un repli sûr, import et restauration assainis comme avant. Mouvements `adjust` acceptés à l'import.
- Faille corrigée avant publication : une date piégée dans la configuration (dernière vérification de solde) pouvait injecter du code dans l'écran Comptes. Les dates affichées passent maintenant toutes par une fonction qui ne renvoie qu'une date ou « - ». Nouveau test `test_securite_2_6.py` : données hostiles dans les favoris, récurrentes, ajustements, « À corriger », démarrage guidé, filtre perso et pro, portefeuilles et catégories.
- Aucun changement de la politique CSP. Les nouveaux textes affichés sont tous échappés.

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
