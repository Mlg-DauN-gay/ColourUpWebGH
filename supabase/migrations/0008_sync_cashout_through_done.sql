-- Colour Up — Milestone 2 slice 2 (part 2) + Milestone 3: sync
-- Cashout -> Reconcile -> Settle -> Done, with real count privacy and a
-- real host-only recount lock. Same architecture gap Fund had before
-- 0005: these phases ran on 100% local, per-device state, so — same
-- deadlock shape — a submitted count, a sign-off, or a finished game on
-- one phone was invisible to every other phone.
--
-- The integrity-critical part (per the original spec, "treat it as
-- security-critical"): a player's chip count must be readable by them
-- always, but by no one else until every seat has actually locked a
-- count and the phase moves to settle/done — otherwise "private counts"
-- is decorative and someone could adjust their own count after peeking
-- at everyone else's. That's why the count lives in its own table with
-- its own RLS, not just a column on game_players.
--
-- Run once in the Supabase Dashboard: SQL Editor -> New query -> paste ->
-- Run. Safe to re-run.

-- ─────────────────────────── game_players: the missing flags ───────────────────────────
-- The original spec's schema for this table always included these three;
-- only `agreed` actually got built in 0002. `out`/`submitted`/`approved`
-- are plain self-reported booleans (not the chip count itself, which is
-- what actually needs to stay private) — a player toggling their own
-- "I'm out" / "I've counted" / "I approve the receipt" flag isn't a
-- integrity risk the way seeing someone else's stack size would be, so
-- these don't need the same lockdown player_counts gets below.
alter table public.game_players
  add column if not exists out boolean not null default false,
  add column if not exists submitted boolean not null default false,
  add column if not exists approved boolean not null default false;

drop policy if exists "players edit only their own seat while in lobby" on public.game_players;
create policy "players edit only their own seat"
  on public.game_players for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─────────────────────────── player_counts ───────────────────────────
create table if not exists public.player_counts (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  game_player_id uuid not null references public.game_players (id) on delete cascade,
  chips numeric not null check (chips >= 0),
  created_at timestamptz not null default now(),
  unique (game_id, game_player_id)
);

create index if not exists player_counts_game_id_idx on public.player_counts (game_id);

alter table public.player_counts enable row level security;

-- The actual count-privacy rule: your own count, always; anyone else's,
-- only once the table has moved to settle/done. Routed through
-- is_seated_in_game() (existing SECURITY DEFINER helper) for the
-- "am I a participant at all" half of the check, same reason as
-- everywhere else it's used — a raw correlated subquery into
-- game_players/games here would hit the same cross-table recursion
-- already fixed twice elsewhere in this migration history.
drop policy if exists "own count always, others once settled" on public.player_counts;
create policy "own count always, others once settled"
  on public.player_counts for select
  to authenticated
  using (
    exists (select 1 from public.game_players gp where gp.id = player_counts.game_player_id and gp.user_id = auth.uid())
    or (
      exists (select 1 from public.games g where g.id = player_counts.game_id and g.phase in ('settle', 'done'))
      and (
        exists (select 1 from public.games g2 where g2.id = player_counts.game_id and g2.host_id = auth.uid())
        or public.is_seated_in_game(player_counts.game_id)
      )
    )
  );

-- Insert-only from the player's own side (locking a count is one-shot —
-- see the recount RPC below for the only way to undo it). No update
-- policy at all: this is what makes "no one, including the host, can
-- edit a single player's number to force a balance" a real DB-level
-- guarantee, not just a UI convention.
drop policy if exists "players lock only their own count" on public.player_counts;
create policy "players lock only their own count"
  on public.player_counts for insert
  to authenticated
  with check (
    exists (
      select 1 from public.game_players gp
      where gp.id = player_counts.game_player_id
        and gp.user_id = auth.uid()
        and gp.game_id = player_counts.game_id
    )
    and exists (select 1 from public.games g where g.id = player_counts.game_id and g.phase = 'cashout')
  );

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'player_counts'
  ) then
    alter publication supabase_realtime add table public.player_counts;
  end if;
end $$;

