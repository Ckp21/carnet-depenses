-- Carnet de dépenses V2 : schéma Supabase
-- À exécuter une seule fois dans Supabase > SQL Editor > New query > Run.
-- Chaque ligne appartient à un utilisateur ; la sécurité au niveau des lignes (RLS)
-- garantit que personne d'autre ne peut la lire ni la modifier.

-- Dépenses
create table if not exists public.expenses (
  id            text primary key,
  user_id       uuid not null default auth.uid() references auth.users on delete cascade,
  amount        integer not null check (amount > 0),
  fee           integer not null default 0 check (fee >= 0),   -- frais Mobile Money
  category      text not null,
  method        text not null,
  date          date not null,
  note          text not null default '' check (char_length(note) <= 120),
  recurring_id  text,                                          -- dépense générée par une récurrente
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists expenses_user_date on public.expenses (user_id, date desc);

-- Entrées d'argent (plusieurs par mois)
create table if not exists public.incomes (
  id          text primary key,
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  amount      integer not null check (amount > 0),
  source      text not null default 'salaire',               -- salaire, prime, mission, autre
  date        date not null,
  note        text not null default '' check (char_length(note) <= 120),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists incomes_user_date on public.incomes (user_id, date desc);

-- Budgets mensuels par catégorie
create table if not exists public.budgets (
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  category    text not null,
  amount      integer not null check (amount >= 0),
  updated_at  timestamptz not null default now(),
  primary key (user_id, category)
);

-- Dépenses récurrentes (loyer, forfait, factures...)
create table if not exists public.recurring (
  id           text primary key,
  user_id      uuid not null default auth.uid() references auth.users on delete cascade,
  label        text not null check (char_length(label) <= 60),
  amount       integer not null check (amount > 0),
  fee          integer not null default 0 check (fee >= 0),
  category     text not null,
  method       text not null,
  day          smallint not null check (day between 1 and 28),
  last_month   text not null,                                -- dernier mois généré, format AAAA-MM
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Réglages (une ligne par utilisateur)
create table if not exists public.settings (
  user_id       uuid primary key default auth.uid() references auth.users on delete cascade,
  savings_goal  integer not null default 0 check (savings_goal >= 0),
  updated_at    timestamptz not null default now()
);

-- Sécurité : chaque utilisateur ne voit et ne modifie que ses propres lignes
do $$
declare t text;
begin
  foreach t in array array['expenses','incomes','budgets','recurring','settings'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "proprietaire" on public.%I', t);
    execute format(
      'create policy "proprietaire" on public.%I for all to authenticated
         using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
  end loop;
end $$;
