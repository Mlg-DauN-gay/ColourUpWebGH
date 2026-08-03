"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "./supabase/client";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const genCode = () => Array.from({ length: 6 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");

const rowToSeat = (row) => ({
  id: row.id,
  userId: row.user_id,
  name: row.seat_name,
  color: row.color,
  host: row.is_host,
  agreed: row.agreed,
  out: row.out,
  submitted: row.submitted,
  approved: row.approved,
});
const rowToEntry = (row) => ({
  id: row.id,
  gamePlayerId: row.game_player_id,
  amount: Number(row.amount),
  chips: Number(row.chips),
  kind: row.kind,
  at: new Date(row.created_at).getTime(),
});
const rowToCount = (row) => ({
  id: row.id,
  gamePlayerId: row.game_player_id,
  chips: Number(row.chips),
});

// Real multiplayer lobby: a `games` row + its `game_players` seats, synced
// live via Supabase Realtime. Only the Lobby phase reads/writes this —
// Fund through Settle/Done still run on local state (app/page.jsx),
// bootstrapped from `seats` the moment the host advances past lobby (see
// handleLobbyBecameFund in app/page.jsx).
export function useGameData(session) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [gameId, setGameId] = useState(null);
  const [game, setGame] = useState(null); // raw games row (numeric columns come back as strings) or null
  const [seats, setSeats] = useState([]); // mapped game_players rows, joined_at order
  const [entries, setEntries] = useState([]); // mapped entries rows (buy-ins/re-buys), every seat's, created_at order
  const [playerCounts, setPlayerCounts] = useState([]); // mapped player_counts rows — RLS hides everyone but you until phase is settle/done
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const gameIdRef = useRef(gameId);
  useEffect(() => { gameIdRef.current = gameId; }, [gameId]);

  useEffect(() => {
    if (!gameId) return; // leaveGame() clears game/seats itself; nothing else sets gameId to null
    let cancelled = false;

    (async () => {
      setLoading(true);
      const [{ data: gameRow, error: gErr }, { data: seatRows, error: sErr }, { data: entryRows, error: eErr }, { data: countRows, error: cErr }] = await Promise.all([
        supabase.from("games").select("*").eq("id", gameId).maybeSingle(),
        supabase.from("game_players").select("*").eq("game_id", gameId).order("joined_at", { ascending: true }),
        supabase.from("entries").select("*").eq("game_id", gameId).order("created_at", { ascending: true }),
        supabase.from("player_counts").select("*").eq("game_id", gameId),
      ]);
      if (cancelled) return;
      if (gErr || sErr || eErr || cErr) { setError((gErr || sErr || eErr || cErr).message); setLoading(false); return; }
      setGame(gameRow);
      setSeats((seatRows || []).map(rowToSeat));
      setEntries((entryRows || []).map(rowToEntry));
      setPlayerCounts((countRows || []).map(rowToCount));
      setLoading(false);
    })();

    const channel = supabase
      .channel(`game:${gameId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "games", filter: `id=eq.${gameId}` },
        (payload) => { if (payload.eventType !== "DELETE") setGame(payload.new); }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_players", filter: `game_id=eq.${gameId}` },
        (payload) => {
          setSeats((cur) => {
            if (payload.eventType === "DELETE") return cur.filter((s) => s.id !== payload.old.id);
            const row = rowToSeat(payload.new);
            return cur.some((s) => s.id === row.id) ? cur.map((s) => (s.id === row.id ? row : s)) : [...cur, row];
          });
        }
      )
      .on(
        // entries is append-only (no update/delete policy) — only INSERT matters.
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "entries", filter: `game_id=eq.${gameId}` },
        (payload) => {
          setEntries((cur) => (cur.some((e) => e.id === payload.new.id) ? cur : [...cur, rowToEntry(payload.new)]));
        }
      )
      .on(
        // player_counts is insert-only too (see migration 0008 — no update
        // policy at all, that's what makes the recount lock a real
        // guarantee). This only catches rows inserted *while already
        // visible* under RLS (your own, always); everyone else's counts
        // arrive via the settle/done refetch effect below, since Realtime
        // has no way to notify "your visibility just changed", only "a row
        // changed".
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "player_counts", filter: `game_id=eq.${gameId}` },
        (payload) => {
          setPlayerCounts((cur) => (cur.some((c) => c.id === payload.new.id) ? cur : [...cur, rowToCount(payload.new)]));
        }
      )
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [gameId, supabase]);

  // The count-privacy reveal: once the phase moves to settle/done, every
  // participant's RLS visibility into player_counts widens from "just
  // mine" to "everyone's" — but that's a permission change, not a row
  // change, so Realtime (which only fires on INSERT/UPDATE/DELETE) can't
  // tell a client about it. Refetching on the phase flip is what actually
  // reveals the other seats' numbers.
  useEffect(() => {
    if (!gameId || (game?.phase !== "settle" && game?.phase !== "done")) return;
    let cancelled = false;
    (async () => {
      const { data, error: cErr } = await supabase.from("player_counts").select("*").eq("game_id", gameId);
      if (cancelled || cErr) return;
      setPlayerCounts((data || []).map(rowToCount));
    })();
    return () => { cancelled = true; };
  }, [gameId, game?.phase, supabase]);

  const createGame = useCallback(async (cfg, hostProfile) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Must be signed in to open a lobby");
    let created = null;
    for (let attempt = 0; attempt < 5 && !created; attempt++) {
      const { data, error } = await supabase.from("games").insert({
        code: genCode(), host_id: user.id, title: cfg.title, currency: cfg.cur,
        buy_in: cfg.buyIn, chips: cfg.chips, max_rebuys: cfg.maxRebuys,
      }).select().single();
      if (!error) created = data;
      else if (error.code !== "23505") throw error; // anything but a code collision is fatal
    }
    if (!created) throw new Error("Could not allocate a table code — try again");
    const { error: seatErr } = await supabase.from("game_players")
      .insert({ game_id: created.id, user_id: user.id, seat_name: hostProfile.name, color: hostProfile.color, is_host: true });
    if (seatErr) throw seatErr;
    setGameId(created.id);
    return created;
  }, [supabase]);

  const joinGame = useCallback(async (code, seatName, color) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not signed in");
    // RPC, not a raw table select: the games SELECT policy only covers the
    // host and already-seated players — see
    // supabase/migrations/0006_fix_games_enumeration.sql.
    const { data: gameRow, error: gErr } = await supabase.rpc("lookup_game_by_code", { p_code: code });
    if (gErr) throw gErr;
    if (!gameRow || !gameRow.id) throw new Error("No table with that code");
    if (gameRow.phase !== "lobby") throw new Error("This table has already started");
    const { error: insErr } = await supabase.from("game_players")
      .insert({ game_id: gameRow.id, user_id: user.id, seat_name: seatName, color });
    if (insErr && insErr.code !== "23505") throw insErr; // 23505 = already seated, treat as success (idempotent re-join)
    setGameId(gameRow.id);
    return gameRow;
  }, [supabase]);

  const agree = useCallback(async (value = true) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !gameIdRef.current) return;
    const { error } = await supabase.from("game_players").update({ agreed: value }).eq("game_id", gameIdRef.current).eq("user_id", user.id);
    if (error) setError(error.message);
  }, [supabase]);

  const recordEntry = useCallback(async (gamePlayerId, amount, chips, kind) => {
    if (!gameIdRef.current) return;
    const { data, error } = await supabase.from("entries")
      .insert({ game_id: gameIdRef.current, game_player_id: gamePlayerId, amount, chips, kind })
      .select().single();
    if (error) { setError(error.message); throw error; }
    // Optimistic local add — the realtime echo above no-ops on the dupe id.
    setEntries((cur) => (cur.some((e) => e.id === data.id) ? cur : [...cur, rowToEntry(data)]));
  }, [supabase]);

  const advancePhase = useCallback(async (newPhase) => {
    if (!gameIdRef.current) return;
    const { data, error } = await supabase.rpc("advance_phase", { p_game_id: gameIdRef.current, p_new_phase: newPhase });
    if (error) { setError(error.message); throw error; }
    setGame(data);
    return data;
  }, [supabase]);

  // Own-row-only self-reported flags (see migration 0008's comment on why
  // these don't need player_counts' lockdown). gamePlayerId is the
  // caller's own seat id, same convention as recordEntry.
  const setSeatFlag = useCallback(async (gamePlayerId, patch) => {
    const { error } = await supabase.from("game_players").update(patch).eq("id", gamePlayerId);
    if (error) { setError(error.message); throw error; }
  }, [supabase]);

  // Locks in a player's final stack count. Two writes because the value
  // and the "I've counted" flag live in different places on purpose (see
  // migration 0008) — the insert is what's actually access-controlled;
  // the flag update just lets everyone else see "counted" without the
  // number.
  const submitCount = useCallback(async (gamePlayerId, chips) => {
    if (!gameIdRef.current) return;
    const { data, error } = await supabase.from("player_counts")
      .insert({ game_id: gameIdRef.current, game_player_id: gamePlayerId, chips })
      .select().single();
    if (error) { setError(error.message); throw error; }
    setPlayerCounts((cur) => (cur.some((c) => c.id === data.id) ? cur : [...cur, rowToCount(data)]));
    await setSeatFlag(gamePlayerId, { submitted: true });
  }, [supabase, setSeatFlag]);

  // Aggregate-only reconciliation check — never returns a per-player
  // figure, so it's safe to call before everyone's counts are visible.
  const reconcileTotals = useCallback(async () => {
    if (!gameIdRef.current) return { counted: 0, issued: 0 };
    const { data, error } = await supabase.rpc("reconcile_totals", { p_game_id: gameIdRef.current });
    if (error) { setError(error.message); throw error; }
    const row = Array.isArray(data) ? data[0] : data;
    return { counted: Number(row?.counted ?? 0), issued: Number(row?.issued ?? 0) };
  }, [supabase]);

  // Host-only, all-or-nothing: resets every seat's submitted flag, deletes
  // every locked count, and moves the game back to `cashout`. No path
  // here or anywhere else edits a single player's number — see
  // migration 0008.
  const recountLock = useCallback(async () => {
    if (!gameIdRef.current) return;
    const { data, error } = await supabase.rpc("recount_lock", { p_game_id: gameIdRef.current });
    if (error) { setError(error.message); throw error; }
    setPlayerCounts([]);
    setGame(data);
    return data;
  }, [supabase]);

  const leaveGame = useCallback(() => { setGameId(null); setGame(null); setSeats([]); setEntries([]); setPlayerCounts([]); }, []);

  const viewer = useMemo(() => seats.find((s) => s.userId === session?.user?.id) || null, [seats, session]);
  const isHost = !!viewer?.host;
  const allAgreed = seats.length > 0 && seats.every((s) => s.agreed);
  const allFunded = seats.length > 0 && seats.every((s) => entries.some((e) => e.gamePlayerId === s.id));

  return {
    gameId, setGameId, game, seats, entries, playerCounts, viewer, isHost, allAgreed, allFunded, loading, error,
    createGame, joinGame, agree, recordEntry, advancePhase, setSeatFlag, submitCount, reconcileTotals, recountLock, leaveGame,
  };
}
