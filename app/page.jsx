"use client";
import { useEffect, useMemo, useState } from "react";
import { Clock, Eye, Languages, Palette, ScrollText, Spade, User, Users } from "lucide-react";
import { C, PALETTE, THEMES, themeVars } from "@/lib/themes";
import { DICT, money } from "@/lib/i18n";
import { Lang } from "@/lib/LangContext";
import { simplify } from "@/lib/settle";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
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
import FriendsTab from "@/components/FriendsTab";
import ProfileTab from "@/components/ProfileTab";
import JoinSheet from "@/components/JoinSheet";

const LS_PROFILE = "colourup:profile";
const LS_FRIENDS = "colourup:friends";
const LS_HISTORY = "colourup:history";

const DEFAULT_PROFILE = { registered: false, name: "You", handle: "@you", currency: "₸", color: PALETTE[3] };
const DEFAULT_FRIENDS = [
  { id: "f1", name: "Nadia", handle: "@nads", color: PALETTE[1], together: 6 },
  { id: "f2", name: "Tom", handle: "@tomcat", color: PALETTE[2], together: 4 },
  { id: "f3", name: "Priya", handle: "@priya", color: PALETTE[4], together: 9 },
  { id: "f4", name: "Sanzhar", handle: "@sanya", color: PALETTE[0], together: 2 },
];
// Fixed timestamps (not Date.now()-relative) — a module-scope Date.now() call
// only evaluates once per server process, so it would drift from the
// client's Date.now() and trip a hydration mismatch on a long-lived server.
const DEFAULT_HISTORY = [
  { id: "h1", title: "Kitchen table", date: new Date("2026-07-29T18:31:00").getTime(), cur: "₸", meNet: 14500, players: 5, duration: 12600 },
  { id: "h2", title: "Late night", date: new Date("2026-07-23T18:31:00").getTime(), cur: "₸", meNet: -6000, players: 4, duration: 9000 },
];

