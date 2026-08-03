-- Colour Up — Milestone 2, slice 2 (part 1): sync the Fund phase for real.
--
-- Root cause of the "guest bugs out" report: Fund ran entirely on each
-- device's own local React state, seeded once from the lobby hand-off and
-- never touched again. A buy-in recorded on one phone was invisible to
-- every other phone — the game could get stuck forever showing "waiting on
-- a buy-in" that had, in fact, already happened. `entries` already existed
-- with correct RLS (0002), it just wasn't in the realtime publication yet,
-- and advance_phase() didn't know how to move fund -> live. This migration
-- closes both gaps. Run once in the Supabase Dashboard: SQL Editor -> New
-- query -> paste -> Run. Safe to re-run.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'entries'
  ) then
    alter publication supabase_realtime add table public.entries;
  end if;
end $$;

-- Extends the existing lobby->fund transition (unchanged) with fund->live:
-- every seated player must have at least one entries row (their initial
-- buy-in) before the table can go live. Same SECURITY INVOKER shape as
-- before — this is a friendly-error wrapper around the real boundary,
-- which is still the "hosts advance their own game phase" RLS policy on
-- games.
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
  else
    raise exception 'Unsupported phase transition: % -> %', g.phase, p_new_phase;
  end if;

  update public.games set phase = p_new_phase where id = p_game_id;
  select * into g from public.games where id = p_game_id;
  return g;
end;
$$;
