-- Colour Up — fix: any signed-in session (including a free, self-created
-- anonymous one — see supabase.auth.signInAnonymously() in JoinClient.jsx)
-- could list every open table in the entire project via a plain
-- `GET /rest/v1/games?select=*`, not just the one they were invited to.
-- `using (true)` on the SELECT policy can't tell "I already know this row's
-- code" from "give me every row" — RLS has no concept of what WHERE clause
-- the caller used, only the row's own content plus auth context.
--
-- Fix: tighten the SELECT policy to host + already-seated participants
-- only (this covers every legitimate case except the very first lookup, by
-- code, before a guest has a seat yet). That one remaining case is served
-- by a SECURITY DEFINER function instead — it still requires knowing the
-- exact 6-character code (no listing, no partial match), it just does the
-- lookup with RLS bypassed internally so it doesn't need the broad SELECT
-- policy to exist. Run once in the Supabase Dashboard: SQL Editor -> New
-- query -> paste -> Run. Safe to re-run.

drop policy if exists "games are readable by any signed-in user" on public.games;
create policy "host and seated players read their game"
  on public.games for select
  to authenticated
  using (
    auth.uid() = host_id
    or exists (select 1 from public.game_players gp where gp.game_id = games.id and gp.user_id = auth.uid())
  );

-- plpgsql (not plain sql) specifically so a no-match returns null instead
-- of erroring — a `returns public.games` sql function raises "query
-- returned no rows" on zero matches, which would surface as a 500 instead
-- of the clean "no table with that code" the client already handles.
create or replace function public.lookup_game_by_code(p_code text)
returns public.games
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  g public.games;
begin
  select * into g from public.games where code = upper(p_code);
  return g; -- null (all fields) when nothing matched
end;
$$;

-- Locks the function down to signed-in callers only (same population the
-- old table policy allowed) — SECURITY DEFINER functions are PUBLIC by
-- default, which would let even the anon key call this with zero session.
revoke all on function public.lookup_game_by_code(text) from public;
grant execute on function public.lookup_game_by_code(text) to authenticated;
