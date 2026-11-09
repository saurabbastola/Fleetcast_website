-- Fleetcast user profiles.
-- Run this once in Supabase → SQL Editor → New query (after schema.sql). Safe to re-run.
--
-- Supabase already stores every account in auth.users. This adds a readable
-- public.profiles row for each one, filled in automatically on sign-up
-- (email/password or Google), so you can browse users in the Table Editor.

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  email       text,
  full_name   text,
  avatar_url  text,
  provider    text,            -- 'email' or 'google'
  portal      text             -- which portal they signed up from (ads, fleet, developer)
);

-- Create the profile whenever a new auth user appears.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, provider, portal)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url',
    coalesce(new.raw_app_meta_data ->> 'provider', 'email'),
    new.raw_user_meta_data ->> 'portal'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security: a signed-in user can read and edit only their own profile.
alter table public.profiles enable row level security;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
