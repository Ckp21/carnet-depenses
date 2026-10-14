-- Carnet de dépenses 2.6 : copie serveur de nuit, ajustements de solde, journal des incidents
-- À exécuter une fois dans Supabase > SQL Editor > New query > Run. Peut être relancé sans erreur.
-- Aucune donnée existante n'est modifiée ni supprimée.

-- 1. Ajustement de solde (« Vérifier mon solde ») : nouveau type de mouvement
alter table public.moves drop constraint if exists moves_kind_check;
alter table public.moves add constraint moves_kind_check
  check (kind in ('transfer','tontine_out','tontine_in','loan_out','loan_back','debt_in','debt_pay','project','adjust'));

-- 2. Sauvegardes : nouveau type « serveur » (copie faite la nuit par la base, sans ouvrir l'application)
alter table public.backups drop constraint if exists backups_kind_check;
alter table public.backups add constraint backups_kind_check check (kind in ('auto','manuel','serveur'));

-- Historique limité : 14 copies automatiques, 14 copies serveur, 6 copies manuelles par utilisateur
create or replace function public.trim_backups() returns trigger
language plpgsql set search_path = public as $$
begin
  delete from public.backups
   where user_id = new.user_id and kind = new.kind
     and id not in (select id from public.backups
                     where user_id = new.user_id and kind = new.kind
                     order by created_at desc
                     limit case when new.kind = 'manuel' then 6 else 14 end);
  return null;
end $$;

-- 3. Copie serveur : une copie complète par utilisateur, seulement si le contenu a changé depuis la précédente.
--    Même format que le fichier JSON de sauvegarde : elle se restaure depuis l'application comme les autres.
create or replace function public.snapshot_backups() returns integer
language plpgsql security definer set search_path = public as $$
declare u uuid; n integer := 0; pay jsonb; sg text; last_sig text;
begin
  for u in select user_id from public.expenses union select user_id from public.incomes loop
    begin
      pay := jsonb_build_object(
        'app', 'carnet-depenses',
        'version', 'serveur',
        'expenses',  coalesce((select jsonb_agg(to_jsonb(x) - 'user_id' order by x.date, x.id) from public.expenses  x where x.user_id = u), '[]'::jsonb),
        'incomes',   coalesce((select jsonb_agg(to_jsonb(x) - 'user_id' order by x.date, x.id) from public.incomes   x where x.user_id = u), '[]'::jsonb),
        'moves',     coalesce((select jsonb_agg(to_jsonb(x) - 'user_id' order by x.date, x.id) from public.moves     x where x.user_id = u), '[]'::jsonb),
        'plans',     coalesce((select jsonb_agg(to_jsonb(x) - 'user_id' order by x.id)         from public.plans     x where x.user_id = u), '[]'::jsonb),
        'recurring', coalesce((select jsonb_agg(to_jsonb(x) - 'user_id' order by x.id)         from public.recurring x where x.user_id = u), '[]'::jsonb),
        'budgets',   coalesce((select jsonb_object_agg(b.category, b.amount) from public.budgets b where b.user_id = u), '{}'::jsonb),
        'settings',  (select to_jsonb(s) - 'user_id' from public.settings s where s.user_id = u));
      sg := md5(pay::text);
      select counts ->> 'sig' into last_sig from public.backups
       where user_id = u and kind = 'serveur' order by created_at desc limit 1;
      if last_sig is distinct from sg then
        insert into public.backups (user_id, kind, counts, payload)
        values (u, 'serveur',
                jsonb_build_object('expenses', jsonb_array_length(pay -> 'expenses'), 'incomes', jsonb_array_length(pay -> 'incomes'),
                                   'moves', jsonb_array_length(pay -> 'moves'), 'plans', jsonb_array_length(pay -> 'plans'),
                                   'recurring', jsonb_array_length(pay -> 'recurring'), 'sig', sg),
                pay || jsonb_build_object('exported_at', now()));
        n := n + 1;
      end if;
    exception when others then
      -- Un utilisateur en échec (copie trop volumineuse, par exemple) ne bloque pas les autres
      raise warning 'snapshot_backups : utilisateur % ignoré : %', u, sqlerrm;
    end;
  end loop;
  return n;
end $$;
revoke all on function public.snapshot_backups() from public, anon, authenticated;

-- 4. Journal des incidents et retours des testeurs (anonymisé côté application : aucun montant, aucune note)
create table if not exists public.journal (
  id          bigint generated always as identity primary key,
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  kind        text not null check (kind in ('erreur','retour')),
  message     text not null check (char_length(message) <= 1000),
  context     jsonb not null default '{}'::jsonb check (pg_column_size(context) < 4096),
  created_at  timestamptz not null default now()
);
create index if not exists journal_user_date on public.journal (user_id, created_at desc);

-- Garde-fous : au plus 60 lignes par heure et par utilisateur (les suivantes sont ignorées), 300 lignes conservées
create or replace function public.journal_limit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.journal where user_id = new.user_id and created_at > now() - interval '1 hour') >= 60 then
    return null;
  end if;
  return new;
end $$;
drop trigger if exists journal_limit on public.journal;
create trigger journal_limit before insert on public.journal for each row execute function public.journal_limit();

create or replace function public.journal_trim() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from public.journal
   where user_id = new.user_id
     and id not in (select id from public.journal where user_id = new.user_id order by id desc limit 300);
  return null;
end $$;
drop trigger if exists journal_trim on public.journal;
create trigger journal_trim after insert on public.journal for each row execute function public.journal_trim();

alter table public.journal enable row level security;
drop policy if exists "proprietaire_lit" on public.journal;
drop policy if exists "proprietaire_ecrit" on public.journal;
create policy "proprietaire_lit"   on public.journal for select to authenticated using (user_id = (select auth.uid()));
create policy "proprietaire_ecrit" on public.journal for insert to authenticated with check (user_id = (select auth.uid()));
revoke all on public.journal from anon;
revoke all on public.journal from authenticated;
grant select, insert on public.journal to authenticated;

-- Contrôle : toutes les tables doivent afficher rowsecurity = true
select tablename, rowsecurity from pg_tables where schemaname = 'public' order by tablename;

notify pgrst, 'reload schema';
