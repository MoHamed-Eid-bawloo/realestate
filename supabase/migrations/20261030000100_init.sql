-- Nawyati Real Estate OS — initial schema
-- Multi-tenant real estate platform: marketplace, CRM, developer portal, broker exchange.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Profiles & identity
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role text not null default 'customer'
    check (role in ('super_admin','owner','manager','agent','developer','broker','customer')),
  company_id text,
  developer_id text,
  broker_id text,
  employee_id text,
  avatar_color text not null default '#142B45',
  language text not null default 'en' check (language in ('en','ar')),
  theme text not null default 'light' check (theme in ('light','dark')),
  created_at timestamptz not null default now()
);

create index if not exists profiles_company_idx on public.profiles(company_id);
create index if not exists profiles_role_idx on public.profiles(role);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, 'user'), '@', 1)),
    'customer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.current_profile_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_company_id()
returns text language sql stable security definer set search_path = public as $$
  select company_id from public.profiles where id = auth.uid();
$$;

create or replace function public.current_developer_id()
returns text language sql stable security definer set search_path = public as $$
  select developer_id from public.profiles where id = auth.uid();
$$;

create or replace function public.current_broker_id()
returns text language sql stable security definer set search_path = public as $$
  select broker_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'super_admin' from public.profiles where id = auth.uid()), false);
$$;

-- ---------------------------------------------------------------------------
-- Tenant & platform tables
-- ---------------------------------------------------------------------------

create table if not exists public.companies (
  id text primary key,
  name text not null,
  name_ar text not null default '',
  type text not null default 'brokerage',
  license text not null default '',
  verified boolean not null default false,
  status text not null default 'pending',
  subscription_id text,
  branches integer not null default 1,
  rating numeric(3,2) not null default 0,
  employees integer not null default 0,
  created_at timestamptz not null default now(),
  logo_color text not null default '#142B45',
  email text not null default '',
  phone text not null default '',
  city text not null default ''
);

create table if not exists public.developers (
  id text primary key,
  name text not null,
  name_ar text not null default '',
  logo_color text not null default '#142B45',
  verified boolean not null default false,
  founded integer not null default 2000,
  projects integer not null default 0,
  description text not null default '',
  email text not null default '',
  phone text not null default ''
);

create table if not exists public.employees (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  name text not null,
  name_ar text not null default '',
  role text not null default 'agent',
  title text not null default '',
  title_ar text not null default '',
  email text not null default '',
  phone text not null default '',
  team_id text,
  manager_id text,
  avatar_color text not null default '#142B45',
  target numeric(14,2) not null default 0,
  achieved numeric(14,2) not null default 0,
  leads_assigned integer not null default 0,
  deals_won integer not null default 0,
  conversion numeric(5,2) not null default 0,
  status text not null default 'active',
  joined_at timestamptz not null default now(),
  attendance numeric(5,2) not null default 0,
  permissions text[] not null default '{}'
);
create index if not exists employees_company_idx on public.employees(company_id);

create table if not exists public.teams (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  name text not null,
  name_ar text not null default '',
  manager_id text,
  member_ids text[] not null default '{}',
  target numeric(14,2) not null default 0,
  achieved numeric(14,2) not null default 0,
  territory text not null default ''
);
create index if not exists teams_company_idx on public.teams(company_id);

create table if not exists public.projects (
  id text primary key,
  developer_id text not null references public.developers(id) on delete cascade,
  name text not null,
  name_ar text not null default '',
  location text not null default '',
  description text not null default '',
  description_ar text not null default '',
  images text[] not null default '{}',
  amenities text[] not null default '{}',
  phases jsonb not null default '[]'::jsonb,
  price_from numeric(14,2) not null default 0,
  total_units integer not null default 0,
  available_units integer not null default 0,
  reserved_units integer not null default 0,
  sold_units integer not null default 0,
  delivery_date timestamptz,
  status text not null default 'selling',
  featured boolean not null default false
);
create index if not exists projects_developer_idx on public.projects(developer_id);

