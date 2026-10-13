-- Carnet de dépenses 2.4 : durcissement de la base (à exécuter une fois dans SQL Editor)
-- Sans danger pour tes données : aucune ligne n'est modifiée ni supprimée.
-- Peut être relancé sans erreur : chaque règle est d'abord retirée si elle existe déjà.

-- 1. Les visiteurs non connectés (rôle anon) n'ont aucun droit sur les tables.
--    La sécurité par ligne (RLS) protégeait déjà ; ceci ajoute une seconde barrière.
revoke all on all tables    in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke all on all functions in schema public from anon;
alter default privileges in schema public revoke all on tables    from anon;
alter default privileges in schema public revoke all on functions from anon;

-- 2. Limites de taille et de valeur côté serveur (empêche les données aberrantes ou volumineuses)
alter table public.expenses drop constraint if exists expenses_borne;
alter table public.expenses add constraint expenses_borne check (amount < 1000000000 and fee < 100000000 and date between '2000-01-01' and '2100-12-31') not valid;
alter table public.incomes drop constraint if exists incomes_borne;
alter table public.incomes add constraint incomes_borne check (amount < 1000000000 and date between '2000-01-01' and '2100-12-31') not valid;
alter table public.moves drop constraint if exists moves_borne;
alter table public.moves add constraint moves_borne check (amount < 1000000000 and fee < 100000000 and date between '2000-01-01' and '2100-12-31') not valid;
alter table public.plans drop constraint if exists plans_borne;
alter table public.plans add constraint plans_borne check (amount < 1000000000 and pg_column_size(data) < 8192) not valid;
alter table public.settings drop constraint if exists settings_borne;
alter table public.settings add constraint settings_borne check (pg_column_size(opening) < 16384) not valid;
alter table public.expenses drop constraint if exists expenses_id_len;
alter table public.expenses add constraint expenses_id_len check (char_length(id) <= 100) not valid;
alter table public.incomes drop constraint if exists incomes_id_len;
alter table public.incomes add constraint incomes_id_len check (char_length(id) <= 100) not valid;
alter table public.moves drop constraint if exists moves_id_len;
alter table public.moves add constraint moves_id_len check (char_length(id) <= 100) not valid;
alter table public.plans drop constraint if exists plans_id_len;
alter table public.plans add constraint plans_id_len check (char_length(id) <= 100) not valid;
alter table public.recurring drop constraint if exists recurring_id_len;
alter table public.recurring add constraint recurring_id_len check (char_length(id) <= 100) not valid;
-- « not valid » : les règles s'appliquent aux nouvelles écritures, sans relire l'existant.

-- 3. Contrôle : toutes les tables doivent afficher rowsecurity = true
select tablename, rowsecurity from pg_tables where schemaname = 'public' order by tablename;

notify pgrst, 'reload schema';
