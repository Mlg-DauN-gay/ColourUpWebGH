"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock, Languages, ScrollText, User } from "lucide-react";
import { C, PALETTE, THEME, themeVars } from "@/lib/themes";
import { DICT, money } from "@/lib/i18n";
import { Lang } from "@/lib/LangContext";
import { simplify } from "@/lib/settle";
import { useAppData } from "@/lib/useAppData";
import { useGameData } from "@/lib/useGameData";
import { Chip, Dot } from "@/components/atoms";
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
    signUp, signIn, requestPasswordReset, updatePassword, signOut, upgradeAnonymousAccount,
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
  const counted = players.reduce((s, p) => s + (p.chips ?? 0), 0);
  const drift = counted - chipsOut;
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

  const nets = useMemo(() => players.map(p => {
    const put = p.entries.reduce((a, e) => a + e.amount, 0);
    const got = (p.chips ?? 0) / rate;
    return { id: p.id, name: p.name, color: p.color, put, got, net: got - put };
  }), [players, rate]);
  const transfers = useMemo(() => simplify(nets), [nets]);

  const hhmm = `${String(Math.floor(elapsed / 3600)).padStart(2, "0")}:${String(Math.floor(elapsed / 60) % 60).padStart(2, "0")}`;
  const gameLive = ["lobby", "fund", "live", "cashout", "reconcile", "settle"].includes(gp);

  function startHost() {
    setPlayers([]);
    setCfg(c => ({ ...c, cur: profile.currency, scan: null, chips: c.buyIn }));
    setLog([]); setStarted(null); setElapsed(0);
    setGp("setup"); setResumeGp(null); setPendingLobby(false); setTab("play");
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
      await gameData.createGame(cfg, profile);
      setGp("lobby");
      setTab("play");
      mkLog(L.tableOpened(M(cfg.buyIn, cfg.cur), cfg.chips.toLocaleString()));
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
  // `players` array (same ids), so Fund/Live/Cashout/Reconcile/Settle/Done
  // keep working unchanged on local state, exactly as before this slice.
  function handleLobbyBecameFund() {
    setPlayers(gameData.seats.map(s => ({
      id: s.id, name: s.name, color: s.color, host: s.host, agreed: s.agreed,
      entries: [], chips: null, submitted: false, approved: false, out: false,
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

  function recordEntry(pid, amount, reason) {
    const p = players.find(x => x.id === pid);
    upd(pid, { entries: [...p.entries, { amount, chips: amount * rate, at: Date.now(), kind: reason }] });
    mkLog(L.recordedLog(p.name, reason === "buy-in" ? L.buyinReason : L.rebuyReason, M(amount, cfg.cur)));
  }

  function release() {
    const host = players.find(p => p.host);
    const hostNet = nets.find(n => n.id === host?.id)?.net ?? 0;
    setHistory(h => [{ id: "h" + Date.now(), title: cfg.title, date: Date.now(), cur: cfg.cur, meNet: hostNet, players: players.length, duration: elapsed }, ...h]);
    setGp("done");
    mkLog(L.settledReceiptLog(L.transferN(transfers.length)));
    mkLog(L.savedLog);
  }
  function backHome() {
    setGp("home"); setResumeGp(null); setPendingLobby(false); setPlayers([]); setStarted(null); setElapsed(0); setLog([]);
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

          {tab === "play" && (["cashout", "reconcile", "settle", "done"].includes(gp) || inAll > 0) && <PotRail {...{ inAll, chipsOut, counted, gp, cfg, drift }} />}
          {showLog && <LedgerPanel log={log} />}

          <div className="px-5">
            {tab === "play" ? (<>
              {gp === "home" && <PlayHome {...{ profile, history, resumeGp, resumeTable, startHost, setJoinSheet, setTab }} />}
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
              {gp === "fund" && <Fund {...{ cfg, players, viewer, recordEntry, allFunded, setGp, setStarted, mkLog, session, upgradeAnonymousAccount }} />}
              {gp === "live" && <Live {...{ cfg, players, viewer, recordEntry, rate, isHost, upd, mkLog, setGp }} />}
              {gp === "cashout" && <Cashout key={viewer.id} {...{ cfg, players, viewer, upd, rate, allSubmitted, setGp, mkLog }} />}
              {gp === "reconcile" && <Reconcile {...{ players, upd, drift, chipsOut, counted, setGp, mkLog }} />}
              {gp === "settle" && <Settle {...{ cfg, nets, transfers, players, viewer, upd, allApproved, release }} />}
              {gp === "done" && <Done {...{ cfg, nets, transfers, elapsed, backHome, players }} />}
            </>) : (
              <ProfileTab key={dataReady ? "ready" : "loading"} {...{
                session, dataReady, signUp, signIn, requestPasswordReset,
                profile, setProfile, history, userEmail, signOut, updatePassword,
                friends, setFriends, mkLog, gameLive, addSeatNamed,
                onBack: () => { setPendingLobby(false); setTab("play"); },
              }} />
            )}
          </div>
        </div>

        {joinSheet && <JoinSheet onClose={() => setJoinSheet(false)} />}
      </div>
    </Lang.Provider>
  );
}