create table if not exists public.units (
  id text primary key,
  project_id text not null references public.projects(id) on delete cascade,
  developer_id text not null references public.developers(id) on delete cascade,
  building text not null default '',
  floor integer not null default 0,
  unit_number text not null default '',
  area numeric(10,2) not null default 0,
  bedrooms integer not null default 0,
  bathrooms integer not null default 0,
  price numeric(14,2) not null default 0,
  type text not null default 'apartment',
  status text not null default 'available',
  broker_id text,
  delivery_date timestamptz,
  payment_plan jsonb not null default '{}'::jsonb
);
create index if not exists units_project_idx on public.units(project_id);
create index if not exists units_developer_idx on public.units(developer_id);

create table if not exists public.properties (
  id text primary key,
  code text not null unique,
  title text not null,
  title_ar text not null default '',
  type text not null default 'apartment',
  listing_type text not null default 'sale',
  location text not null default '',
  location_ar text not null default '',
  address text not null default '',
  price numeric(14,2) not null default 0,
  area numeric(10,2) not null default 0,
  bedrooms integer not null default 0,
  bathrooms integer not null default 0,
  floor integer not null default 0,
  finishing text not null default 'finished',
  delivery_date timestamptz,
  ready_to_move boolean not null default false,
  developer_id text references public.developers(id) on delete set null,
  project_id text references public.projects(id) on delete set null,
  company_id text not null references public.companies(id) on delete cascade,
  broker_id text,
  owner_name text not null default '',
  status text not null default 'available',
  listing_status text not null default 'draft',
  verified boolean not null default false,
  featured boolean not null default false,
  images text[] not null default '{}',
  description text not null default '',
  description_ar text not null default '',
  amenities text[] not null default '{}',
  payment_plan jsonb not null default '{}'::jsonb,
  lat numeric(9,6) not null default 30,
  lng numeric(9,6) not null default 31,
  views integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists properties_company_idx on public.properties(company_id);
create index if not exists properties_status_idx on public.properties(status);
create index if not exists properties_listing_status_idx on public.properties(listing_status);
create index if not exists properties_project_idx on public.properties(project_id);

create table if not exists public.customers (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  name text not null,
  name_ar text,
  phone text not null default '',
  email text not null default '',
  type text not null default 'buyer',
  budget_min numeric(14,2) not null default 0,
  budget_max numeric(14,2) not null default 0,
  preferred_locations text[] not null default '{}',
  preferred_type text not null default 'apartment',
  bedrooms integer not null default 0,
  assigned_to text,
  created_at timestamptz not null default now(),
  avatar_color text not null default '#334E68',
  notes jsonb not null default '[]'::jsonb,
  last_interaction timestamptz,
  source text not null default 'website',
  timeline jsonb not null default '[]'::jsonb
);
create index if not exists customers_company_idx on public.customers(company_id);

create table if not exists public.leads (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  name text not null,
  name_ar text,
  phone text not null default '',
  email text not null default '',
  source text not null default 'website',
  campaign text,
  location text not null default '',
  budget_min numeric(14,2) not null default 0,
  budget_max numeric(14,2) not null default 0,
  property_type text not null default 'apartment',
  preferred_area text not null default '',
  payment_preference text not null default 'installments',
  assignee_id text,
  status text not null default 'new',
  priority text not null default 'medium',
  score integer not null default 50,
  notes jsonb not null default '[]'::jsonb,
  activities jsonb not null default '[]'::jsonb,
  last_contact timestamptz,
  next_follow_up timestamptz,
  created_at timestamptz not null default now(),
  lost_reason text,
  tags text[] not null default '{}'
);
create index if not exists leads_company_idx on public.leads(company_id);
create index if not exists leads_status_idx on public.leads(status);
create index if not exists leads_assignee_idx on public.leads(assignee_id);

create table if not exists public.deals (
  id text primary key,
  code text not null,
  company_id text not null references public.companies(id) on delete cascade,
  customer_id text,
  customer_name text not null default '',
  property_id text not null references public.properties(id) on delete restrict,
  property_title text not null default '',
  value numeric(14,2) not null default 0,
  stage text not null default 'new',
  pipeline_id text not null default 'primary',
  agent_id text,
  developer_id text,
  broker_id text,
  probability integer not null default 0,
  expected_close timestamptz,
  reservation_status text not null default 'none',
  contract_status text not null default 'none',
  commission_pct numeric(5,2) not null default 2.5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_activity timestamptz,
  lost_reason text,
  cooperation_id text
);
create index if not exists deals_company_idx on public.deals(company_id);
create index if not exists deals_stage_idx on public.deals(stage);

create table if not exists public.transactions (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  deal_id text,
  customer_name text not null default '',
  property_title text not null default '',
  amount numeric(14,2) not null default 0,
  commission numeric(14,2) not null default 0,
  date timestamptz not null default now(),
  status text not null default 'pending',
  type text not null default 'sale',
  invoice_no text not null default '',
  agent_id text
);
create index if not exists transactions_company_idx on public.transactions(company_id);

create table if not exists public.brokers (
  id text primary key,
  name text not null,
  company_id text,
  company_name text not null default 'Independent',
  verified boolean not null default false,
  rating numeric(3,2) not null default 0,
  active_listings integer not null default 0,
  deals_closed integer not null default 0,
  commission_rate numeric(5,2) not null default 2,
  phone text not null default '',
  avatar_color text not null default '#142B45',
  zone text not null default ''
);

create table if not exists public.cooperation_requests (
  id text primary key,
  code text not null,
  requesting_company_id text not null references public.companies(id) on delete cascade,
  owning_company_id text not null references public.companies(id) on delete cascade,
  property_id text not null references public.properties(id) on delete cascade,
  requester_broker_id text,
  owner_broker_id text,
  customer_name_masked text not null default '',
  customer_protected boolean not null default true,
  commission_pct numeric(5,2) not null default 2.5,
  commission_split jsonb not null default '[]'::jsonb,
  status text not null default 'pending',
  terms text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  milestones jsonb not null default '[]'::jsonb,
  activities jsonb not null default '[]'::jsonb,
  notes jsonb not null default '[]'::jsonb,
  dispute text not null default 'none'
);
create index if not exists cooperation_requesting_idx on public.cooperation_requests(requesting_company_id);
create index if not exists cooperation_owning_idx on public.cooperation_requests(owning_company_id);
create index if not exists cooperation_requester_broker_idx on public.cooperation_requests(requester_broker_id);

create table if not exists public.commissions (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  deal_id text,
  beneficiary_id text not null default '',
  beneficiary_name text not null default '',
  role text not null default 'agent',
  amount numeric(14,2) not null default 0,
  pct numeric(5,2) not null default 0,
  status text not null default 'pending',
  due_date timestamptz,
  paid_at timestamptz
);
create index if not exists commissions_company_idx on public.commissions(company_id);
create index if not exists commissions_beneficiary_idx on public.commissions(beneficiary_id);

create table if not exists public.subscription_plans (
  id text primary key,
  name text not null,
  price numeric(12,2) not null default 0,
  user_limit integer not null default 1,
  property_limit integer not null default 10,
  features text[] not null default '{}',
  popular boolean not null default false
);

create table if not exists public.subscriptions (
  company_id text primary key references public.companies(id) on delete cascade,
  plan_id text not null,
  status text not null default 'trial',
  renewal_date timestamptz,
  seats_used integer not null default 0,
  property_count integer not null default 0
);

create table if not exists public.conversations (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  customer_name text not null default '',
  customer_id text,
  channel text not null default 'chat',
  phone text not null default '',
  avatar_color text not null default '#334E68',
  last_message text not null default '',
  last_at timestamptz,
  unread integer not null default 0,
  assignee_id text,
  status text not null default 'open',
  messages jsonb not null default '[]'::jsonb,
  ai_summary text
);
create index if not exists conversations_company_idx on public.conversations(company_id);

create table if not exists public.tasks (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  title text not null,
  type text not null default 'call',
  priority text not null default 'medium',
  status text not null default 'todo',
  due_date timestamptz,
  assignee_id text,
  customer_name text,
  property_title text,
  notes text,
  reminder boolean not null default false
);
create index if not exists tasks_company_idx on public.tasks(company_id);
create index if not exists tasks_assignee_idx on public.tasks(assignee_id);

create table if not exists public.viewings (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  customer_name text not null default '',
  property_title text not null default '',
  agent_id text,
  date timestamptz,
  time text not null default '',
  status text not null default 'scheduled'
);
create index if not exists viewings_company_idx on public.viewings(company_id);

create table if not exists public.tickets (
  id text primary key,
  code text not null,
  company_id text not null references public.companies(id) on delete cascade,
  customer_name text not null default '',
  subject text not null default '',
  category text not null default 'inquiry',
  priority text not null default 'medium',
  status text not null default 'open',
  assigned_to text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  description text not null default '',
  satisfaction integer
);
create index if not exists tickets_company_idx on public.tickets(company_id);

create table if not exists public.workflows (
  id text primary key,
  company_id text not null references public.companies(id) on delete cascade,
  name text not null,
  description text not null default '',
  trigger text not null default '',
  conditions jsonb not null default '[]'::jsonb,
  actions jsonb not null default '[]'::jsonb,
  enabled boolean not null default true,
  runs integer not null default 0,
  last_run timestamptz
);
create index if not exists workflows_company_idx on public.workflows(company_id);

create table if not exists public.notifications (
  id text primary key,
  company_id text references public.companies(id) on delete cascade,
  type text not null default 'system',
  title text not null default '',
  body text not null default '',
  read boolean not null default false,
  created_at timestamptz not null default now(),
  category text not null default 'system',
  href text
);
create index if not exists notifications_company_idx on public.notifications(company_id);
create index if not exists notifications_read_idx on public.notifications(read);

create table if not exists public.saved_searches (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  filters text not null default '',
  created_at timestamptz not null default now(),
  alerts boolean not null default true
);
create index if not exists saved_searches_user_idx on public.saved_searches(user_id);

create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id text not null references public.properties(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, property_id)
);

