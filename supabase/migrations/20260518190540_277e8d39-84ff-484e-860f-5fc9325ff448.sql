
-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  theme text not null default 'dark',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (auth.uid() = id);

-- companies
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  industry text,
  employee_size text,
  website_url text,
  demo_mode boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.companies enable row level security;

create table public.company_members (
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner',
  created_at timestamptz not null default now(),
  primary key (company_id, user_id)
);
alter table public.company_members enable row level security;

create policy "company_members_select_own" on public.company_members for select to authenticated using (user_id = auth.uid());

create policy "companies_select_member" on public.companies for select to authenticated
  using (exists (select 1 from public.company_members m where m.company_id = id and m.user_id = auth.uid()));
create policy "companies_update_owner" on public.companies for update to authenticated using (owner_id = auth.uid());
create policy "companies_insert_owner" on public.companies for insert to authenticated with check (owner_id = auth.uid());

create index companies_owner_idx on public.companies(owner_id);

-- handle_new_user trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_company_id uuid;
  brand_name text;
begin
  brand_name := coalesce(new.raw_user_meta_data->>'brand_name', split_part(new.email, '@', 1), 'My Brand');

  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );

  insert into public.companies (owner_id, name, industry, employee_size, website_url)
  values (
    new.id,
    brand_name,
    new.raw_user_meta_data->>'industry',
    new.raw_user_meta_data->>'employee_size',
    new.raw_user_meta_data->>'website_url'
  )
  returning id into new_company_id;

  insert into public.company_members (company_id, user_id, role) values (new_company_id, new.id, 'owner');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
