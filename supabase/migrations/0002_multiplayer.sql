-- Colour Up — Milestone 2, slice 1: real multiplayer lobby (games, seats,
-- ledger groundwork). Run this once in the Supabase Dashboard: SQL Editor ->
-- New query -> paste -> Run. Requires 0001_init.sql to already be applied.

-- ─────────────────────────── games ───────────────────────────
-- A hosted table. Only exists once the host has a real account and clicks
-- "Open lobby" (app/page.jsx finishOpenLobby()) — the pre-lobby Setup screen
-- is still purely local/unsynced, matching Milestone 1 behavior.
create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (char_length(code) = 6),
  host_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) >= 1),
  currency text not null default '£',
  buy_in numeric not null check (buy_in > 0),
  chips numeric not null check (chips > 0),
  max_rebuys int not null default 3 check (max_rebuys >= 0),
  -- Full lifecycle is listed now even though this slice only ever writes
  -- 'lobby' and 'fund' — later slices extend advance_phase() to cover the
  -- rest without needing another ALTER TABLE.
  phase text not null default 'lobby'
    check (phase in ('lobby','fund','live','cashout','reconcile','settle','done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.games enable row level security;

-- Same openness as profiles: the code is meant to be shared (QR/link), and
-- nothing in this table (title/buy-in/chips) is sensitive once you have it.
-- Crucially this also lets a brand-new anonymous guest look a game up by
-- code before they have any game_players row yet.
create policy "games are readable by any signed-in user"
  on public.games for select
  to authenticated
  using (true);

-- Only a real (non-anonymous) account may host a table — mirrors the
-- existing client-side gate in app/page.jsx's openLobby(), but enforced
-- here so it can't be bypassed by calling the REST API directly with an
-- anonymous session's key.
create policy "real accounts create their own game"
  on public.games for insert
  to authenticated
  with check (
    auth.uid() = host_id
    and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  );

-- Host-only phase control policy is created further below, after
-- game_players exists (its WITH CHECK references that table).

drop trigger if exists games_set_updated_at on public.games;
create trigger games_set_updated_at
  before update on public.games
  for each row execute function public.set_updated_at();

-- ─────────────────────────── game_players ───────────────────────────
-- One row per seated identity (host or guest). seat_name/color are captured
-- at join time as a denormalized snapshot — same rationale as the existing
-- `friends` table comment: an anonymous guest has no profiles row to join
-- against, so the seat's display identity must be self-contained.
create table if not exists public.game_players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  seat_name text not null check (char_length(seat_name) >= 1),
  color text not null,
  is_host boolean not null default false,
  agreed boolean not null default false,
  joined_at timestamptz not null default now(),
  unique (game_id, user_id)
);

create index if not exists game_players_game_id_idx on public.game_players (game_id);
create index if not exists game_players_user_id_idx on public.game_players (user_id);

alter table public.game_players enable row level security;

-- Helper for the co-member-visibility policy below. A game_players SELECT
-- policy can't query game_players directly in a subquery — Postgres treats
-- that as infinite recursion (it would have to re-apply this same policy
-- to evaluate the subquery's rows) and refuses with "infinite recursion
-- detected in policy for relation game_players". Routing the membership
-- check through a SECURITY DEFINER function sidesteps this: the function
-- runs as its owner (bypassrls), so its internal query isn't re-checked
-- against the calling policy.
create or replace function public.is_game_member(p_game_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.game_players
    where game_id = p_game_id and user_id = p_user_id
  );
$$;

-- Co-member visibility: you can see the full roster of any game you're
-- already part of (as host or as a seated guest), never someone else's.
create policy "seated players see their game's roster"
  on public.game_players for select
  to authenticated
  using (
    exists (select 1 from public.games g where g.id = game_players.game_id and g.host_id = auth.uid())
    or public.is_game_member(game_players.game_id, auth.uid())
  );

-- Anyone signed in (including anonymous guests) may seat themselves — but
-- only in a game that is still open (phase = 'lobby'). This is the actual
-- "can't join a table that already started" enforcement; the join page's
-- own phase check is just the friendly UI copy in front of this.
create policy "users join a game's lobby for themselves"
  on public.game_players for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.games g where g.id = game_players.game_id and g.phase = 'lobby')
  );

-- Own-row edits only (agreeing to the stake), and only while still in the
-- lobby — can't "unagree" after funding has started.
create policy "players edit only their own seat while in lobby"
  on public.game_players for update
  to authenticated
  using (
    auth.uid() = user_id
    and exists (select 1 from public.games g where g.id = game_players.game_id and g.phase = 'lobby')
  )
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.games g where g.id = game_players.game_id and g.phase = 'lobby')
  );

-- No delete policy this slice — no leave-lobby / kick-seat feature yet
-- (see HANDOFF.md follow-up notes).

-- Host-only phase control on `games`, created here (not alongside the rest
-- of that table's policies above) because its WITH CHECK references
-- game_players, which didn't exist yet at that point in the file. The
-- clause below is deliberately the SAME lobby->fund guard as
-- advance_phase() enforces procedurally: even a raw PATCH bypassing the
-- RPC cannot skip the >=2-players/all-agreed rule. Future slices extend
-- this same policy (drop+recreate) to guard their own transitions
-- (fund->live, etc.) rather than growing an unrelated clause.
create policy "hosts advance their own game phase"
  on public.games for update
  to authenticated
  using (auth.uid() = host_id)
  with check (
    auth.uid() = host_id
    and (
      phase <> 'fund'
      or (
        (select count(*) from public.game_players gp where gp.game_id = games.id) >= 2
        and not exists (
          select 1 from public.game_players gp2
          where gp2.game_id = games.id and gp2.agreed = false
        )
      )
    )
  );

-- ─────────────────────────── entries ───────────────────────────
-- Schema + RLS groundwork for the follow-up slice's Fund/Live rewrite.
-- Not written to by any client code in this slice (Fund still runs on
-- local `players` state per scope) — shipped now per the "ship correct
-- ownership RLS from day one" directive, so the follow-up slice only has
-- to add calls, not migrations.
create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  game_player_id uuid not null references public.game_players (id) on delete cascade,
  amount numeric not null check (amount > 0),
  chips numeric not null check (chips > 0),
  kind text not null check (kind in ('buy-in','re-buy')),
  created_at timestamptz not null default now()
);

