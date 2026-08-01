"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "./supabase/client";
import { useLocalStorageState } from "./useLocalStorageState";

const LS_MODE = "colourup:mode"; // "solo" | "online"
const LS_PROFILE = "colourup:profile";
const LS_FRIENDS = "colourup:friends";
const LS_HISTORY = "colourup:history";

// ── DB row <-> app shape mapping ──────────────────────────────────────────
const rowToProfile = (row) => ({
  registered: true,
  name: row.display_name,
  handle: row.handle,
  color: row.color,
  currency: row.currency,
});
const rowToFriend = (row) => ({ id: row.id, name: row.display_name, handle: row.handle, color: row.color, together: row.together_count });
const rowToHistory = (row) => ({ id: row.id, title: row.title, date: new Date(row.played_at).getTime(), cur: row.currency, meNet: Number(row.net_amount), players: row.players, duration: row.duration_seconds });

function callOrValue(updaterOrValue, current) {
  return typeof updaterOrValue === "function" ? updaterOrValue(current) : updaterOrValue;
}

// Unifies "solo" (localStorage only, works offline) and "online" (Supabase,
// synced across devices) modes behind the same {profile,friends,history}
// interface the rest of the app already uses, so game-phase components
// don't need to know which mode is active.
export function useAppData(defaults) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [mode, setModeRaw] = useLocalStorageState(LS_MODE, "solo");
  // Mirrors `mode`, but updated synchronously at the moment goOnline/goSolo
  // are called. setProfile/setFriends/setHistory read this instead of the
  // `mode` closure value — a caller that does `await goOnline(); setProfile(...)`
  // in the same event handler would otherwise see a stale "solo" `mode`
  // (captured at the last render) because React doesn't re-render mid-handler.
  const modeRef = useRef(mode);
  useEffect(() => { modeRef.current = mode; }, [mode]);

  // solo (local) state — unchanged behaviour from before Supabase existed
  const [localProfile, setLocalProfile] = useLocalStorageState(LS_PROFILE, defaults.profile);
  const [localFriends, setLocalFriends] = useLocalStorageState(LS_FRIENDS, defaults.friends);
  const [localHistory, setLocalHistory] = useLocalStorageState(LS_HISTORY, defaults.history);

  // auth session
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  const userId = session?.user?.id ?? null;
  const isAnonymous = !!session?.user?.is_anonymous;
  const userEmail = session?.user?.email ?? null;

  // cloud (online) state
  const [cloudProfile, setCloudProfile] = useState(null); // null = no row yet / not loaded
  const [cloudFriends, setCloudFriends] = useState([]);
  const [cloudHistory, setCloudHistory] = useState([]);
  const knownFriendIds = useRef(new Set());
  const knownHistoryIds = useRef(new Set());

  const refreshCloud = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [{ data: profileRow }, { data: friendRows }, { data: historyRows }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("friends").select("*").eq("owner_id", user.id).order("created_at", { ascending: false }),
      supabase.from("history").select("*").eq("owner_id", user.id).order("played_at", { ascending: false }),
    ]);
    setCloudProfile(profileRow ? rowToProfile(profileRow) : null);
    const friends = (friendRows || []).map(rowToFriend);
    const history = (historyRows || []).map(rowToHistory);
    knownFriendIds.current = new Set(friends.map((f) => f.id));
    knownHistoryIds.current = new Set(history.map((h) => h.id));
    setCloudFriends(friends);
    setCloudHistory(history);
  }, [supabase]);

  useEffect(() => {
    if (mode !== "online" || !userId) return;
    (async () => { await refreshCloud(); })();
  }, [mode, userId, refreshCloud]);

  // ── profile ──
  const profile = useMemo(
    () => (mode === "online" ? (cloudProfile ?? { ...defaults.profile, registered: false }) : localProfile),
    [mode, cloudProfile, localProfile, defaults.profile]
  );
  const profileRef = useRef(profile);
  useEffect(() => { profileRef.current = profile; }, [profile]);

  const setProfile = useCallback(async (updaterOrValue) => {
    if (modeRef.current !== "online") { setLocalProfile(updaterOrValue); return; }
    const next = callOrValue(updaterOrValue, profileRef.current);
    // Read the current user directly rather than trust the `session` state
    // closure — right after goOnline() the auth-state-change listener may
    // not have re-rendered us yet, but the client's in-memory session is
    // already current.
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // caller must goOnline() first
    const { data, error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, handle: next.handle, display_name: next.name, color: next.color, currency: next.currency })
      .select()
      .single();
    if (!error && data) setCloudProfile(rowToProfile(data));
  }, [setLocalProfile, supabase]);

  // ── friends ──
  const friends = mode === "online" ? cloudFriends : localFriends;

  const setFriends = useCallback(async (updaterOrValue) => {
    if (modeRef.current !== "online") { setLocalFriends(updaterOrValue); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const prev = cloudFriends;
    const next = callOrValue(updaterOrValue, prev);
    setCloudFriends(next); // optimistic
    const added = next.filter((f) => !knownFriendIds.current.has(f.id));
    for (const f of added) {
      const { data, error } = await supabase
        .from("friends")
        .insert({ owner_id: user.id, handle: f.handle, display_name: f.name, color: f.color, together_count: f.together ?? 0 })
        .select()
        .single();
      if (!error && data) {
        knownFriendIds.current.add(data.id);
        setCloudFriends((cur) => cur.map((x) => (x.id === f.id ? rowToFriend(data) : x)));
      }
    }
  }, [cloudFriends, setLocalFriends, supabase]);

  // ── history ──
  const history = mode === "online" ? cloudHistory : localHistory;

  const setHistory = useCallback(async (updaterOrValue) => {
    if (modeRef.current !== "online") { setLocalHistory(updaterOrValue); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const prev = cloudHistory;
    const next = callOrValue(updaterOrValue, prev);
    setCloudHistory(next); // optimistic
    const added = next.filter((h) => !knownHistoryIds.current.has(h.id));
    for (const h of added) {
      const { data, error } = await supabase
        .from("history")
        .insert({
          owner_id: user.id, title: h.title, played_at: new Date(h.date).toISOString(),
          currency: h.cur, net_amount: h.meNet, players: h.players, duration_seconds: h.duration,
        })
        .select()
        .single();
      if (!error && data) {
        knownHistoryIds.current.add(data.id);
        setCloudHistory((cur) => cur.map((x) => (x.id === h.id ? rowToHistory(data) : x)));
      }
    }
  }, [cloudHistory, setLocalHistory, supabase]);

  // ── mode transitions & auth actions ──
  const goOnline = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) return { error };
    }
    modeRef.current = "online";
    setModeRaw("online");
    await refreshCloud();
    return { error: null };
  }, [supabase, setModeRaw, refreshCloud]);

  const goSolo = useCallback(() => { modeRef.current = "solo"; setModeRaw("solo"); }, [setModeRaw]);

  // Attach an email to the current (usually anonymous) session, preserving
  // its data — the user confirms via the magic-link email.
  const linkEmail = useCallback(async (email) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return supabase.auth.updateUser({ email }, { emailRedirectTo: `${origin}/auth/callback` });
  }, [supabase]);

  // Sign in on a fresh device with an email that already has an account.
  const signInWithEmail = useCallback(async (email) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${origin}/auth/callback` } });
  }, [supabase]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setCloudProfile(null);
    setCloudFriends([]);
    setCloudHistory([]);
    modeRef.current = "solo";
    setModeRaw("solo");
  }, [supabase, setModeRaw]);

  return {
    mode, goOnline, goSolo,
    session, authReady, isAnonymous, userEmail,
    linkEmail, signInWithEmail, signOut,
    profile, setProfile,
    friends, setFriends,
    history, setHistory,
  };
}
