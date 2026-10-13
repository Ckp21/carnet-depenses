-- Planification de l'envoi des rappels : toutes les 5 minutes, la base appelle la fonction « send-reminders ».
-- À exécuter UNE FOIS dans SQL Editor, APRÈS avoir déployé la fonction (voir docs/notifications.md).
-- Remplace REMPLACE_PAR_LE_SECRET par la valeur de CRON_SECRET que tu as enregistrée dans les secrets de la fonction.
-- Ne publie jamais ce fichier une fois rempli.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('carnet-rappels') where exists (select 1 from cron.job where jobname = 'carnet-rappels');

select cron.schedule(
  'carnet-rappels',
  '*/5 * * * *',
  $$
  select net.http_post(
    url     := 'https://btadceaowokrvubaaiui.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'x-cron-secret', 'REMPLACE_PAR_LE_SECRET'
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- Contrôle : la tâche doit apparaître, puis ses exécutions dans cron.job_run_details
select jobid, jobname, schedule, active from cron.job where jobname = 'carnet-rappels';
