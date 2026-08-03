"use client";
import { ChevronRight, Plus, QrCode, Spade } from "lucide-react";
import { C } from "@/lib/themes";
import { useL } from "@/lib/LangContext";
import { Eyebrow } from "./atoms";
import HistoryRow from "./HistoryRow";

export default function PlayHome({ profile, history, resumeGp, resumeTable, startHost, setJoinSheet, setTab, lastCfg, M, openIntro }) {
  const { L } = useL();
  const recent = history.slice(0, 3);
  return (
    <div className="space-y-6">
      <div>
        <div className="disp" style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-.035em", lineHeight: 1.05 }}>{L.homeHi(profile.name)}</div>
        <div className="flex items-center justify-between mt-2 gap-3">
          <p style={{ fontSize: 13.5, color: C.mute, lineHeight: 1.5 }}>{L.homeSub}</p>
          {openIntro && <button onClick={openIntro} className="shrink-0 mono" style={{ fontSize: 11, color: C.brass, whiteSpace: "nowrap" }}>{L.introReopen}</button>}
        </div>
      </div>

      {!resumeGp && lastCfg?.title && (
        <button onClick={startHost} className="w-full text-left p-3.5 rounded-2xl flex items-center gap-3" style={{ background: C.raise, border: `1px dashed ${C.line}` }}>
          <span className="grid place-items-center rounded-full shrink-0" style={{ width: 30, height: 30, background: C.brassSoft, color: C.brass }}><Plus size={14} /></span>
          <div className="flex-1 min-w-0">
            <div style={{ fontSize: 12.5, fontWeight: 600, color: C.ivory }}>{L.rehostTitle}</div>
            <div className="figure truncate" style={{ fontSize: 11, color: C.mute }}>{lastCfg.title} · {M ? M(lastCfg.buyIn, lastCfg.cur) : `${lastCfg.buyIn}${lastCfg.cur}`}</div>
          </div>
          <ChevronRight size={16} style={{ color: C.mute, flexShrink: 0 }} />
        </button>
      )}

      {resumeGp && (
        <button onClick={resumeTable} className="w-full text-left p-4 rounded-2xl flex items-center gap-3" style={{ background: C.brassSoft, border: `1px solid ${C.brass}` }}>
          <span className="grid place-items-center rounded-full" style={{ width: 38, height: 38, background: C.brass, color: C.onAccent }}><Spade size={18} /></span>
          <div className="flex-1"><div style={{ fontSize: 14.5, fontWeight: 700 }}>{L.resume}</div><div className="mono" style={{ fontSize: 11, color: C.mute }}>{L.resumeSub(profile.name)}</div></div>
          <ChevronRight size={18} style={{ color: C.brass }} />
        </button>
      )}

      <div className="grid gap-3">
        <button onClick={startHost} className="text-left p-5 rounded-2xl" style={{ background: C.room, border: `1px solid ${C.line}` }}>
          <div className="flex items-center justify-between mb-3">
            <span className="grid place-items-center rounded-xl" style={{ width: 40, height: 40, background: C.brass, color: C.onAccent }}><Plus size={20} /></span>
            <ChevronRight size={18} style={{ color: C.mute }} />
          </div>
          <div className="disp" style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-.02em" }}>{L.hostGame}</div>
          <div style={{ fontSize: 12.5, color: C.mute, marginTop: 2 }}>{L.hostGameSub}</div>
        </button>
        <button onClick={() => setJoinSheet(true)} className="text-left p-5 rounded-2xl" style={{ background: C.room, border: `1px solid ${C.line}` }}>
          <div className="flex items-center justify-between mb-3">
            <span className="grid place-items-center rounded-xl" style={{ width: 40, height: 40, background: C.raise, color: C.brass, border: `1px solid ${C.line}` }}><QrCode size={20} /></span>
            <ChevronRight size={18} style={{ color: C.mute }} />
          </div>
          <div className="disp" style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-.02em" }}>{L.joinGame}</div>
          <div style={{ fontSize: 12.5, color: C.mute, marginTop: 2 }}>{L.joinGameSub}</div>
        </button>
      </div>

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
