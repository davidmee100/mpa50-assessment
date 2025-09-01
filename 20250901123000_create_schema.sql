-- Enable useful extensions
create extension if not exists "uuid-ossp";

-- *********************************************
--  Table definitions
-- *********************************************

-- campaigns table
create table if not exists public.campaigns (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz not null default now(),
  created_by uuid references public.admin_users(user_id)
);

-- questions table
create table if not exists public.questions (
  id serial primary key,
  text text not null,
  trait text not null,
  reverse boolean not null default false,
  ko_threshold integer,
  interview_question text
);

-- invites table
create table if not exists public.invites (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references public.campaigns(id) on delete cascade,
  email text not null,
  token text not null,
  sent_at timestamptz default now(),
  opened_at timestamptz,
  completed_at timestamptz,
  status text not null default 'sent',
  resend_count integer not null default 0,
  partial_responses jsonb,
  unique(campaign_id, lower(email))
);
create index if not exists invites_token_idx on public.invites(token);

-- candidates table
create table if not exists public.candidates (
  id uuid primary key default uuid_generate_v4(),
  invite_id uuid references public.invites(id),
  campaign_id uuid references public.campaigns(id),
  name text not null,
  email text not null,
  experience integer,
  responses jsonb,
  trait_scores jsonb,
  trait_risk_percent jsonb,
  overall_score numeric,
  overall_risk text,
  ko_triggered boolean not null default false,
  ko_items jsonb,
  completed_at timestamptz default now()
);

-- admin_users table
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text,
  role text not null default 'recruiter'
);

-- optional normalized responses table (not required for MVP)
create table if not exists public.responses (
  id serial primary key,
  candidate_id uuid references public.candidates(id) on delete cascade,
  question_id integer references public.questions(id),
  value integer not null,
  normalized_value integer not null,
  created_at timestamptz default now()
);

-- *********************************************
--  Row‑level security configuration
-- *********************************************

-- Enable row‑level security on all tables
alter table public.campaigns enable row level security;
alter table public.invites enable row level security;
alter table public.candidates enable row level security;
alter table public.admin_users enable row level security;
alter table public.responses enable row level security;

-- Campaigns policies
create policy if not exists "Public select campaigns" on public.campaigns
  for select using (true);

create policy if not exists "Owner modify campaigns" on public.campaigns
  for all using (
    auth.role() = 'authenticated' and
    exists (
      select 1 from public.admin_users au
      where au.user_id = auth.uid() and au.role = 'owner'
    )
  );

-- Invites policies
create policy if not exists "Admins select invites" on public.invites
  for select using (
    auth.role() = 'authenticated' and
    exists (
      select 1 from public.admin_users au
      where au.user_id = auth.uid() and au.role in ('owner', 'recruiter')
    )
  );

create policy if not exists "Admins modify invites" on public.invites
  for all using (
    auth.role() = 'authenticated' and
    exists (
      select 1 from public.admin_users au
      where au.user_id = auth.uid() and au.role in ('owner', 'recruiter')
    )
  );

-- Candidates policies
create policy if not exists "Admins select candidates" on public.candidates
  for select using (
    auth.role() = 'authenticated' and
    exists (
      select 1 from public.admin_users au
      where au.user_id = auth.uid() and au.role in ('owner', 'recruiter')
    )
  );

create policy if not exists "Admins modify candidates" on public.candidates
  for all using (
    auth.role() = 'authenticated' and
    exists (
      select 1 from public.admin_users au
      where au.user_id = auth.uid() and au.role in ('owner', 'recruiter')
    )
  );

-- Admin users policies
create policy if not exists "Owner select admin users" on public.admin_users
  for select using (
    auth.role() = 'authenticated' and
    exists (
      select 1 from public.admin_users au
      where au.user_id = auth.uid() and au.role = 'owner'
    )
  );

create policy if not exists "Owner modify admin users" on public.admin_users
  for all using (
    auth.role() = 'authenticated' and
    exists (
      select 1 from public.admin_users au
      where au.user_id = auth.uid() and au.role = 'owner'
    )
  );

-- Responses policies
create policy if not exists "Admins select responses" on public.responses
  for select using (
    auth.role() = 'authenticated' and
    exists (
      select 1 from public.admin_users au where au.user_id = auth.uid() and au.role in ('owner','recruiter')
    )
  );

create policy if not exists "Admins modify responses" on public.responses
  for all using (
    auth.role() = 'authenticated' and
    exists (
      select 1 from public.admin_users au where au.user_id = auth.uid() and au.role in ('owner','recruiter')
    )
  );