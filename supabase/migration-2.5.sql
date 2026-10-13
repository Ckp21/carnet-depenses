-- Carnet de dépenses 2.5 : rappels par notification et sauvegardes automatiques
-- À exécuter une fois dans Supabase > SQL Editor > New query > Run. Peut être relancé sans erreur.
-- Aucune donnée existante n'est modifiée ni supprimée.

-- 1. Réglages : la zone de configuration (portefeuilles, catégories, cycle de paie, rappels, biens) passe de 16 Ko à 48 Ko
alter table public.settings drop constraint if exists settings_borne;
alter table public.settings add constraint settings_borne check (pg_column_size(opening) < 49152) not valid;

-- 2. Appareils abonnés aux notifications (une ligne par téléphone)
create table if not exists public.push_subscriptions (
  endpoint    text primary key check (char_length(endpoint) <= 700),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  p256dh      text not null check (char_length(p256dh) <= 200),
  auth        text not null check (char_length(auth) <= 100),
  agent       text not null default '' check (char_length(agent) <= 200),
  created_at  timestamptz not null default now()
);
create index if not exists push_subscriptions_user on public.push_subscriptions (user_id);

-- 3. Rappels programmés (le carnet les recalcule à chaque synchronisation ; le serveur les envoie à l'heure dite)
create table if not exists public.reminders (
  id          text primary key check (char_length(id) <= 120),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  fire_at     timestamptz not null,
  title       text not null check (char_length(title) <= 80),
  body        text not null default '' check (char_length(body) <= 200),
  tag         text not null default '' check (char_length(tag) <= 60),
  sent_at     timestamptz,
  note        text check (char_length(note) <= 200),
  created_at  timestamptz not null default now()
);
create index if not exists reminders_due  on public.reminders (fire_at) where sent_at is null;
create index if not exists reminders_user on public.reminders (user_id);

-- 4. Sauvegardes automatiques (copie complète des données, une par jour au maximum)
create table if not exists public.backups (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  kind        text not null default 'auto' check (kind in ('auto','manuel')),
  counts      jsonb not null default '{}'::jsonb check (pg_column_size(counts) < 2048),
  payload     jsonb not null check (pg_column_size(payload) < 20000000),
  created_at  timestamptz not null default now()
);
create index if not exists backups_user_date on public.backups (user_id, created_at desc);

-- Historique limité : 14 copies automatiques et 6 manuelles par utilisateur, les plus anciennes sont retirées
create or replace function public.trim_backups() returns trigger
language plpgsql set search_path = public as $$
begin
  delete from public.backups
   where user_id = new.user_id and kind = new.kind
     and id not in (select id from public.backups
                     where user_id = new.user_id and kind = new.kind
                     order by created_at desc
                     limit case when new.kind = 'auto' then 14 else 6 end);
  return null;
end $$;
drop trigger if exists backups_trim on public.backups;
create trigger backups_trim after insert on public.backups for each row execute function public.trim_backups();

-- 5. Sécurité : chaque utilisateur ne voit et ne modifie que ses propres lignes, les visiteurs anonymes n'ont aucun droit
do $$
declare t text;
begin
  foreach t in array array['push_subscriptions','reminders','backups'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "proprietaire" on public.%I', t);
    execute format(
      'create policy "proprietaire" on public.%I for all to authenticated
         using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

-- Contrôle : toutes les tables doivent afficher rowsecurity = true
select tablename, rowsecurity from pg_tables where schemaname = 'public' order by tablename;

notify pgrst, 'reload schema';