create table if not exists public.inquiries (
  id text primary key,
  user_id uuid references auth.users(id) on delete set null,
  property_id text not null references public.properties(id) on delete cascade,
  property_title text not null default '',
  name text not null default '',
  phone text not null default '',
  message text not null default '',
  at timestamptz not null default now(),
  status text not null default 'pending'
);
create index if not exists inquiries_user_idx on public.inquiries(user_id);
create index if not exists inquiries_property_idx on public.inquiries(property_id);

create table if not exists public.viewing_appointments (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  property_id text not null references public.properties(id) on delete cascade,
  customer_name text not null default '',
  date text not null default '',
  time text not null default '',
  status text not null default 'requested',
  agent_name text not null default ''
);
create index if not exists viewing_appointments_user_idx on public.viewing_appointments(user_id);

create table if not exists public.buyer_requests (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null default '',
  locations text[] not null default '{}',
  budget numeric(14,2) not null default 0,
  status text not null default 'Active',
  created_at timestamptz not null default now()
);
create index if not exists buyer_requests_user_idx on public.buyer_requests(user_id);

create table if not exists public.crm_settings (
  company_id text primary key references public.companies(id) on delete cascade,
  data jsonb not null default '{}'::jsonb
);

create table if not exists public.platform_settings (
  id integer primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb
);