create index if not exists entries_game_id_idx on public.entries (game_id);
create index if not exists entries_game_player_id_idx on public.entries (game_player_id);

alter table public.entries enable row level security;

create policy "seated players see their game's entries"
  on public.entries for select
  to authenticated
  using (
    exists (select 1 from public.games g where g.id = entries.game_id and g.host_id = auth.uid())
    or exists (select 1 from public.game_players gp where gp.game_id = entries.game_id and gp.user_id = auth.uid())
  );

-- Append-only ledger: no update/delete policy, matching the existing
-- client-side `entries` array semantics (recordEntry only ever pushes).
-- NOTE for the follow-up slice: once this is actually wired to recordEntry,
-- add `and coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false`
-- to this WITH CHECK to make "guests must upgrade before funding" a real
-- DB-level rule instead of only a client-side gate.
create policy "players record only their own buy-ins"
  on public.entries for insert
  to authenticated
  with check (
    exists (
      select 1 from public.game_players gp
      join public.games g on g.id = gp.game_id
      where gp.id = entries.game_player_id
        and gp.user_id = auth.uid()
        and g.id = entries.game_id
        and g.phase in ('fund','live')
    )
  );

-- ─────────────────────────── ledger ───────────────────────────
-- Schema groundwork mirroring the local `log` state (mkLog in
-- app/page.jsx). Not wired to any client code in this slice — Lobby-phase
-- events stay in local `log` for now too (single-device-visible only, a
-- known, explicit gap). actor_id is nullable/on delete set null so
-- historic lines survive an account deletion.
create table if not exists public.ledger (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  text text not null check (char_length(text) >= 1),
  created_at timestamptz not null default now()
);

create index if not exists ledger_game_id_idx on public.ledger (game_id);

alter table public.ledger enable row level security;

create policy "seated players see their game's ledger"
  on public.ledger for select
  to authenticated
  using (
    exists (select 1 from public.games g where g.id = ledger.game_id and g.host_id = auth.uid())
    or exists (select 1 from public.game_players gp where gp.game_id = ledger.game_id and gp.user_id = auth.uid())
  );

create policy "seated players append their own ledger lines"
  on public.ledger for insert
  to authenticated
  with check (
    auth.uid() = actor_id
    and (
      exists (select 1 from public.games g where g.id = ledger.game_id and g.host_id = auth.uid())
      or exists (select 1 from public.game_players gp where gp.game_id = ledger.game_id and gp.user_id = auth.uid())
    )
  );

-- ─────────────────────────── advance_phase() ───────────────────────────
-- Host-only, guarded phase transition. SECURITY INVOKER (not DEFINER): it
-- runs with the caller's own privileges, so the games UPDATE RLS above is
-- still the real security boundary — this function exists purely to turn a
-- silent RLS rejection into a specific, friendly error message, and to give
-- future slices one place to add new transitions (fund->live, etc.) via
-- `create or replace function`, with no further ALTER TABLE needed. All
-- table references are schema-qualified (public.x) as the search_path-
-- hijacking mitigation, matching 0001's style of not adding an explicit
-- `set search_path` clause.
create or replace function public.advance_phase(p_game_id uuid, p_new_phase text)
returns public.games
language plpgsql
security invoker
as $$
declare
  g public.games;
  seated_count int;
  unagreed_count int;
begin
  select * into g from public.games where id = p_game_id;
  if g.id is null then
    raise exception 'Game not found';
  end if;
  if g.host_id <> auth.uid() then
    raise exception 'Only the host can advance the game phase';
  end if;

  if g.phase = 'lobby' and p_new_phase = 'fund' then
    select count(*) into seated_count from public.game_players where game_id = p_game_id;
    select count(*) into unagreed_count from public.game_players where game_id = p_game_id and agreed = false;
    if seated_count < 2 then
      raise exception 'Need at least 2 seated players before starting';
    end if;
    if unagreed_count > 0 then
      raise exception 'All seated players must agree to the stake first';
    end if;
  else
    raise exception 'Unsupported phase transition: % -> %', g.phase, p_new_phase;
  end if;

  update public.games set phase = p_new_phase where id = p_game_id;
  select * into g from public.games where id = p_game_id;
  return g;
end;
$$;

-- ─────────────────────────── realtime ───────────────────────────
-- Enable Postgres Changes replication for the two tables this slice syncs
-- live (Lobby screen). entries/ledger stay out of the publication until the
-- follow-up slice actually wires Fund/Live to Realtime. Guarded with an
-- existence check so re-running this migration is a no-op, not an error
-- (plain `alter publication ... add table` has no IF NOT EXISTS on all PG
-- versions Supabase may run).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'games'
  ) then
    alter publication supabase_realtime add table public.games;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'game_players'
  ) then
    alter publication supabase_realtime add table public.game_players;
  end if;
end $$;
