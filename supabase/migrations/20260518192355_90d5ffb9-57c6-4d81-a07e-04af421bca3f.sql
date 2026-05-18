-- Brand identity (Step 1 of Brand DNA wizard)
create table public.brand_identity (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  business_location text,
  brand_goal text,
  target_audience text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id)
);

alter table public.brand_identity enable row level security;

create policy "brand_identity_select_member" on public.brand_identity
  for select to authenticated using (
    exists (select 1 from public.company_members m where m.company_id = brand_identity.company_id and m.user_id = auth.uid())
  );

create policy "brand_identity_insert_member" on public.brand_identity
  for insert to authenticated with check (
    exists (select 1 from public.company_members m where m.company_id = brand_identity.company_id and m.user_id = auth.uid())
  );

create policy "brand_identity_update_member" on public.brand_identity
  for update to authenticated using (
    exists (select 1 from public.company_members m where m.company_id = brand_identity.company_id and m.user_id = auth.uid())
  );

-- Connected sources: one row per platform per company
create type public.connection_status as enum ('not_connected','connecting','connected','syncing','permission_expired','api_error');
create type public.platform_kind as enum ('website','google_analytics','google_search_console','facebook','instagram','tiktok','linkedin','youtube','google_business','twitter');

create table public.connected_sources (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  platform public.platform_kind not null,
  status public.connection_status not null default 'not_connected',
  external_account_id text,
  external_account_label text,
  scopes text[],
  metadata jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, platform)
);

create index idx_connected_sources_company on public.connected_sources(company_id);

alter table public.connected_sources enable row level security;

create policy "connected_sources_select_member" on public.connected_sources
  for select to authenticated using (
    exists (select 1 from public.company_members m where m.company_id = connected_sources.company_id and m.user_id = auth.uid())
  );

create policy "connected_sources_modify_member" on public.connected_sources
  for all to authenticated using (
    exists (select 1 from public.company_members m where m.company_id = connected_sources.company_id and m.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.company_members m where m.company_id = connected_sources.company_id and m.user_id = auth.uid())
  );

-- Sync logs
create table public.sync_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  source_id uuid references public.connected_sources(id) on delete cascade,
  platform public.platform_kind not null,
  status text not null,
  message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  duration_ms integer
);

create index idx_sync_logs_company on public.sync_logs(company_id, started_at desc);

alter table public.sync_logs enable row level security;

create policy "sync_logs_select_member" on public.sync_logs
  for select to authenticated using (
    exists (select 1 from public.company_members m where m.company_id = sync_logs.company_id and m.user_id = auth.uid())
  );

-- API errors
create table public.api_errors (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  platform public.platform_kind,
  endpoint text,
  status_code integer,
  error_message text,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index idx_api_errors_company on public.api_errors(company_id, created_at desc);

alter table public.api_errors enable row level security;

create policy "api_errors_select_member" on public.api_errors
  for select to authenticated using (
    company_id is null or exists (select 1 from public.company_members m where m.company_id = api_errors.company_id and m.user_id = auth.uid())
  );

-- Helper: updated_at trigger
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end; $$;

create trigger tg_brand_identity_updated before update on public.brand_identity
  for each row execute function public.tg_set_updated_at();
create trigger tg_connected_sources_updated before update on public.connected_sources
  for each row execute function public.tg_set_updated_at();

-- Seed: every existing company gets a 'website' connected_sources row in 'not_connected'
insert into public.connected_sources (company_id, platform, status)
select c.id, 'website'::public.platform_kind, 'not_connected'::public.connection_status
from public.companies c
on conflict do nothing;