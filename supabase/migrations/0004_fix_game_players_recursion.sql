-- Colour Up — fix: "seated players see their game's roster" (on
-- public.game_players) checks whether the caller already has a seat by
-- querying game_players from inside its own SELECT policy. Postgres
-- detects that as infinite recursion (42P17) and refuses the query
-- outright — this broke every join (an INSERT's RETURNING clause has to
-- satisfy the SELECT policy on the new row) and would have broken guests
-- viewing the lobby roster too.
--
-- Standard fix: move the self-referencing check into a SECURITY DEFINER
-- helper function. Running it as the function owner (bypassing RLS
-- internally, just for this one exists-check) breaks the recursive
-- RLS-on-RLS chain while keeping the exact same logical rule: true iff the
-- caller has a seat in that game. Run once in the Supabase Dashboard: SQL
-- Editor -> New query -> paste -> Run. Safe to re-run.

create or replace function public.is_seated_in_game(p_game_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.game_players gp
    where gp.game_id = p_game_id and gp.user_id = auth.uid()
  );
$$;

drop policy if exists "seated players see their game's roster" on public.game_players;
create policy "seated players see their game's roster"
  on public.game_players for select
  to authenticated
  using (
    exists (select 1 from public.games g where g.id = game_players.game_id and g.host_id = auth.uid())
    or public.is_seated_in_game(game_players.game_id)
  );
