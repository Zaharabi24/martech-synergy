
create table public.website_analysis (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  source_id uuid,
  url text not null,
  status text not null default 'pending',
  title text,
  description text,
  summary text,
  markdown text,
  links jsonb default '[]'::jsonb,
  branding jsonb default '{}'::jsonb,
  metadata jsonb default '{}'::jsonb,
  screenshot_url text,
  error text,
  analyzed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index website_analysis_company_idx on public.website_analysis(company_id, created_at desc);

alter table public.website_analysis enable row level security;

create policy "website_analysis_select_member" on public.website_analysis
  for select to authenticated
  using (exists (select 1 from public.company_members m where m.company_id = website_analysis.company_id and m.user_id = auth.uid()));

create policy "website_analysis_modify_member" on public.website_analysis
  for all to authenticated
  using (exists (select 1 from public.company_members m where m.company_id = website_analysis.company_id and m.user_id = auth.uid()))
  with check (exists (select 1 from public.company_members m where m.company_id = website_analysis.company_id and m.user_id = auth.uid()));

create trigger website_analysis_set_updated_at
before update on public.website_analysis
for each row execute function public.tg_set_updated_at();
