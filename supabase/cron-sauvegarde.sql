-- Carnet de dépenses : copie serveur de nuit (aucun secret dans ce fichier)
-- À exécuter une fois dans Supabase > SQL Editor, après migration-2.6.sql.
-- Chaque nuit à 02 h 30 UTC (03 h 30 à Brazzaville), la base enregistre une copie complète des données
-- de chaque utilisateur, seulement si le contenu a changé depuis la précédente. Il n'est pas nécessaire d'ouvrir l'application.

create extension if not exists pg_cron;

select cron.unschedule('carnet-sauvegarde') where exists (select 1 from cron.job where jobname = 'carnet-sauvegarde');
select cron.schedule('carnet-sauvegarde', '30 2 * * *', 'select public.snapshot_backups()');

-- Contrôle : la tâche doit apparaître avec active = true
select jobname, schedule, active from cron.job where jobname = 'carnet-sauvegarde';

-- Essai immédiat (facultatif) : renvoie le nombre de copies créées
-- select public.snapshot_backups();