create table if not exists public.role_permissions (
  id text primary key,
  role text not null,
  description text not null default '',
  members integer not null default 0,
  permissions text[] not null default '{}'
);

create table if not exists public.audit_log (
  id text primary key,
  at timestamptz not null default now(),
  actor text not null default '',
  action text not null default '',
  target text not null default '',
  company_id text
);
create index if not exists audit_log_company_idx on public.audit_log(company_id);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.developers enable row level security;
alter table public.employees enable row level security;
alter table public.teams enable row level security;
alter table public.projects enable row level security;
alter table public.units enable row level security;
alter table public.properties enable row level security;
alter table public.customers enable row level security;
alter table public.leads enable row level security;
alter table public.deals enable row level security;
alter table public.transactions enable row level security;
alter table public.brokers enable row level security;
alter table public.cooperation_requests enable row level security;
alter table public.commissions enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.conversations enable row level security;
alter table public.tasks enable row level security;
alter table public.viewings enable row level security;
alter table public.tickets enable row level security;
alter table public.workflows enable row level security;
alter table public.notifications enable row level security;
alter table public.saved_searches enable row level security;
alter table public.favorites enable row level security;
alter table public.inquiries enable row level security;
alter table public.viewing_appointments enable row level security;
alter table public.buyer_requests enable row level security;
alter table public.crm_settings enable row level security;
alter table public.platform_settings enable row level security;
alter table public.role_permissions enable row level security;
alter table public.audit_log enable row level security;

