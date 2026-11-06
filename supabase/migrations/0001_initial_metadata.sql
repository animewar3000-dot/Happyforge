-- Happyforge stores metadata here, not repository contents or build artifacts.
-- Apply only after configuring Supabase Auth and reviewing RLS policies.

create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  repository_url text,
  default_branch text not null default 'main',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  opencode_session_id text,
  title text,
  status text not null default 'created'
    check (status in ('created','running','waiting_approval','completed','failed','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.provider_configs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  display_name text not null,
  secret_reference text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_refs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  runtime text not null,
  external_workspace_id text not null,
  status text not null default 'provisioning',
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;
alter table public.agent_sessions enable row level security;
alter table public.provider_configs enable row level security;
alter table public.workspace_refs enable row level security;

create policy "Users manage their own projects"
  on public.projects for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Users manage their own agent sessions"
  on public.agent_sessions for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Users manage their own provider configs"
  on public.provider_configs for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Users manage their own workspace refs"
  on public.workspace_refs for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create index if not exists projects_owner_idx on public.projects(owner_id);
create index if not exists sessions_owner_project_idx on public.agent_sessions(owner_id, project_id);
create index if not exists provider_configs_owner_idx on public.provider_configs(owner_id);
create index if not exists workspace_refs_owner_project_idx on public.workspace_refs(owner_id, project_id);
