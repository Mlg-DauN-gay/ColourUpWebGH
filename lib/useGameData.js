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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const gameIdRef = useRef(gameId);
  useEffect(() => { gameIdRef.current = gameId; }, [gameId]);

  useEffect(() => {
    if (!gameId) return; // leaveGame() clears game/seats itself; nothing else sets gameId to null
    let cancelled = false;

    (async () => {
      setLoading(true);
      const [{ data: gameRow, error: gErr }, { data: seatRows, error: sErr }] = await Promise.all([
        supabase.from("games").select("*").eq("id", gameId).maybeSingle(),
        supabase.from("game_players").select("*").eq("game_id", gameId).order("joined_at", { ascending: true }),
      ]);
      if (cancelled) return;
      if (gErr || sErr) { setError((gErr || sErr).message); setLoading(false); return; }
      setGame(gameRow);
      setSeats((seatRows || []).map(rowToSeat));
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
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [gameId, supabase]);

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
    const { data: gameRow, error: gErr } = await supabase.from("games").select("*").eq("code", code.toUpperCase()).maybeSingle();
    if (gErr) throw gErr;
    if (!gameRow) throw new Error("No table with that code");
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

  const advancePhase = useCallback(async (newPhase) => {
    if (!gameIdRef.current) return;
    const { data, error } = await supabase.rpc("advance_phase", { p_game_id: gameIdRef.current, p_new_phase: newPhase });
    if (error) { setError(error.message); throw error; }
    setGame(data);
    return data;
  }, [supabase]);

  const leaveGame = useCallback(() => { setGameId(null); setGame(null); setSeats([]); }, []);

  const viewer = useMemo(() => seats.find((s) => s.userId === session?.user?.id) || null, [seats, session]);
  const isHost = !!viewer?.host;
  const allAgreed = seats.length > 0 && seats.every((s) => s.agreed);

  return { gameId, setGameId, game, seats, viewer, isHost, allAgreed, loading, error, createGame, joinGame, agree, advancePhase, leaveGame };
}
