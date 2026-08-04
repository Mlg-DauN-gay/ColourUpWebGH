"use client";
import { ChevronRight, Info, Plus, QrCode, Spade } from "lucide-react";
import { C } from "@/lib/themes";
import { useL } from "@/lib/LangContext";
import { Chip, Eyebrow } from "./atoms";
import HistoryRow from "./HistoryRow";

export default function PlayHome({ profile, history, resumeGp, resumeTable, startHost, setJoinSheet, setTab, lastCfg, M, openIntro }) {
  const { L } = useL();
  const recent = history.slice(0, 3);
  return (
    <div className="space-y-6">
      {/* Welcome — the app's whole promise stated plainly, right where a
          first-time visitor lands, not buried in a dismissible sheet. */}
      <div className="relative overflow-hidden rounded-3xl px-5 pt-7 pb-6 text-center"
        style={{ background: `radial-gradient(120% 90% at 50% -10%, ${C.brassSoft}, transparent 65%), ${C.felt}`, border: `1px solid ${C.line}` }}>
        <div className="flex justify-center mb-3"><Chip size={34} color={C.gold} /></div>
        <div className="disp" style={{ fontSize: 25, fontWeight: 800, letterSpacing: "-.03em", lineHeight: 1.1 }}>{L.homeHi(profile.name)}</div>
        <p className="mx-auto mt-2.5" style={{ fontSize: 13, color: C.sub, lineHeight: 1.55, maxWidth: 300 }}>{L.homeSub}</p>
        {openIntro && (
          <button onClick={openIntro} className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-full" style={{ background: C.brass, color: C.onAccent }}>
            <Info size={14} />
            <span style={{ fontSize: 13, fontWeight: 700 }}>{L.introReopen}</span>
          </button>
        )}
      </div>

      {resumeGp && (
        <button onClick={resumeTable} className="w-full text-left p-4 rounded-2xl flex items-center gap-3" style={{ background: C.brassSoft, border: `1px solid ${C.brass}` }}>
          <span className="grid place-items-center rounded-full" style={{ width: 38, height: 38, background: C.brass, color: C.onAccent }}><Spade size={18} /></span>
          <div className="flex-1"><div style={{ fontSize: 14.5, fontWeight: 700 }}>{L.resume}</div><div className="mono" style={{ fontSize: 11, color: C.mute }}>{L.resumeSub(profile.name)}</div></div>
          <ChevronRight size={18} style={{ color: C.brass }} />
        </button>
      )}

      {/* Host / Join — the two things you actually came here to do, sized
          like actions, not billboards. Host leads (filled) since it's the
          more common entry point; Join is the secondary, quieter twin. */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={startHost} aria-label={L.hostGameSub} className="flex flex-col items-center justify-center gap-2.5 py-6 rounded-2xl" style={{ background: C.brass, color: C.onAccent }}>
          <Plus size={30} />
          <div className="disp" style={{ fontSize: 15.5, fontWeight: 800, letterSpacing: "-.01em" }}>{L.hostGame}</div>
        </button>
        <button onClick={() => setJoinSheet(true)} aria-label={L.joinGameSub} className="flex flex-col items-center justify-center gap-2.5 py-6 rounded-2xl" style={{ background: C.room, border: `1px solid ${C.line}` }}>
          <QrCode size={30} style={{ color: C.brass }} />
          <div className="disp" style={{ fontSize: 15.5, fontWeight: 800, letterSpacing: "-.01em" }}>{L.joinGame}</div>
        </button>
      </div>

      {!resumeGp && lastCfg?.title && (
        <button onClick={startHost} className="w-full text-left p-3 rounded-2xl flex items-center gap-3" style={{ background: "transparent", border: `1px dashed ${C.line}` }}>
          <span className="grid place-items-center rounded-full shrink-0" style={{ width: 26, height: 26, background: C.brassSoft, color: C.brass }}><Plus size={12} /></span>
          <div className="flex-1 min-w-0">
            <div style={{ fontSize: 12, fontWeight: 600, color: C.ivory }}>{L.rehostTitle}</div>
            <div className="figure truncate" style={{ fontSize: 10.5, color: C.mute }}>{lastCfg.title} · {M ? M(lastCfg.buyIn, lastCfg.cur) : `${lastCfg.buyIn}${lastCfg.cur}`}</div>
          </div>
          <ChevronRight size={14} style={{ color: C.mute, flexShrink: 0 }} />
        </button>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <Eyebrow>{L.recent}</Eyebrow>
          {history.length > 0 && <button onClick={() => setTab("profile")} className="mono" style={{ fontSize: 11, color: C.brass }}>{L.historyTitle} →</button>}
        </div>
        {recent.length === 0
          ? <div className="mono px-4 py-6 rounded-xl text-center" style={{ fontSize: 12, color: C.mute, background: C.room }}>{L.noHistoryHome}</div>
          : <div className="space-y-2">{recent.map(h => <HistoryRow key={h.id} h={h} />)}</div>}
      </div>
    </div>
  );
}