-- profiles
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or public.is_super_admin());
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update
  using (id = auth.uid() or public.is_super_admin())
  with check (id = auth.uid() or public.is_super_admin());

-- companies
drop policy if exists companies_select on public.companies;
create policy companies_select on public.companies for select
  using (id = public.current_company_id() or public.is_super_admin());
drop policy if exists companies_update on public.companies;
create policy companies_update on public.companies for update
  using ((id = public.current_company_id() and public.current_profile_role() = 'owner') or public.is_super_admin())
  with check ((id = public.current_company_id() and public.current_profile_role() = 'owner') or public.is_super_admin());
drop policy if exists companies_write on public.companies;
create policy companies_write on public.companies for all
  using (public.is_super_admin()) with check (public.is_super_admin());

-- developers (public marketplace profiles)
drop policy if exists developers_public_read on public.developers;
create policy developers_public_read on public.developers for select using (true);
drop policy if exists developers_update on public.developers;
create policy developers_update on public.developers for update
  using (id = public.current_developer_id() or public.is_super_admin())
  with check (id = public.current_developer_id() or public.is_super_admin());
drop policy if exists developers_write on public.developers;
create policy developers_write on public.developers for all
  using (public.is_super_admin()) with check (public.is_super_admin());

-- company-scoped tables: employees, teams, customers, leads, deals, transactions,
-- conversations, tasks, viewings, tickets, workflows, notifications, crm_settings
drop policy if exists employees_company on public.employees;
create policy employees_company on public.employees for all
  using (company_id = public.current_company_id() or public.is_super_admin())
  with check (company_id = public.current_company_id() or public.is_super_admin());

drop policy if exists teams_company on public.teams;
create policy teams_company on public.teams for all
  using (company_id = public.current_company_id() or public.is_super_admin())
  with check (company_id = public.current_company_id() or public.is_super_admin());

drop policy if exists customers_company on public.customers;
create policy customers_company on public.customers for all
  using (company_id = public.current_company_id() or public.is_super_admin())
  with check (company_id = public.current_company_id() or public.is_super_admin());

drop policy if exists leads_company on public.leads;
create policy leads_company on public.leads for all
  using (company_id = public.current_company_id() or public.is_super_admin())
  with check (company_id = public.current_company_id() or public.is_super_admin());

drop policy if exists deals_company on public.deals;
create policy deals_company on public.deals for all
  using (company_id = public.current_company_id() or public.is_super_admin())
  with check (company_id = public.current_company_id() or public.is_super_admin());

drop policy if exists transactions_company on public.transactions;
create policy transactions_company on public.transactions for all
  using (company_id = public.current_company_id() or public.is_super_admin())
  with check (company_id = public.current_company_id() or public.is_super_admin());

drop policy if exists conversations_company on public.conversations;
create policy conversations_company on public.conversations for all
  using (company_id = public.current_company_id() or public.is_super_admin())
  with check (company_id = public.current_company_id() or public.is_super_admin());

drop policy if exists tasks_company on public.tasks;
create policy tasks_company on public.tasks for all
  using (company_id = public.current_company_id() or public.is_super_admin())
  with check (company_id = public.current_company_id() or public.is_super_admin());

drop policy if exists viewings_company on public.viewings;
create policy viewings_company on public.viewings for all
  using (company_id = public.current_company_id() or public.is_super_admin())
  with check (company_id = public.current_company_id() or public.is_super_admin());

drop policy if exists tickets_company on public.tickets;
create policy tickets_company on public.tickets for all
  using (company_id = public.current_company_id() or public.is_super_admin())
  with check (company_id = public.current_company_id() or public.is_super_admin());

drop policy if exists workflows_company on public.workflows;
create policy workflows_company on public.workflows for all
  using (company_id = public.current_company_id() or public.is_super_admin())
  with check (company_id = public.current_company_id() or public.is_super_admin());

drop policy if exists notifications_company on public.notifications;
create policy notifications_company on public.notifications for all
  using (company_id = public.current_company_id() or public.is_super_admin())
  with check (company_id = public.current_company_id() or public.is_super_admin());

