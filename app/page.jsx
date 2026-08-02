"use client";
import { useEffect, useMemo, useState } from "react";
import { Clock, Eye, Languages, ScrollText, User } from "lucide-react";
import { C, PALETTE, THEME, themeVars } from "@/lib/themes";
import { DICT, money } from "@/lib/i18n";
import { Lang } from "@/lib/LangContext";
import { simplify } from "@/lib/settle";
import { useAppData } from "@/lib/useAppData";
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

const genCode = () => Array.from({ length: 6 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");

export default function ColourUpPage() {
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
    signUp, signIn, requestPasswordReset, updatePassword, signOut,
    profile, setProfile, friends, setFriends, history, setHistory,
  } = useAppData();

  // game engine
  const [gp, setGp] = useState("home"); // home | setup | lobby | fund | live | cashout | reconcile | settle | done
  const [resumeGp, setResumeGp] = useState(null); // phase to jump back to from the "Resume table" banner
  const [cfg, setCfg] = useState({ title: DICT.en.thu, cur: profile.currency, buyIn: 5000, chips: 5000, scan: null, maxRebuys: 3 });
  const [players, setPlayers] = useState([]);
  const [me, setMe] = useState("p0");
  const [log, setLog] = useState([]);
  const [started, setStarted] = useState(null);
  const [lobbyCode, setLobbyCode] = useState("");
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

  function mkLog(text) { setLog(l => [{ t: new Date(), text }, ...l]); }
  function mk(name, i, host = false, color) {
    return { id: "p" + i + "_" + Math.random().toString(36).slice(2, 6), name, color: color || PALETTE[i % PALETTE.length], host, agreed: false, entries: [], chips: null, submitted: false, approved: false, out: false };
  }
  const upd = (id, patch) => setPlayers(ps => ps.map(p => p.id === id ? { ...p, ...patch } : p));

  const rate = cfg.chips / cfg.buyIn;
  const inAll = players.reduce((s, p) => s + p.entries.reduce((a, e) => a + e.amount, 0), 0);
  const chipsOut = players.reduce((s, p) => s + p.entries.reduce((a, e) => a + e.chips, 0), 0);
  const counted = players.reduce((s, p) => s + (p.chips ?? 0), 0);
  const drift = counted - chipsOut;
  const allAgreed = players.length > 0 && players.every(p => p.agreed);
  const allFunded = players.length > 0 && players.every(p => p.entries.length > 0);
  const allSubmitted = players.length > 0 && players.every(p => p.submitted);
  const allApproved = players.length > 0 && players.every(p => p.approved);
  const viewer = players.find(p => p.id === me) || players[0];
  const isHost = viewer?.host;

  const nets = useMemo(() => players.map(p => {
    const put = p.entries.reduce((a, e) => a + e.amount, 0);
    const got = (p.chips ?? 0) / rate;
    return { id: p.id, name: p.name, color: p.color, put, got, net: got - put };
  }), [players, rate]);
  const transfers = useMemo(() => simplify(nets), [nets]);

  const hhmm = `${String(Math.floor(elapsed / 3600)).padStart(2, "0")}:${String(Math.floor(elapsed / 60) % 60).padStart(2, "0")}`;
  const gameLive = ["lobby", "fund", "live", "cashout", "reconcile", "settle"].includes(gp);

  function startHost() {
    const host = mk(profile.name, 0, true, profile.color); host.id = "p0";
    setPlayers([host]);
    setMe("p0"); setCfg(c => ({ ...c, cur: profile.currency, scan: null, chips: c.buyIn })); setLog([]); setStarted(null); setElapsed(0);
    setLobbyCode(genCode()); setGp("setup"); setResumeGp(null); setPendingLobby(false); setTab("play");
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

  function finishOpenLobby() {
    upd("p0", { name: profile.name, color: profile.color });
    setGp("lobby");
    setTab("play");
    mkLog(L.tableOpened(M(cfg.buyIn, cfg.cur), cfg.chips.toLocaleString()));
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
      (async () => { setPendingLobby(false); finishOpenLobby(); })();
    }
  }, [pendingLobby, session, dataReady, profile.registered, finishOpenLobby]);

  function addSeatNamed(name, color) { setPlayers(ps => [...ps, mk(name, ps.length, false, color)]); }
  function simulateJoin() {
    const seatedNames = new Set(players.map(p => p.name));
    const pool = friends.filter(f => !seatedNames.has(f.name));
    const g = pool[0];
    const p = mk(g ? g.name : "Guest", players.length, false, g ? g.color : undefined);
    setPlayers(ps => [...ps, p]);
    mkLog(L.joinedLog(p.name));
  }

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
  function backHome() { setGp("home"); setResumeGp(null); setPendingLobby(false); setPlayers([]); setStarted(null); setElapsed(0); setLog([]); }

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

  const showDeviceSwitcher = tab === "play" && gameLive && players.length > 0;

  return (
    <Lang.Provider value={ctx}>
      <div style={{ ...themeVars(t), background: C.ink, minHeight: "100vh", color: C.ivory }}>
        <div className="mx-auto body" style={{ maxWidth: 460, paddingBottom: showDeviceSwitcher ? 90 : 24 }}>
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
              {gp === "lobby" && <Lobby {...{ cfg, players, viewer, upd, allAgreed, setGp, mkLog, lobbyCode, simulateJoin }} />}
              {gp === "fund" && <Fund {...{ cfg, players, viewer, recordEntry, allFunded, setGp, setStarted, mkLog }} />}
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

          {/* device switcher during a live game */}
          {showDeviceSwitcher && (
            <div className="fixed left-0 right-0 mx-auto" style={{ maxWidth: 460, bottom: 16 }}>
              <div className="mx-4 px-3 py-2 rounded-2xl flex items-center gap-2 overflow-x-auto" style={{ background: C.raise + "ee", border: `1px solid ${C.line}`, backdropFilter: "blur(12px)" }}>
                <Eye size={13} style={{ color: C.mute, flexShrink: 0 }} />
                {players.map(p => (
                  <button key={p.id} onClick={() => setMe(p.id)} className="shrink-0 px-2 py-1 rounded-full flex items-center gap-1.5" style={{ background: me === p.id ? p.color + "22" : "transparent", border: `1px solid ${me === p.id ? p.color : "transparent"}` }}>
                    <Dot p={p} size={18} /><span style={{ fontSize: 11, fontWeight: 600, color: me === p.id ? C.ivory : C.mute }}>{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {joinSheet && <JoinSheet onClose={() => setJoinSheet(false)} />}
      </div>
    </Lang.Provider>
  );
}