-- ─────────────────────────── reconcile_totals() ───────────────────────────
-- The "reconciliation without revealing" piece: lets any participant
-- check counted-vs-issued totals during cashout/reconcile without ever
-- exposing a single per-player figure — this is the whole point of
-- player_counts having no broad SELECT policy pre-settle.
create or replace function public.reconcile_totals(p_game_id uuid)
returns table (counted numeric, issued numeric)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not (
    exists (select 1 from public.games g where g.id = p_game_id and g.host_id = auth.uid())
    or public.is_seated_in_game(p_game_id)
  ) then
    raise exception 'Not a participant in this game';
  end if;
  return query
    select
      coalesce((select sum(pc.chips) from public.player_counts pc where pc.game_id = p_game_id), 0)::numeric as counted,
      coalesce((select sum(e.chips) from public.entries e where e.game_id = p_game_id), 0)::numeric as issued;
end;
$$;

revoke all on function public.reconcile_totals(uuid) from public;
grant execute on function public.reconcile_totals(uuid) to authenticated;

-- ─────────────────────────── recount_lock() ───────────────────────────
-- Host-only, and deliberately all-or-nothing: resets every seat's
-- `submitted` flag, deletes every locked count, and moves the game back
-- to `cashout` so every device's screen actually returns to counting
-- (not just the host's — the phase change is what every other client's
-- Realtime-watching effect uses to follow along, same pattern as every
-- other transition). There's no path here (or anywhere else) for editing
-- one player's number — that's the actual anti-cheat guarantee, not just
-- the UI not offering a button for it. Only callable from `reconcile`, so
-- it can't be used to interrupt an in-progress count.
create or replace function public.recount_lock(p_game_id uuid)
returns public.games
language plpgsql
security definer
set search_path = public
as $$
declare
  g public.games;
begin
  select * into g from public.games where id = p_game_id;
  if g.id is null then
    raise exception 'Game not found';
  end if;
  if g.host_id <> auth.uid() then
    raise exception 'Only the host can trigger a recount';
  end if;
  if g.phase <> 'reconcile' then
    raise exception 'Can only recount from the reconcile step';
  end if;
  update public.game_players set submitted = false where game_id = p_game_id;
  delete from public.player_counts where game_id = p_game_id;
  update public.games set phase = 'cashout' where id = p_game_id;
  select * into g from public.games where id = p_game_id;
  return g;
end;
$$;

revoke all on function public.recount_lock(uuid) from public;
grant execute on function public.recount_lock(uuid) to authenticated;

-- ─────────────────────────── advance_phase(): the rest of the lifecycle ───────────────────────────
-- Adds live->cashout, cashout->reconcile, reconcile->settle, settle->done
-- to the fund->live transition 0005 already added. Same shape throughout:
-- host-only, each guarded on the real DB state that phase's screen
-- actually requires before its own "next" button would be enabled.
create or replace function public.advance_phase(p_game_id uuid, p_new_phase text)
returns public.games
language plpgsql
security invoker
as $$
declare
  g public.games;
  seated_count int;
  unagreed_count int;
  unfunded_count int;
  unsubmitted_count int;
  unapproved_count int;
  totals record;
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

  elsif g.phase = 'fund' and p_new_phase = 'live' then
    select count(*) into unfunded_count
    from public.game_players gp
    where gp.game_id = p_game_id
      and not exists (select 1 from public.entries e where e.game_player_id = gp.id);
    if unfunded_count > 0 then
      raise exception 'All seated players must buy in first';
    end if;

  elsif g.phase = 'live' and p_new_phase = 'cashout' then
    null; -- host calling last hand needs no further precondition

  elsif g.phase = 'cashout' and p_new_phase = 'reconcile' then
    select count(*) into unsubmitted_count from public.game_players where game_id = p_game_id and submitted = false;
    if unsubmitted_count > 0 then
      raise exception 'All seated players must lock in their count first';
    end if;

  elsif g.phase = 'reconcile' and p_new_phase = 'settle' then
    select * into totals from public.reconcile_totals(p_game_id);
    if totals.counted <> totals.issued then
      raise exception 'Counted chips do not match issued chips yet';
    end if;

  elsif g.phase = 'settle' and p_new_phase = 'done' then
    select count(*) into unapproved_count from public.game_players where game_id = p_game_id and approved = false;
    if unapproved_count > 0 then
      raise exception 'All seated players must sign off first';
    end if;

  else
    raise exception 'Unsupported phase transition: % -> %', g.phase, p_new_phase;
  end if;

  update public.games set phase = p_new_phase where id = p_game_id;
  select * into g from public.games where id = p_game_id;
  return g;
end;
$$;