drop policy if exists crm_settings_company on public.crm_settings;
create policy crm_settings_company on public.crm_settings for all
  using (company_id = public.current_company_id() or public.is_super_admin())
  with check (company_id = public.current_company_id() or public.is_super_admin());

-- projects & units: public marketing read, owner writes
drop policy if exists projects_public_read on public.projects;
create policy projects_public_read on public.projects for select using (true);
drop policy if exists projects_owner_write on public.projects;
create policy projects_owner_write on public.projects for all
  using (developer_id = public.current_developer_id() or public.is_super_admin())
  with check (developer_id = public.current_developer_id() or public.is_super_admin());

drop policy if exists units_public_read on public.units;
create policy units_public_read on public.units for select using (true);
drop policy if exists units_owner_write on public.units;
create policy units_owner_write on public.units for all
  using (developer_id = public.current_developer_id() or public.is_super_admin())
  with check (developer_id = public.current_developer_id() or public.is_super_admin());

-- properties: public published read, company/developer workspace access
drop policy if exists properties_public_read on public.properties;
create policy properties_public_read on public.properties for select
  using (listing_status = 'published');
drop policy if exists properties_workspace_read on public.properties;
create policy properties_workspace_read on public.properties for select
  using (
    company_id = public.current_company_id()
    or developer_id = public.current_developer_id()
    or public.is_super_admin()
  );
drop policy if exists properties_workspace_write on public.properties;
create policy properties_workspace_write on public.properties for all
  using (
    company_id = public.current_company_id()
    or developer_id = public.current_developer_id()
    or public.is_super_admin()
  )
  with check (
    company_id = public.current_company_id()
    or developer_id = public.current_developer_id()
    or public.is_super_admin()
  );

-- brokers: workspace directory (agency, developer, broker network, admin), broker may edit own profile
drop policy if exists brokers_read on public.brokers;
create policy brokers_read on public.brokers for select
  using (
    public.is_super_admin()
    or public.current_company_id() is not null
    or public.current_developer_id() is not null
    or public.current_broker_id() is not null
  );
drop policy if exists brokers_update_own on public.brokers;
create policy brokers_update_own on public.brokers for update
  using (id = public.current_broker_id() or public.is_super_admin())
  with check (id = public.current_broker_id() or public.is_super_admin());
drop policy if exists brokers_admin_write on public.brokers;
create policy brokers_admin_write on public.brokers for all
  using (public.is_super_admin()) with check (public.is_super_admin());

-- cooperation requests
drop policy if exists cooperation_read on public.cooperation_requests;
create policy cooperation_read on public.cooperation_requests for select
  using (
    requesting_company_id = public.current_company_id()
    or owning_company_id = public.current_company_id()
    or requester_broker_id = public.current_broker_id()
    or owner_broker_id = public.current_broker_id()
    or public.is_super_admin()
  );
drop policy if exists cooperation_insert on public.cooperation_requests;
create policy cooperation_insert on public.cooperation_requests for insert
  with check (
    requesting_company_id = public.current_company_id()
    or requester_broker_id = public.current_broker_id()
    or public.is_super_admin()
  );
drop policy if exists cooperation_update on public.cooperation_requests;
create policy cooperation_update on public.cooperation_requests for update
  using (
    requesting_company_id = public.current_company_id()
    or owning_company_id = public.current_company_id()
    or requester_broker_id = public.current_broker_id()
    or owner_broker_id = public.current_broker_id()
    or public.is_super_admin()
  )
  with check (
    requesting_company_id = public.current_company_id()
    or owning_company_id = public.current_company_id()
    or requester_broker_id = public.current_broker_id()
    or owner_broker_id = public.current_broker_id()
    or public.is_super_admin()
  );
drop policy if exists cooperation_delete on public.cooperation_requests;
create policy cooperation_delete on public.cooperation_requests for delete
  using (public.is_super_admin());

-- commissions
drop policy if exists commissions_read on public.commissions;
create policy commissions_read on public.commissions for select
  using (
    company_id = public.current_company_id()
    or beneficiary_id = public.current_broker_id()
    or public.is_super_admin()
  );
