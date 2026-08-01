-- Colour Up — Milestone 1: accounts (profiles, friends, personal history)
-- Run this once in the Supabase Dashboard: SQL Editor -> New query -> paste -> Run.

create extension if not exists pgcrypto;

-- ─────────────────────────── profiles ───────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  handle text not null unique check (char_length(handle) >= 2 and handle like '@%'),
  display_name text not null check (char_length(display_name) >= 1),
  color text not null,
  currency text not null default '£',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Profile fields (handle/name/color/currency) aren't sensitive and other
-- players need to see them (friend search, seat lists in later milestones).
create policy "profiles are readable by any signed-in user"
  on public.profiles for select
  to authenticated
  using (true);

create policy "users insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "users update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "users delete their own profile"
  on public.profiles for delete
  to authenticated
  using (auth.uid() = id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ─────────────────────────── friends ───────────────────────────
-- Denormalized snapshot (handle/name/color at add-time), not a live join —
-- keeps the friends list private and independent of the other person's
-- current profile.
create table if not exists public.friends (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  handle text not null,
  display_name text not null,
  color text not null,
  together_count int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.friends enable row level security;

create policy "users manage only their own friends list"
  on public.friends for all
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- ─────────────────────────── history ───────────────────────────
-- A personal ledger of past tables. Milestone 2 will populate this
-- automatically when a live game finishes, in addition to (or instead of)
-- direct client inserts.
create table if not exists public.history (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  played_at timestamptz not null,
  currency text not null,
  net_amount numeric not null,
  players int not null,
  duration_seconds int not null,
  created_at timestamptz not null default now()
);

alter table public.history enable row level security;

create policy "users manage only their own history"
  on public.history for all
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);
