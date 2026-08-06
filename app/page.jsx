"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock, Languages, RefreshCw, ScrollText, User } from "lucide-react";
import { C, PALETTE, THEME, themeVars } from "@/lib/themes";
import { DICT, money } from "@/lib/i18n";
import { Lang } from "@/lib/LangContext";
import { simplify } from "@/lib/settle";
import { distributeLargestRemainder, toMajor, toMinor } from "@/lib/money";
import { useAppData } from "@/lib/useAppData";
import { useGameData } from "@/lib/useGameData";
import { Chip, Dot } from "@/components/atoms";
import StepRail from "@/components/StepRail";
import PotRail from "@/components/PotRail";
import LedgerPanel from "@/components/LedgerPanel";
import PlayHome from "@/components/PlayHome";
import Setup from "@/components/Setup";
import Lobby from "@/components/Lobby";
import Fund from "@/components/Fund";
import Live from "@/components/Live";
import Cashout from "@/components/Cashout";
import Reconcile from "@/components/Reconcile";
import Settle from "@/components/Settle";
import Done from "@/components/Done";
import ProfileTab from "@/components/ProfileTab";
import JoinSheet from "@/components/JoinSheet";
import Intro from "@/components/Intro";

export default function ColourUpPage() {
  return (
    <Suspense fallback={<div style={{ background: THEME.ink, minHeight: "100vh", display: "grid", placeItems: "center" }}><Chip size={36} color={THEME.gold} /></div>}>
      <ColourUpApp />
    </Suspense>
  );
}