drop policy if exists commissions_company_write on public.commissions;
create policy commissions_company_write on public.commissions for all
  using (company_id = public.current_company_id() or public.is_super_admin())
  with check (company_id = public.current_company_id() or public.is_super_admin());

-- subscriptions
drop policy if exists subscription_plans_read on public.subscription_plans;
create policy subscription_plans_read on public.subscription_plans for select using (true);
drop policy if exists subscription_plans_write on public.subscription_plans;
create policy subscription_plans_write on public.subscription_plans for all
  using (public.is_super_admin()) with check (public.is_super_admin());

drop policy if exists subscriptions_read on public.subscriptions;
create policy subscriptions_read on public.subscriptions for select
  using (company_id = public.current_company_id() or public.is_super_admin());
drop policy if exists subscriptions_write on public.subscriptions;
create policy subscriptions_write on public.subscriptions for all
  using (public.is_super_admin()) with check (public.is_super_admin());

-- customer-owned tables
drop policy if exists saved_searches_owner on public.saved_searches;
create policy saved_searches_owner on public.saved_searches for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists favorites_owner on public.favorites;
create policy favorites_owner on public.favorites for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists inquiries_owner_read on public.inquiries;
create policy inquiries_owner_read on public.inquiries for select
  using (user_id = auth.uid() or public.is_super_admin());
drop policy if exists inquiries_public_insert on public.inquiries;
create policy inquiries_public_insert on public.inquiries for insert
  with check (user_id is null or user_id = auth.uid());

drop policy if exists viewing_appointments_owner on public.viewing_appointments;
create policy viewing_appointments_owner on public.viewing_appointments for select
  using (user_id = auth.uid() or public.is_super_admin());
drop policy if exists viewing_appointments_insert on public.viewing_appointments;
create policy viewing_appointments_insert on public.viewing_appointments for insert
  with check (user_id is null or user_id = auth.uid());
drop policy if exists viewing_appointments_update on public.viewing_appointments;
create policy viewing_appointments_update on public.viewing_appointments for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists buyer_requests_owner on public.buyer_requests;
create policy buyer_requests_owner on public.buyer_requests for select
  using (user_id = auth.uid() or public.is_super_admin());
drop policy if exists buyer_requests_insert on public.buyer_requests;
create policy buyer_requests_insert on public.buyer_requests for insert
  with check (user_id is null or user_id = auth.uid());

-- platform settings & role permissions
drop policy if exists platform_settings_read on public.platform_settings;
create policy platform_settings_read on public.platform_settings for select using (true);
drop policy if exists platform_settings_write on public.platform_settings;
create policy platform_settings_write on public.platform_settings for all
  using (public.is_super_admin()) with check (public.is_super_admin());

drop policy if exists role_permissions_read on public.role_permissions;
create policy role_permissions_read on public.role_permissions for select
  using (auth.uid() is not null);
drop policy if exists role_permissions_write on public.role_permissions;
create policy role_permissions_write on public.role_permissions for all
  using (public.is_super_admin()) with check (public.is_super_admin());

drop policy if exists audit_log_read on public.audit_log;
create policy audit_log_read on public.audit_log for select
  using (public.is_super_admin());
drop policy if exists audit_log_insert on public.audit_log;
create policy audit_log_insert on public.audit_log for insert
  with check (auth.uid() is not null);

-- ---------------------------------------------------------------------------
-- Notifications from public inquiries / viewing requests
-- ---------------------------------------------------------------------------

