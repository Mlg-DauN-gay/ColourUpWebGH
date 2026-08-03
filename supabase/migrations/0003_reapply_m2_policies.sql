-- Colour Up — fix: 0002_multiplayer.sql's RLS policies only partially took
-- effect on the live project (confirmed: a real host can insert their own
-- game_players row fine, but the identical insert as an anonymous guest —
-- the actual join-a-table path — is rejected with 42501, even though the
-- policy meant to allow it is present in 0002's source). Tables, indexes,
-- the advance_phase() function, and the realtime publication all came
-- through fine (those statements are idempotent); only the non-idempotent
-- `create policy` statements are suspect, likely from a partial/aborted run.
--
-- This file re-applies every RLS policy from 0002 verbatim, each preceded
-- by `drop policy if exists`, so running it is safe no matter which ones
-- already exist correctly. Run once in the Supabase Dashboard: SQL Editor ->
-- New query -> paste -> Run. Safe to re-run again later too.

-- ─────────────────────────── games ───────────────────────────
drop policy if exists "games are readable by any signed-in user" on public.games;
create policy "games are readable by any signed-in user"
  on public.games for select
  to authenticated
  using (true);

drop policy if exists "real accounts create their own game" on public.games;
create policy "real accounts create their own game"
  on public.games for insert
  to authenticated
  with check (
    auth.uid() = host_id
    and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  );

drop policy if exists "hosts advance their own game phase" on public.games;
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

-- ─────────────────────────── game_players ───────────────────────────
drop policy if exists "seated players see their game's roster" on public.game_players;
create policy "seated players see their game's roster"
  on public.game_players for select
  to authenticated
  using (
    exists (select 1 from public.games g where g.id = game_players.game_id and g.host_id = auth.uid())
    or exists (
      select 1 from public.game_players gp2
      where gp2.game_id = game_players.game_id and gp2.user_id = auth.uid()
    )
  );

drop policy if exists "users join a game's lobby for themselves" on public.game_players;
create policy "users join a game's lobby for themselves"
  on public.game_players for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.games g where g.id = game_players.game_id and g.phase = 'lobby')
  );

drop policy if exists "players edit only their own seat while in lobby" on public.game_players;
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

-- ─────────────────────────── entries ───────────────────────────
drop policy if exists "seated players see their game's entries" on public.entries;
create policy "seated players see their game's entries"
  on public.entries for select
  to authenticated
  using (
    exists (select 1 from public.games g where g.id = entries.game_id and g.host_id = auth.uid())
    or exists (select 1 from public.game_players gp where gp.game_id = entries.game_id and gp.user_id = auth.uid())
  );

drop policy if exists "players record only their own buy-ins" on public.entries;
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
drop policy if exists "seated players see their game's ledger" on public.ledger;
create policy "seated players see their game's ledger"
  on public.ledger for select
  to authenticated
  using (
    exists (select 1 from public.games g where g.id = ledger.game_id and g.host_id = auth.uid())
    or exists (select 1 from public.game_players gp where gp.game_id = ledger.game_id and gp.user_id = auth.uid())
  );

drop policy if exists "seated players append their own ledger lines" on public.ledger;
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
