-- Carnet de dépenses : migration 2.0 → 2.1
-- À exécuter une seule fois dans Supabase > SQL Editor > New query > Run.
-- Ne supprime aucune donnée : ajoute des colonnes et deux tables.

-- Besoin ou envie sur chaque dépense (vide = selon la catégorie)
alter table public.expenses add column if not exists nature text check (nature in ('besoin','envie'));

-- Portefeuille qui reçoit une entrée d'argent
alter table public.incomes add column if not exists wallet text not null default 'banque';

-- Soldes de départ, fonds d'urgence et inflation
alter table public.settings add column if not exists opening jsonb not null default '{}'::jsonb;
alter table public.settings add column if not exists opening_date date;
alter table public.settings add column if not exists emergency_months smallint not null default 3 check (emergency_months between 1 and 24);
alter table public.settings add column if not exists inflation numeric not null default 4 check (inflation between -20 and 100);

-- Mouvements d'argent qui ne sont pas des dépenses : transferts, tontines, prêts, dettes, projets
create table if not exists public.moves (
  id           text primary key,
  user_id      uuid not null default auth.uid() references auth.users on delete cascade,
  kind         text not null check (kind in ('transfer','tontine_out','tontine_in','loan_out','loan_back','debt_in','debt_pay','project')),
  amount       integer not null check (amount > 0),
  fee          integer not null default 0 check (fee >= 0),
  date         date not null,
  from_wallet  text,
  to_wallet    text,
  ref_id       text,                                            -- tontine, prêt, dette ou projet concerné
  note         text not null default '' check (char_length(note) <= 120),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists moves_user_date on public.moves (user_id, date desc);

-- Tontines, prêts, dettes et projets d'épargne
create table if not exists public.plans (
  id          text primary key,
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  type        text not null check (type in ('tontine','loan','debt','project')),
  name        text not null check (char_length(name) <= 60),
  amount      integer not null default 0 check (amount >= 0),       -- objectif, montant prêté ou emprunté, cotisation
  data        jsonb not null default '{}'::jsonb,                    -- échéance, fréquence, membres, tour...
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Sécurité : chaque utilisateur ne voit et ne modifie que ses propres lignes
do $$
declare t text;
begin
  foreach t in array array['expenses','incomes','budgets','recurring','settings','moves','plans'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "proprietaire" on public.%I', t);
    execute format(
      'create policy "proprietaire" on public.%I for all to authenticated
         using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
  end loop;
end $$;

-- Recharge le schéma exposé par l'API
notify pgrst, 'reload schema';
