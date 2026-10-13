# Historique des versions

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
