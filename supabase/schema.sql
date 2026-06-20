-- ============================================================
--  Organisation Ideen – Datenbank-Schema
--  Im Supabase SQL-Editor deines NEUEN Projekts einfügen
--  und ausführen (einmalig).
-- ============================================================

-- ---------- PROJEKTE (Ideen werden zu Projekten) ----------
create table if not exists public.projects (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  title         text not null,
  description   text default '',
  status        text not null default 'idee',
  priority      text not null default 'mittel',
  progress      int  not null default 0,
  current_state text default '',                 -- "Wo ich gerade stehe"
  tags          text[] default '{}',
  color         text default '#6366f1',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ---------- TO-DOS ----------
create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid references public.projects(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  done        boolean default false,
  due_date    date,
  position    int default 0,
  created_at  timestamptz default now()
);

-- ---------- LOGINS / ZUGANGSDATEN (verschlüsselt) ----------
create table if not exists public.credentials (
  id                uuid primary key default gen_random_uuid(),
  project_id        uuid references public.projects(id) on delete cascade,
  user_id           uuid not null references auth.users(id) on delete cascade,
  service           text not null,                -- z.B. GitHub, Supabase
  label             text default '',
  username          text default '',
  url               text default '',
  secret_ciphertext text default '',              -- AES-GCM (Base64) – nur verschlüsselt!
  secret_iv         text default '',
  notes_ciphertext  text default '',
  notes_iv          text default '',
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ---------- STATUS-JOURNAL ("Stand hochladen") ----------
create table if not exists public.updates (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid references public.projects(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  content     text not null,
  created_at  timestamptz default now()
);

-- ---------- KALENDER / TERMINE ----------
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  project_id  uuid references public.projects(id) on delete set null,
  title       text not null,
  description text default '',
  start_at    timestamptz not null,
  end_at      timestamptz,
  all_day     boolean default false,
  created_at  timestamptz default now()
);

-- ---------- TRESOR-META (Master-Passwort-Prüfung) ----------
create table if not exists public.vault_meta (
  user_id             uuid primary key references auth.users(id) on delete cascade,
  verifier_ciphertext text not null,
  verifier_iv         text not null,
  salt                text not null,
  created_at          timestamptz default now()
);

-- ============================================================
--  ROW LEVEL SECURITY – jeder sieht nur seine eigenen Daten
-- ============================================================
alter table public.projects    enable row level security;
alter table public.tasks       enable row level security;
alter table public.credentials enable row level security;
alter table public.updates     enable row level security;
alter table public.events      enable row level security;
alter table public.vault_meta  enable row level security;

do $$
declare t text;
begin
  foreach t in array array['projects','tasks','credentials','updates','events','vault_meta']
  loop
    execute format('drop policy if exists "own_select" on public.%I;', t);
    execute format('drop policy if exists "own_insert" on public.%I;', t);
    execute format('drop policy if exists "own_update" on public.%I;', t);
    execute format('drop policy if exists "own_delete" on public.%I;', t);

    execute format('create policy "own_select" on public.%I for select using (auth.uid() = user_id);', t);
    execute format('create policy "own_insert" on public.%I for insert with check (auth.uid() = user_id);', t);
    execute format('create policy "own_update" on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id);', t);
    execute format('create policy "own_delete" on public.%I for delete using (auth.uid() = user_id);', t);
  end loop;
end $$;

-- ---------- Indizes ----------
create index if not exists idx_tasks_project       on public.tasks(project_id);
create index if not exists idx_credentials_project  on public.credentials(project_id);
create index if not exists idx_updates_project      on public.updates(project_id);
create index if not exists idx_events_user_start     on public.events(user_id, start_at);
create index if not exists idx_projects_user         on public.projects(user_id);
