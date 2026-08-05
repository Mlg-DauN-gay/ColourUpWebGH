"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "./supabase/client";

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

function originUrl() {
  return typeof window !== "undefined" ? window.location.origin : "";
}

const EMPTY_PROFILE = { registered: false, name: "", handle: "", color: "", currency: "£" };

// Accounts are mandatory: profile/friends/history always live in Supabase,
// gated entirely by whether there's an authenticated session. app/page.jsx
// renders an auth gate when there isn't one.
export function useAppData() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  const userEmail = session?.user?.email ?? null;

  const [profile, setProfileState] = useState(EMPTY_PROFILE);
  const [friends, setFriendsState] = useState([]);
  const [history, setHistoryState] = useState([]);
  const [dataReady, setDataReady] = useState(false);
  const knownFriendIds = useRef(new Set());
  const knownHistoryIds = useRef(new Set());
  const profileRef = useRef(profile);
  const friendsRef = useRef(friends);
  const historyRef = useRef(history);
  useEffect(() => { profileRef.current = profile; }, [profile]);
  useEffect(() => { friendsRef.current = friends; }, [friends]);
  useEffect(() => { historyRef.current = history; }, [history]);

  const refresh = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setProfileState(EMPTY_PROFILE); setFriendsState([]); setHistoryState([]); setDataReady(true);
      return;
    }
    const [{ data: profileRow }, { data: friendRows }, { data: historyRows }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("friends").select("*").eq("owner_id", user.id).order("created_at", { ascending: false }),
      supabase.from("history").select("*").eq("owner_id", user.id).order("played_at", { ascending: false }),
    ]);
    setProfileState(profileRow ? rowToProfile(profileRow) : EMPTY_PROFILE);
    const fr = (friendRows || []).map(rowToFriend);
    const hi = (historyRows || []).map(rowToHistory);
    knownFriendIds.current = new Set(fr.map((f) => f.id));
    knownHistoryIds.current = new Set(hi.map((h) => h.id));
    setFriendsState(fr);
    setHistoryState(hi);
    setDataReady(true);
  }, [supabase]);

  useEffect(() => {
    (async () => {
      if (!session) { setDataReady(false); return; }
      await refresh();
    })();
  }, [session, refresh]);

  const setProfile = useCallback(async (updaterOrValue) => {
    const next = callOrValue(updaterOrValue, profileRef.current);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: new Error("no session") };
    const { data, error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, handle: next.handle, display_name: next.name, color: next.color, currency: next.currency })
      .select()
      .single();
    if (!error && data) setProfileState(rowToProfile(data));
    return { error };
  }, [supabase]);

  const setFriends = useCallback(async (updaterOrValue) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: new Error("no session") };
    const next = callOrValue(updaterOrValue, friendsRef.current);
    setFriendsState(next); // optimistic
    const added = next.filter((f) => !knownFriendIds.current.has(f.id));
    let firstError = null;
    for (const f of added) {
      const { data, error } = await supabase
        .from("friends")
        .insert({ owner_id: user.id, handle: f.handle, display_name: f.name, color: f.color, together_count: f.together ?? 0 })
        .select()
        .single();
      if (!error && data) {
        knownFriendIds.current.add(data.id);
        setFriendsState((cur) => cur.map((x) => (x.id === f.id ? rowToFriend(data) : x)));
      } else if (error) {
        firstError = firstError || error;
        // Roll the optimistic add back so a failed insert doesn't linger in
        // the UI looking saved, and so it isn't silently retried (and
        // possibly duplicated) the next time setFriends runs.
        setFriendsState((cur) => cur.filter((x) => x.id !== f.id));
      }
    }
    return { error: firstError };
  }, [supabase]);

  const setHistory = useCallback(async (updaterOrValue) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: new Error("no session") };
    const next = callOrValue(updaterOrValue, historyRef.current);
    setHistoryState(next); // optimistic
    const added = next.filter((h) => !knownHistoryIds.current.has(h.id));
    let firstError = null;
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
        setHistoryState((cur) => cur.map((x) => (x.id === h.id ? rowToHistory(data) : x)));
      } else if (error) {
        firstError = firstError || error;
        setHistoryState((cur) => cur.filter((x) => x.id !== h.id));
      }
    }
    return { error: firstError };
  }, [supabase]);

  // ── auth actions ──
  const signUp = useCallback(async (email, password) => {
    return supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${originUrl()}/auth/callback` } });
  }, [supabase]);

  const signIn = useCallback(async (email, password) => {
    return supabase.auth.signInWithPassword({ email, password });
  }, [supabase]);

  const signInWithGoogle = useCallback(async () => {
    return supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${originUrl()}/auth/callback` },
    });
  }, [supabase]);

  const requestPasswordReset = useCallback(async (email) => {
    return supabase.auth.resetPasswordForEmail(email, { redirectTo: `${originUrl()}/auth/callback?next=/auth/reset` });
  }, [supabase]);

  const updatePassword = useCallback(async (password) => {
    return supabase.auth.updateUser({ password });
  }, [supabase]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase]);

  // Upgrades an anonymous guest session (see app/join/[code]) to a real
  // account in place — same auth.uid() before and after, so any
  // game_players/entries rows already created under it stay valid. Not
  // signUp: that would create a brand-new user and orphan the guest's seat.
  const upgradeAnonymousAccount = useCallback(async (email, password) => {
    return supabase.auth.updateUser({ email, password });
  }, [supabase]);

  // The Google equivalent of upgradeAnonymousAccount — links a Google
  // identity to the current (anonymous) session in place, same auth.uid()
  // before and after, instead of signInWithOAuth's "start a fresh session"
  // behaviour. Unlike updateUser, this leaves the page via a real OAuth
  // redirect, so it explicitly carries the current path+query (e.g.
  // `/?game=<id>`) through as `next`, or the guest would land back on a
  // bare Home with no memory of the table they were mid-buy-in on.
  const linkGoogleIdentity = useCallback(async () => {
    const here = typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : "/";
    return supabase.auth.linkIdentity({
      provider: "google",
      options: { redirectTo: `${originUrl()}/auth/callback?next=${encodeURIComponent(here)}` },
    });
  }, [supabase]);

  return {
    session, authReady, userEmail, dataReady,
    signUp, signIn, signInWithGoogle, requestPasswordReset, updatePassword, signOut,
    upgradeAnonymousAccount, linkGoogleIdentity,
    profile, setProfile,
    friends, setFriends,
    history, setHistory,
  };
}