create or replace function public.notify_public_inquiry()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_company text;
begin
  select company_id into v_company from public.properties where id = new.property_id;
  if v_company is not null then
    insert into public.notifications (id, company_id, type, title, body, category, href)
    values (
      'n' || replace(gen_random_uuid()::text, '-', ''),
      v_company, 'lead', 'New property inquiry',
      new.name || ' inquired about ' || new.property_title,
      'crm', '/crm/leads'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_inquiry_created on public.inquiries;
create trigger on_inquiry_created after insert on public.inquiries
  for each row execute function public.notify_public_inquiry();

create or replace function public.notify_viewing_request()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_company text;
begin
  select company_id into v_company from public.properties where id = new.property_id;
  if v_company is not null then
    insert into public.notifications (id, company_id, type, title, body, category, href)
    values (
      'n' || replace(gen_random_uuid()::text, '-', ''),
      v_company, 'followup', 'New viewing request',
      new.customer_name || ' requested a viewing on ' || new.date || ' at ' || new.time,
      'crm', '/crm/activities?tab=viewings'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_viewing_request_created on public.viewing_appointments;
create trigger on_viewing_request_created after insert on public.viewing_appointments
  for each row execute function public.notify_viewing_request();

-- ---------------------------------------------------------------------------
-- Business RPCs
-- ---------------------------------------------------------------------------

create or replace function public.move_deal(p_deal_id text, p_stage text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  d public.deals%rowtype;
  p public.properties%rowtype;
begin
  select * into d from public.deals where id = p_deal_id;
  if not found then
    return jsonb_build_object('ok', false, 'message', 'Deal not found.');
  end if;
  if not (public.is_super_admin() or d.company_id = public.current_company_id()) then
    return jsonb_build_object('ok', false, 'message', 'You cannot modify this deal.');
  end if;

  if p_stage = 'reservation' then
    select * into p from public.properties where id = d.property_id;
    if not found then
      return jsonb_build_object('ok', false, 'message', 'Linked property not found.');
    end if;
    if p.status not in ('available', 'pending_review') then
      return jsonb_build_object('ok', false, 'message', 'Cannot reserve: ' || p.title || ' is currently ' || p.status || '.');
    end if;
    update public.properties set status = 'reserved', updated_at = now() where id = p.id;
    update public.deals
      set stage = p_stage, reservation_status = 'confirmed', probability = 90,
          updated_at = now(), last_activity = now()
      where id = d.id;
    insert into public.notifications (id, company_id, type, title, body, category, href)
    values (
      'n' || replace(gen_random_uuid()::text, '-', ''), d.company_id,
      'reservation', 'Property reserved',
      p.title || ' was reserved for ' || d.customer_name || '.',
      'properties', '/inventory'
    );
  elsif p_stage = 'won' then
    update public.deals
      set stage = p_stage, probability = 100, contract_status = 'signed',
          updated_at = now(), last_activity = now()
      where id = d.id;
    update public.properties
      set status = case when listing_type = 'rent' then 'rented' else 'sold' end,
          updated_at = now()
      where id = d.property_id;
    insert into public.notifications (id, company_id, type, title, body, category, href)
    values (
      'n' || replace(gen_random_uuid()::text, '-', ''), d.company_id,
      'commission', 'Deal won',
      d.code || ' was marked as won. Commission is now pending.',
      'finance', '/finance'
    );
  else
    update public.deals
      set stage = p_stage, updated_at = now(), last_activity = now()
      where id = d.id;
  end if;

  return jsonb_build_object('ok', true, 'message', 'Deal moved to ' || p_stage || '.');
end;
$$;

create or replace function public.reserve_unit(p_unit_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare u public.units%rowtype;
begin
  select * into u from public.units where id = p_unit_id;
  if not found then return jsonb_build_object('ok', false, 'message', 'Unit not found.'); end if;
  if not (public.is_super_admin() or u.developer_id = public.current_developer_id()) then
    return jsonb_build_object('ok', false, 'message', 'You cannot modify this unit.');
  end if;
  if u.status <> 'available' then
    return jsonb_build_object('ok', false, 'message', 'Unit ' || u.unit_number || ' is already ' || u.status || '.');
  end if;
  update public.units set status = 'reserved' where id = u.id;
  return jsonb_build_object('ok', true, 'message', u.unit_number || ' reserved.');
end;
$$;

create or replace function public.release_unit(p_unit_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare u public.units%rowtype;
begin
  select * into u from public.units where id = p_unit_id;
  if not found then return jsonb_build_object('ok', false, 'message', 'Unit not found.'); end if;
  if not (public.is_super_admin() or u.developer_id = public.current_developer_id()) then
    return jsonb_build_object('ok', false, 'message', 'You cannot modify this unit.');
  end if;
  update public.units set status = 'available' where id = u.id;
  return jsonb_build_object('ok', true, 'message', u.unit_number || ' released.');
end;
$$;
