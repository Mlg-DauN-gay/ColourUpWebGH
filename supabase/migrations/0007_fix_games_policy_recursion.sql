-- Colour Up — fix: 0006's new `games` SELECT policy queries game_players
-- directly, but game_players' own SELECT policy queries games right back
-- (`exists (select 1 from public.games g where g.id = game_players.game_id
-- and g.host_id = auth.uid())`) — two tables' RLS policies each querying
-- the other, which Postgres detects as infinite recursion (42P17) the
-- same way a table querying itself does (see
-- 0004_fix_game_players_recursion.sql for that first occurrence).
--
-- Fix: reuse the same SECURITY DEFINER helper from 0004
-- (public.is_seated_in_game) instead of a raw correlated subquery — it
-- already does exactly "does this user have a seat in this game", bypassing
-- RLS internally, which breaks the cross-table cycle. Run once in the
-- Supabase Dashboard: SQL Editor -> New query -> paste -> Run. Safe to
-- re-run.

drop policy if exists "host and seated players read their game" on public.games;
create policy "host and seated players read their game"
  on public.games for select
  to authenticated
  using (
    auth.uid() = host_id
    or public.is_seated_in_game(games.id)
  );