const genCode = () => Array.from({ length: 6 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");

export default function ColourUpPage() {
  const [themeKey, setThemeKey] = useState("trust");
  const [lang, setLang] = useState("en");
  const L = DICT[lang];
  const M = (n, cur) => money(n, cur, lang);
  const t = THEMES[themeKey];

  const [tab, setTab] = useState("play");

  // profile + social — persisted to localStorage, SSR-safe via useSyncExternalStore
  const [profile, setProfile] = useLocalStorageState(LS_PROFILE, DEFAULT_PROFILE);
  const [friends, setFriends] = useLocalStorageState(LS_FRIENDS, DEFAULT_FRIENDS);
  const [history, setHistory] = useLocalStorageState(LS_HISTORY, DEFAULT_HISTORY);

  // game engine
  const [gp, setGp] = useState("home"); // home | setup | lobby | fund | live | cashout | reconcile | settle | done
  const [cfg, setCfg] = useState({ title: DICT.en.thu, cur: profile.currency, buyIn: 5000, chips: 5000, scan: null, maxRebuys: 3 });
  const [players, setPlayers] = useState([]);
  const [me, setMe] = useState("p0");
  const [log, setLog] = useState([]);
  const [started, setStarted] = useState(null);
  const [lobbyCode, setLobbyCode] = useState("");
  const [joinSheet, setJoinSheet] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [elapsed, setElapsed] = useState(0);

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
    setLobbyCode(genCode()); setGp("setup"); setTab("play");
  }

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
  function backHome() { setGp("home"); setPlayers([]); setStarted(null); setElapsed(0); setLog([]); }

  const ctx = { L, lang, M };

  return (
    <Lang.Provider value={ctx}>
      <div style={{ ...themeVars(t), background: C.ink, minHeight: "100vh", color: C.ivory }}>
        <div className="mx-auto body" style={{ maxWidth: 460, paddingBottom: 108 }}>
          {/* header */}
          <div className="flex items-center justify-between px-5 pt-6 pb-4">
            <div className="flex items-center gap-2">
              <Chip size={20} color={C.gold} />
              <span className="disp" style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-.02em" }}>{L.brand}</span>
            </div>
            <div className="flex items-center gap-2.5">
              {started && gameLive && <span className="mono flex items-center gap-1" style={{ fontSize: 11, color: C.mute }}><Clock size={11} /> {hhmm}</span>}
              <div className="relative">
                <button onClick={() => setShowThemes(s => !s)} className="grid place-items-center rounded-full" style={{ width: 28, height: 28, border: `1px solid ${C.line}`, background: showThemes ? C.raise : C.room }} aria-label="Palette">
                  <Palette size={14} style={{ color: C.brass }} />
                </button>
                {showThemes && (
                  <div className="absolute right-0 mt-2 p-2 rounded-2xl z-40 flex gap-2" style={{ background: C.sheet, border: `1px solid ${C.line}` }}>
                    {Object.entries(THEMES).map(([k, th]) => (
                      <button key={k} onClick={() => { setThemeKey(k); setShowThemes(false); }} className="rounded-xl p-1.5 flex gap-1" style={{ border: `1px solid ${k === themeKey ? th.swatch[1] : "transparent"}`, background: th.swatch[0] }} aria-label={th.name[lang]}>
                        {th.swatch.map((c, i) => <span key={i} style={{ width: 14, height: 22, borderRadius: 4, background: c }} />)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => setLang(l => l === "en" ? "ru" : "en")} className="flex items-center gap-1 rounded-full px-2 py-1" style={{ border: `1px solid ${C.line}`, background: C.room, height: 28 }} aria-label="Language">
                <Languages size={13} style={{ color: C.brass }} />
                <span className="mono" style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: ".06em" }}>
                  <span style={{ color: lang === "en" ? C.ivory : C.mute }}>EN</span>
                  <span style={{ color: C.line, margin: "0 3px" }}>/</span>
                  <span style={{ color: lang === "ru" ? C.ivory : C.mute }}>RU</span>
                </span>
              </button>
              <button onClick={() => setShowLog(s => !s)} style={{ color: showLog ? C.brass : C.mute }} aria-label="Ledger"><ScrollText size={16} /></button>
            </div>
          </div>

          {tab === "play" && (["cashout", "reconcile", "settle", "done"].includes(gp) || inAll > 0) && <PotRail {...{ inAll, chipsOut, counted, gp, cfg, drift }} />}
          {showLog && <LedgerPanel log={log} />}

          <div className="px-5">
            {tab === "play" && (<>
              {gp === "home" && <PlayHome {...{ profile, history, gameLive, startHost, setJoinSheet, setGp, setTab }} />}
              {gp === "setup" && <Setup {...{ cfg, setCfg, players, setGp, mkLog }} />}
              {gp === "lobby" && <Lobby {...{ cfg, players, viewer, upd, allAgreed, setGp, mkLog, lobbyCode, simulateJoin }} />}
              {gp === "fund" && <Fund {...{ cfg, players, viewer, recordEntry, allFunded, setGp, setStarted, mkLog }} />}
              {gp === "live" && <Live {...{ cfg, players, viewer, recordEntry, rate, isHost, upd, mkLog, setGp }} />}
              {gp === "cashout" && <Cashout key={viewer.id} {...{ cfg, players, viewer, upd, rate, allSubmitted, setGp, mkLog }} />}
              {gp === "reconcile" && <Reconcile {...{ players, upd, drift, chipsOut, counted, setGp, mkLog }} />}
              {gp === "settle" && <Settle {...{ cfg, nets, transfers, players, viewer, upd, allApproved, release }} />}
              {gp === "done" && <Done {...{ cfg, nets, transfers, elapsed, backHome, players }} />}
            </>)}
            {tab === "friends" && <FriendsTab {...{ friends, setFriends, mkLog, gameLive, addSeatNamed }} />}
            {tab === "profile" && <ProfileTab {...{ profile, setProfile, history, themeKey, setThemeKey, lang, setLang }} />}
          </div>

          {/* device switcher during a live game */}
          {tab === "play" && gameLive && players.length > 0 && (
            <div className="fixed left-0 right-0 mx-auto" style={{ maxWidth: 460, bottom: 68 }}>
              <div className="mx-4 mb-2 px-3 py-2 rounded-2xl flex items-center gap-2 overflow-x-auto" style={{ background: C.raise + "ee", border: `1px solid ${C.line}`, backdropFilter: "blur(12px)" }}>
                <Eye size={13} style={{ color: C.mute, flexShrink: 0 }} />
                {players.map(p => (
                  <button key={p.id} onClick={() => setMe(p.id)} className="shrink-0 px-2 py-1 rounded-full flex items-center gap-1.5" style={{ background: me === p.id ? p.color + "22" : "transparent", border: `1px solid ${me === p.id ? p.color : "transparent"}` }}>
                    <Dot p={p} size={18} /><span style={{ fontSize: 11, fontWeight: 600, color: me === p.id ? C.ivory : C.mute }}>{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* bottom tab bar */}
          <div className="fixed left-0 right-0 bottom-0 mx-auto" style={{ maxWidth: 460 }}>
            <div className="flex" style={{ background: C.sheet + "f2", borderTop: `1px solid ${C.line}`, backdropFilter: "blur(12px)" }}>
              {[["play", L.tabPlay, Spade], ["friends", L.tabFriends, Users], ["profile", L.tabYou, User]].map(([k, label, Icon]) => (
                <button key={k} onClick={() => setTab(k)} className="flex-1 flex flex-col items-center gap-1 py-2.5" style={{ color: tab === k ? C.brass : C.mute }}>
                  <Icon size={19} fill={tab === k && k === "play" ? C.brass : "none"} />
                  <span style={{ fontSize: 10.5, fontWeight: 600 }}>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {joinSheet && <JoinSheet onClose={() => setJoinSheet(false)} />}
      </div>
    </Lang.Provider>
  );
}