function ColourUpApp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlGameId = searchParams.get("game");

  const [lang, setLang] = useState("en");
  const L = DICT[lang];
  const M = (n, cur) => money(n, cur, lang);
  const t = THEME;

  const [tab, setTab] = useState("play"); // play | profile

  // Account is only required once a lobby actually opens (see openLobby
  // below) — browsing home/setup works signed out. profile/friends/history
  // always live in Supabase once signed in (lib/useAppData.js).
  const {
    session, authReady, dataReady, userEmail,
    signUp, signIn, signInWithGoogle, requestPasswordReset, updatePassword, signOut,
    upgradeAnonymousAccount, linkGoogleIdentity,
    profile, setProfile, friends, setFriends, history, setHistory,
  } = useAppData();

  // Real multiplayer lobby (games/game_players, synced via Realtime). Fund
  // through Done still run on the local `players` array below, seeded from
  // this hook's `seats` the moment the host advances past lobby — see
  // handleLobbyBecameFund.
  const gameData = useGameData(session);

  // game engine
  const [gp, setGp] = useState("home"); // home | setup | lobby | fund | live | cashout | reconcile | settle | done
  const [resumeGp, setResumeGp] = useState(null); // phase to jump back to from the "Resume table" banner
  const [cfg, setCfg] = useState({ title: DICT.en.thu, cur: profile.currency, buyIn: 5000, chips: 5000, scan: null, maxRebuys: 3 });
  const [players, setPlayers] = useState([]);
  const [me, setMe] = useState(null);
  const [log, setLog] = useState([]);
  const [started, setStarted] = useState(null);
  const [joinSheet, setJoinSheet] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [pendingLobby, setPendingLobby] = useState(false); // "Open lobby" was clicked signed out — finish once signed in
  const [lastCfg, setLastCfg] = useState(null); // last-hosted stake, for PlayHome's one-tap re-host — read client-side only, to avoid a hydration mismatch
  useEffect(() => { (async () => { setLastCfg(lastHostedCfg()); })(); }, []);
  const [showIntro, setShowIntro] = useState(false);
  useEffect(() => {
    (async () => {
      try { if (!localStorage.getItem("cu_seen_intro")) setShowIntro(true); } catch { /* private mode etc. — just skip the explainer */ }
    })();
  }, []);
  function dismissIntro() {
    setShowIntro(false);
    try { localStorage.setItem("cu_seen_intro", "1"); } catch { /* not load-bearing */ }
  }

  useEffect(() => {
    if (!started) return;
    const i = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(i);
  }, [started]);
  useEffect(() => { document.body.style.background = t.ink; }, [t.ink]);

  // A guest arriving from /join/[code] lands here with ?game=<id> — pick up
  // that game and drop into its (real) lobby.
  useEffect(() => {
    if (urlGameId && !gameData.gameId) {
      (async () => { gameData.setGameId(urlGameId); setGp("lobby"); setTab("play"); })();
    }
  }, [urlGameId, gameData]);

  function mkLog(text) { setLog(l => [{ t: new Date(), text }, ...l]); }
  function mk(name, i, host = false, color) {
    return { id: "p" + i + "_" + Math.random().toString(36).slice(2, 6), name, color: color || PALETTE[i % PALETTE.length], host, agreed: false, entries: [], chips: null, submitted: false, approved: false, out: false };
  }
  const upd = (id, patch) => setPlayers(ps => ps.map(p => p.id === id ? { ...p, ...patch } : p));
  function addSeatNamed(name, color) { setPlayers(ps => [...ps, mk(name, ps.length, false, color)]); }

  const rate = cfg.chips / cfg.buyIn;
  const inAll = players.reduce((s, p) => s + p.entries.reduce((a, e) => a + e.amount, 0), 0);
  const chipsOut = players.reduce((s, p) => s + p.entries.reduce((a, e) => a + e.chips, 0), 0);
  const allFunded = players.length > 0 && players.every(p => p.entries.length > 0);
  const allSubmitted = players.length > 0 && players.every(p => p.submitted);
  const allApproved = players.length > 0 && players.every(p => p.approved);
  const viewer = players.find(p => p.id === me) || players[0];
  const isHost = viewer?.host;

  // Real-lobby-derived config (host's actual configured stake), used while
  // gp === "lobby" — a guest's local `cfg` is never synced from the host,
  // so falling back to it would show the wrong buy-in/chip amounts.
  const lobbyCfg = gameData.game
    ? { title: gameData.game.title, cur: gameData.game.currency, buyIn: Number(gameData.game.buy_in), chips: Number(gameData.game.chips), maxRebuys: gameData.game.max_rebuys, scan: null }
    : cfg;

  // Exact-cent settlement: the pot (total buy-ins, integer minor units) is
  // divided across final chip counts by largest-remainder apportionment
  // (lib/money.js) instead of each player's `chips / rate` — that float
  // division is what could leave the receipt a fraction of a cent short of
  // zero. `rate` stays in use for in-game *previews* (Cashout's running
  // total while typing, Live's exposure card) where approximate is fine;
  // this exact path is only for the money that ends up on the receipt.
  const settlement = useMemo(() => {
    const putMinor = players.map(p => p.entries.reduce((a, e) => a + toMinor(e.amount), 0));
    const totalPotMinor = putMinor.reduce((a, b) => a + b, 0);
    const gotMinor = distributeLargestRemainder(totalPotMinor, players.map(p => p.chips ?? 0));
    const nets = players.map((p, i) => ({
      id: p.id, name: p.name, color: p.color,
      put: toMajor(putMinor[i]), got: toMajor(gotMinor[i]), net: toMajor(gotMinor[i] - putMinor[i]),
    }));
    // simplify() needs the exact integer minor-unit nets, not the display
    // `nets` above — dividing by 100 for display is safe to re-round for
    // showing on screen, but feeding /100'd floats back into the debt/
    // credit matcher would reintroduce the exact error this is fixing.
    const netsMinor = players.map((p, i) => ({ id: p.id, name: p.name, color: p.color, net: gotMinor[i] - putMinor[i] }));
    const transfers = simplify(netsMinor).map(t => ({ from: t.from, to: t.to, amount: toMajor(t.amount) }));
    return { nets, transfers };
  }, [players]);
  const { nets, transfers } = settlement;

  const hhmm = `${String(Math.floor(elapsed / 3600)).padStart(2, "0")}:${String(Math.floor(elapsed / 60) % 60).padStart(2, "0")}`;
  const gameLive = ["lobby", "fund", "live", "cashout", "reconcile", "settle"].includes(gp);

  // Faster path: the stake/title from the last table you actually opened,
  // remembered across sessions so a repeat game night doesn't start from
  // scratch. `startHost(true)` (the PlayHome "Re-host" shortcut) applies it
  // explicitly; an ordinary "Host a table" tap still picks it up as the
  // sensible default, just without the explicit re-host framing.
  function lastHostedCfg() {
    if (typeof window === "undefined") return null;
    try { return JSON.parse(localStorage.getItem("cu_last_cfg") || "null"); } catch { return null; }
  }
  function startHost() {
    setPlayers([]);
    const last = lastHostedCfg();
    setCfg(c => ({ ...c, ...(last || {}), cur: last?.cur || profile.currency, scan: null, chips: last?.chips ?? c.buyIn }));
    setLog([]); setStarted(null); setElapsed(0);
    setGp("setup"); setResumeGp(null); setPendingLobby(false); setTab("play");
    setHistorySaved(false);
  }

  // The header logo — standard "tap the logo to go home" — but a live game
  // isn't abandoned: its phase is remembered so the home screen's "Resume
  // table" banner can jump straight back to it.
  function goHome() {
    if (gp !== "home") setResumeGp(gp);
    setGp("home");
    setTab("play");
  }
  function resumeTable() { if (resumeGp) setGp(resumeGp); }

  async function finishOpenLobby() {
    try {
      const created = await gameData.createGame(cfg, profile);
      setGp("lobby");
      setTab("play");
      mkLog(L.tableOpened(M(cfg.buyIn, cfg.cur), cfg.chips.toLocaleString()));
      try {
        localStorage.setItem("cu_last_cfg", JSON.stringify({ title: cfg.title, cur: cfg.cur, buyIn: cfg.buyIn, chips: cfg.chips, maxRebuys: cfg.maxRebuys }));
      } catch { /* localStorage unavailable (private mode etc.) — not load-bearing */ }
      // Puts the game id in the URL the same way a guest's join link does
      // (see app/join/[code]/JoinClient.jsx) — without this, a host who
      // refreshes (or whose tab reloads in the background, an ordinary
      // mobile event) lands back on Home with zero memory of the table
      // they just opened, and no way back into it.
      router.replace(`/?game=${created.id}`);
    } catch (err) {
      mkLog(L.openTableFailed(err.message));
    }
  }

  // The stake/chip setup can be explored freely, but opening the lobby is
  // where a real identity starts to matter (other players will see it, and
  // the table needs to be attributable to someone) — that's the checkpoint
  // where an account becomes mandatory. If one isn't ready yet, the profile
  // screen takes over and the effect below finishes opening the lobby the
  // moment sign-up/sign-in and profile creation are done.
  function openLobby() {
    if (!session || !profile.registered) { setPendingLobby(true); setTab("profile"); return; }
    if (!dataReady) return; // profile still loading — ignore the click rather than misfire on a stale default
    finishOpenLobby();
  }

  useEffect(() => {
    if (pendingLobby && session && dataReady && profile.registered) {
      (async () => { setPendingLobby(false); await finishOpenLobby(); })();
    }
  }, [pendingLobby, session, dataReady, profile.registered, finishOpenLobby]);

  // The Lobby -> Fund hand-off: the real game_players seats become the local
  // `players` array (same ids). Entries (buy-ins/re-buys) are real too as of
  // this slice — seeded from whatever's already in gameData.entries (a late
  // joiner or a refresh mid-fund can land here after some buy-ins already
  // happened) and kept live by the sync effect below. Live through
  // Done still run unchanged on local-only state past this point.
  function handleLobbyBecameFund() {
    setPlayers(gameData.seats.map(s => ({
      id: s.id, name: s.name, color: s.color, host: s.host, agreed: s.agreed,
      entries: gameData.entries.filter(e => e.gamePlayerId === s.id),
      chips: null, submitted: false, approved: false, out: false,
    })));
    setMe(gameData.viewer?.id ?? null);
    setGp("fund");
  }

  async function startFunding() {
    try {
      await gameData.advancePhase("fund");
      handleLobbyBecameFund();
    } catch (err) {
      mkLog(err.message);
    }
  }

  // Fires for guests the instant the host advances the game's phase —
  // Realtime updates gameData.game, this picks it up and seeds local state.
  useEffect(() => {
    if (gp === "lobby" && gameData.game?.phase === "fund") {
      (async () => { handleLobbyBecameFund(); })();
    }
  }, [gp, gameData.game?.phase, handleLobbyBecameFund]);

  // Keeps every device's view of buy-ins, cash-outs, submitted counts, and
  // sign-offs in sync with the real tables (Realtime-pushed) from Fund
  // through Done — this is the fix for the game getting stuck on an action
  // that already happened on someone else's phone, the same class of bug
  // Fund had before entries was wired up. `chips` comes from
  // gameData.playerCounts, which RLS deliberately empties out for every
  // seat but your own until the game reaches settle/done — that's what
  // keeps counts private during cashout/reconcile without this effect (or
  // anything else client-side) having to enforce it.
  useEffect(() => {
    if (!["fund", "live", "cashout", "reconcile", "settle", "done"].includes(gp)) return;
    (async () => {
      setPlayers(ps => ps.map(p => {
        const seat = gameData.seats.find(s => s.id === p.id);
        const count = gameData.playerCounts.find(c => c.gamePlayerId === p.id);
        return {
          ...p,
          entries: gameData.entries.filter(e => e.gamePlayerId === p.id),
          out: seat?.out ?? p.out,
          submitted: seat?.submitted ?? p.submitted,
          approved: seat?.approved ?? p.approved,
          // null for every seat but your own until the game reaches
          // settle/done, when RLS widens what player_counts hands back —
          // the UI already treats "submitted but chips is null" as
          // "counted, hidden" (see Cashout.jsx's roster list).
          chips: count ? count.chips : null,
        };
      }));
    })();
  }, [gameData.entries, gameData.seats, gameData.playerCounts, gp]);

  async function recordEntry(pid, amount, reason) {
    const p = players.find(x => x.id === pid);
    try {
      await gameData.recordEntry(pid, amount, amount * rate, reason);
      mkLog(L.recordedLog(p.name, reason === "buy-in" ? L.buyinReason : L.rebuyReason, M(amount, cfg.cur)));
    } catch (err) {
      mkLog(err.message);
    }
  }

  // Host-only, mirrors startFunding's shape: advance the real game row
  // (RPC checks everyone's funded), then move the host's own screen; guests
  // pick this up via the effect right below, exactly like lobby->fund.
  async function startLive() {
    try {
      await gameData.advancePhase("live");
      setGp("live"); setStarted(Date.now()); mkLog(L.cardsUp);
    } catch (err) {
      mkLog(err.message);
    }
  }

  useEffect(() => {
    if (gp !== "fund" || gameData.game?.phase !== "live") return;
    (async () => {
      setGp("live"); setStarted(Date.now()); mkLog(L.cardsUp);
    })();
  }, [gp, gameData.game?.phase, mkLog, L.cardsUp]);

  // Cash-out-early is a plain own-row flag (see migration 0008) — no
  // phase transition involved, so no advancePhase/pickup-effect pair
  // needed, just the write.
  async function markOut() {
    try {
      await gameData.setSeatFlag(viewer.id, { out: true });
      mkLog(L.cashingEarly(viewer.name));
    } catch (err) {
      mkLog(err.message);
    }
  }

  // Host-only, same shape as startLive: advance the real game row, then
  // move the host's own screen; guests pick it up via the effect below.
  async function startCashout() {
    try {
      await gameData.advancePhase("cashout");
      setGp("cashout");
    } catch (err) {
      mkLog(err.message);
    }
  }
  useEffect(() => {
    if (gp !== "live" || gameData.game?.phase !== "cashout") return;
    (async () => { setGp("cashout"); })();
  }, [gp, gameData.game?.phase]);

  // Locks in the viewer's own stack — see migration 0008's comment on why
  // this is two writes (the count itself, access-controlled; the
  // "counted" flag, plain and visible to everyone).
  async function lockStack(chips) {
    try {
      await gameData.submitCount(viewer.id, chips);
      mkLog(L.countedLog(viewer.name, chips.toLocaleString()));
    } catch (err) {
      mkLog(err.message);
    }
  }

  async function startReconcile() {
    try {
      await gameData.advancePhase("reconcile");
      setGp("reconcile");
    } catch (err) {
      mkLog(err.message);
    }
  }
  useEffect(() => {
    if (gp !== "cashout" || gameData.game?.phase !== "reconcile") return;
    (async () => { setGp("reconcile"); })();
  }, [gp, gameData.game?.phase]);

  // The balance check (and PotRail's live "counted / issued" bar) has to
  // come from the aggregate-only RPC, not from summing local
  // `players[].chips` — most of those are null here (RLS hides every seat
  // but your own until settle), by design. Re-fetches on every
  // `gameData.seats` change during cashout since a seat's `submitted` flag
  // flipping (plain, publicly visible) is the only signal a client gets
  // that the aggregate might have moved; reconcile itself needs just the
  // one entry-fetch, since cashout->reconcile is already gated on every
  // seat having submitted, so the totals can't change again until either
  // a recount (back to cashout) or settle.
  const [totals, setTotals] = useState({ counted: 0, issued: 0 });
  useEffect(() => {
    if (gp !== "cashout" && gp !== "reconcile") return;
    (async () => {
      try { setTotals(await gameData.reconcileTotals()); } catch { /* surfaced via gameData.error */ }
    })();
  }, [gp, gameData.seats, gameData]);

  async function startSettle() {
    try {
      await gameData.advancePhase("settle");
      setGp("settle");
    } catch (err) {
      mkLog(err.message);
    }
  }
  useEffect(() => {
    if (gp !== "reconcile" || gameData.game?.phase !== "settle") return;
    (async () => { setGp("settle"); })();
  }, [gp, gameData.game?.phase]);

  // Host-only, all-or-nothing reset — see migration 0008. Every device
  // (host included) picks up the phase dropping back to `cashout` via the
  // same effect startCashout's guests use, since it's the identical
  // signal (games.phase changed to 'cashout' while gp is somewhere past
  // it) — that's why there's no separate "recount" pickup effect here.
  async function recount() {
    try {
      await gameData.recountLock();
      setGp("cashout");
      mkLog(L.recountLog);
    } catch (err) {
      mkLog(err.message);
    }
  }
  useEffect(() => {
    if (gp !== "reconcile" || gameData.game?.phase !== "cashout") return;
    (async () => { setGp("cashout"); mkLog(L.recountLog); })();
  }, [gp, gameData.game?.phase, mkLog, L.recountLog]);

  async function approve() {
    try {
      await gameData.setSeatFlag(viewer.id, { approved: true });
    } catch (err) {
      mkLog(err.message);
    }
  }

  // Host-only finalize: advances the real game row (RPC checks everyone's
  // signed off), then moves the host's own screen; guests pick it up via
  // the effect below. History-saving moved out of here — see the
  // gp === "done" effect further down — because every device needs to
  // save its *own* net, not just whichever device happened to click
  // finalize.
  async function release() {
    try {
      await gameData.advancePhase("done");
      setGp("done");
      mkLog(L.settledReceiptLog(L.transferN(transfers.length)));
    } catch (err) {
      mkLog(err.message);
    }
  }
  useEffect(() => {
    if (gp !== "settle" || gameData.game?.phase !== "done") return;
    (async () => { setGp("done"); mkLog(L.settledReceiptLog(L.transferN(transfers.length))); })();
  }, [gp, gameData.game?.phase, mkLog, L, transfers.length]);

  // Every device saves its own net to its own history once the table is
  // actually done — not just the host's, and not just whichever device
  // called release(). Guarded so a re-render (or coming back to an
  // already-done game) doesn't save a duplicate entry.
  const [historySaved, setHistorySaved] = useState(false);
  useEffect(() => {
    if (gp !== "done" || historySaved || !viewer) return;
    (async () => {
      setHistorySaved(true);
      const myNet = nets.find(n => n.id === viewer.id)?.net ?? 0;
      const { error } = await setHistory(h => [{ id: "h" + Date.now(), title: cfg.title, date: Date.now(), cur: cfg.cur, meNet: myNet, players: players.length, duration: elapsed }, ...h]);
      mkLog(error ? L.saveHistoryFailedLog : L.savedLog);
    })();
  }, [gp, historySaved, viewer, nets, cfg.title, cfg.cur, players.length, elapsed, setHistory, mkLog, L.saveHistoryFailedLog, L.savedLog]);

  function backHome() {
    setGp("home"); setResumeGp(null); setPendingLobby(false); setPlayers([]); setStarted(null); setElapsed(0); setLog([]);
    setHistorySaved(false);
    gameData.leaveGame();
    router.replace("/");
  }

  const ctx = { L, lang, M };

  if (!authReady) {
    return (
      <Lang.Provider value={ctx}>
        <div style={{ ...themeVars(t), background: C.ink, minHeight: "100vh", display: "grid", placeItems: "center" }}>
          <Chip size={36} color={C.gold} />
        </div>
      </Lang.Provider>
    );
  }

  // Only Lobby is real this slice — if a device lands here after the game
  // has moved past fund (e.g. a stale/late join link, or a refresh deep
  // into the game), there's no persisted local state to resume into.
  const staleLobby = gp === "lobby" && gameData.game && !["lobby", "fund"].includes(gameData.game.phase);

  return (
    <Lang.Provider value={ctx}>
      <div style={{ ...themeVars(t), background: C.ink, minHeight: "100vh", color: C.ivory }}>
        <div className="mx-auto body" style={{ maxWidth: 460, paddingBottom: 24 }}>
          {/* header */}
          <div className="flex items-center justify-between px-5 pt-6 pb-4">
            <button onClick={goHome} className="flex items-center gap-2" aria-label="Home">
              <Chip size={20} color={C.gold} />
              <span className="disp" style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-.02em" }}>{L.brand}</span>
            </button>
            <div className="flex items-center gap-2.5">
              {started && gameLive && <span className="mono flex items-center gap-1" style={{ fontSize: 11, color: C.mute }}><Clock size={11} /> {hhmm}</span>}
              <button onClick={() => setShowLog(s => !s)} style={{ color: showLog ? C.brass : C.mute }} aria-label="Ledger"><ScrollText size={16} /></button>
              <button onClick={() => setLang(l => l === "en" ? "ru" : "en")} className="flex items-center gap-1 rounded-full px-2 py-1" style={{ border: `1px solid ${C.line}`, background: C.room, height: 28 }} aria-label="Language">
                <Languages size={13} style={{ color: C.brass }} />
                <span className="mono" style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: ".06em" }}>
                  <span style={{ color: lang === "en" ? C.ivory : C.mute }}>EN</span>
                  <span style={{ color: C.line, margin: "0 3px" }}>/</span>
                  <span style={{ color: lang === "ru" ? C.ivory : C.mute }}>RU</span>
                </span>
              </button>
              <button onClick={() => { setPendingLobby(false); setTab(tb => tb === "profile" ? "play" : "profile"); }} aria-label="Profile">
                {profile.registered
                  ? <Dot p={profile} size={28} />
                  : <span className="grid place-items-center rounded-full" style={{ width: 28, height: 28, border: `1px solid ${C.line}`, background: tab === "profile" ? C.raise : C.room }}><User size={14} style={{ color: C.brass }} /></span>}
              </button>
            </div>
          </div>

          {/* cashout/reconcile: counted from the aggregate-only RPC, since
              individual chips are still RLS-hidden then. settle/done: RLS has
              revealed everyone's, so the local sum (already correct) is fine
              and avoids an extra fetch. */}
          {tab === "play" && (["cashout", "reconcile", "settle", "done"].includes(gp) || inAll > 0) && <PotRail {...{
            inAll, chipsOut, gp, cfg,
            counted: (gp === "settle" || gp === "done") ? players.reduce((s, p) => s + (p.chips ?? 0), 0) : totals.counted,
            drift: (gp === "settle" || gp === "done") ? players.reduce((s, p) => s + (p.chips ?? 0), 0) - chipsOut : totals.counted - totals.issued,
          }} />}
          {showLog && <LedgerPanel log={log} />}

          <div className="px-5">
            {tab === "play" ? (<>
              {gameLive && gameData.connectionStatus === "reconnecting" && (
                <div className="mb-4 flex items-center gap-2 px-3.5 py-2.5 rounded-xl" style={{ background: C.raise, border: `1px solid ${C.brassSoft}` }} role="status">
                  <span className="spin" style={{ color: C.brass }}><RefreshCw size={14} /></span>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: C.brass }}>{L.reconnecting}</span>
                </div>
              )}
              <StepRail gp={gp} />
              {gp === "home" && <PlayHome {...{ profile, history, resumeGp, resumeTable, startHost, setJoinSheet, setTab, lastCfg, M, openIntro: () => setShowIntro(true) }} />}
              {gp === "setup" && <Setup {...{ cfg, setCfg, players, openLobby, mkLog }} />}
              {gp === "lobby" && (staleLobby ? (
                <div className="text-center py-16 space-y-2">
                  <div className="disp" style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-.02em" }}>{L.alreadyStarted}</div>
                </div>
              ) : (
                <Lobby {...{
                  cfg: lobbyCfg, players: gameData.seats, viewer: gameData.viewer, isHost: gameData.isHost,
                  allAgreed: gameData.allAgreed, onAgree: () => gameData.agree(true),
                  onDecline: () => mkLog(L.declinedLog(gameData.viewer?.name)),
                  onStart: startFunding, mkLog, lobbyCode: gameData.game?.code || "",
                }} />
              ))}
              {gp === "fund" && <Fund {...{ cfg, players, viewer, recordEntry, allFunded, isHost, startLive, session, upgradeAnonymousAccount, linkGoogleIdentity }} />}
              {gp === "live" && <Live {...{ cfg, players, viewer, recordEntry, rate, isHost, markOut, startCashout }} />}
              {gp === "cashout" && <Cashout key={viewer.id} {...{ cfg, players, viewer, isHost, rate, allSubmitted, lockStack, startReconcile }} />}
              {gp === "reconcile" && <Reconcile {...{ players, viewer, isHost, totals, startSettle, recount }} />}
              {gp === "settle" && <Settle {...{ cfg, nets, transfers, players, viewer, isHost, approve, allApproved, release }} />}
              {gp === "done" && <Done {...{ cfg, nets, transfers, elapsed, backHome, players }} />}
            </>) : (
              <ProfileTab key={dataReady ? "ready" : "loading"} {...{
                session, dataReady, signUp, signIn, signInWithGoogle, requestPasswordReset,
                profile, setProfile, history, userEmail, signOut, updatePassword,
                friends, setFriends, mkLog, gameLive, addSeatNamed,
                onBack: () => { setPendingLobby(false); setTab("play"); },
              }} />
            )}
          </div>
        </div>

        {joinSheet && <JoinSheet onClose={() => setJoinSheet(false)} />}
        {showIntro && <Intro onClose={dismissIntro} />}
      </div>
    </Lang.Provider>
  );
}
