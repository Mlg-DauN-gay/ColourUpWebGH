-- Colour Up — fix: 0006/0007 tightened the `games` SELECT policy to host +
-- already-seated players only (closing the table-enumeration leak), but
-- game_players' own INSERT policy — the actual "take a seat" operation —
-- checks the game is still open via a raw correlated subquery straight
-- into `games`:
--
--   with check (
--     auth.uid() = user_id
--     and exists (select 1 from public.games g where g.id = game_players.game_id and g.phase = 'lobby')
--   )
--
-- That subquery is itself subject to the (now-tightened) games SELECT
-- policy. A first-time joiner is, by definition, not yet seated and not
-- the host — the one case that policy no longer covers — so the row is
-- invisible to their own join attempt and the whole insert was rejected
-- with 42501. Every real guest join has been broken since 0007 landed.
-- This is exactly the bootstrapping problem the SECURITY DEFINER helper
-- functions elsewhere in this migration history exist to solve; missed
-- this one instance when writing 0006/0007 since the regression only
-- shows up on an *insert*, not the select-side testing that fix was
-- verified with at the time.
--
-- Run once in the Supabase Dashboard: SQL Editor -> New query -> paste ->
-- Run. Safe to re-run.

create or replace function public.game_is_open(p_game_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.games g where g.id = p_game_id and g.phase = 'lobby');
$$;

revoke all on function public.game_is_open(uuid) from public;
grant execute on function public.game_is_open(uuid) to authenticated;

drop policy if exists "users join a game's lobby for themselves" on public.game_players;
create policy "users join a game's lobby for themselves"
  on public.game_players for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and public.game_is_open(game_players.game_id)
  );
