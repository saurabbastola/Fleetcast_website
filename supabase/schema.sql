-- Fleetcast website tables.
-- Run this once in Supabase → SQL Editor → New query.

create table if not exists public.contact_submissions (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  first_name  text not null,
  last_name   text,
  email       text not null,
  company     text,
  role        text,
  message     text
);

create table if not exists public.playbook_leads (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text,
  email       text not null,
  company     text,
  source      text default 'website'
);

-- Row Level Security: the website (anon/publishable key) may INSERT only.
-- Read the rows from the Supabase dashboard or with the service-role key.
alter table public.contact_submissions enable row level security;
alter table public.playbook_leads      enable row level security;

drop policy if exists "website can insert contact" on public.contact_submissions;
create policy "website can insert contact"
  on public.contact_submissions for insert
  to anon, authenticated
  with check (true);

drop policy if exists "website can insert leads" on public.playbook_leads;
create policy "website can insert leads"
  on public.playbook_leads for insert
  to anon, authenticated
  with check (true);
