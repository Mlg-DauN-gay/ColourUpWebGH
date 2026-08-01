"use client";
import { useState } from "react";
import { AlertTriangle, Calculator, Camera, Check, Coins, RotateCcw } from "lucide-react";
import { C } from "@/lib/themes";
import { useL } from "@/lib/LangContext";
import { DENOMS, nearestDenomIndex } from "@/lib/chips";
import { scanChipPhoto } from "@/lib/vision";
import { Btn, Chip, Dot, Eyebrow, Row } from "./atoms";

// Rendered with `key={viewer.id}` by the parent so this local input state
// resets naturally whenever the device switcher picks a different viewer.
export default function Cashout({ cfg, players, viewer, upd, rate, allSubmitted, setGp, mkLog }) {
  const { L, M } = useL();
  const [byDenom, setByDenom] = useState(false);
  const [counts, setCounts] = useState({});
  const [quick, setQuick] = useState(viewer.submitted ? (viewer.chips ?? "") : "");
  const [photoState, setPhotoState] = useState("idle"); // idle | analyzing | done | error
  const denoms = cfg.scan ? cfg.scan.colors.map(c => ({ v: c.denom, c: c.hex, n: c.denom.toLocaleString() })) : DENOMS;
  const denomTotal = denoms.reduce((s, d, i) => s + d.v * (counts[i] || 0), 0);
  const value = byDenom ? denomTotal : (+quick || 0);

  async function onStackPhoto(e) {
    const file = e.target.files?.[0]; if (!file) return;
    setPhotoState("analyzing");
    try {
      const { chips } = await scanChipPhoto(file, "stack");
      const next = {};
      chips.forEach(c => { const idx = nearestDenomIndex(c.hex, denoms); next[idx] = (next[idx] || 0) + Math.max(0, Math.round(+c.count || 0)); });
      if (!Object.keys(next).length) throw new Error("empty");
      setCounts(next); setByDenom(true); setPhotoState("done");
    } catch (err) { setPhotoState("error"); }
  }

  return (
    <div className="space-y-6">
      <div><Eyebrow>{L.stepThree}</Eyebrow><div className="disp mt-1" style={{ fontSize: 27, fontWeight: 800, letterSpacing: "-.03em" }}>{L.countStack}</div>
        <p className="mt-2" style={{ fontSize: 13.5, color: C.mute, lineHeight: 1.5 }}>{L.cashoutBlurb}</p></div>
      {!viewer.submitted && (
        <div className="p-4 rounded-2xl space-y-4" style={{ background: C.raise, border: `1px solid ${C.brassSoft}` }}>
          <span style={{ fontSize: 13, color: C.mute }}>{L.someonesStack(viewer.name)}</span>

          {/* input-mode picker — big buttons */}
          <div className="grid grid-cols-2 gap-2">
            {[["total", L.typeTotal, Calculator, false], ["colour", L.countColour, Coins, true]].map(([k, label, Icon, denomMode]) => (
              <button key={k} onClick={() => setByDenom(denomMode)}
                className="flex flex-col items-center justify-center gap-1.5 rounded-xl py-3.5"
                style={{ background: byDenom === denomMode ? C.brass : C.room, color: byDenom === denomMode ? C.onAccent : C.ivory, border: `1px solid ${byDenom === denomMode ? C.brass : C.line}` }}>
                <Icon size={19} /><span style={{ fontSize: 12.5, fontWeight: 600 }}>{label}</span>
              </button>
            ))}
          </div>

          {/* photo count */}
          <label className="block rounded-xl cursor-pointer" style={{ border: `1px dashed ${photoState === "error" ? C.lose : C.brass}`, background: C.brassSoft }}>
            <input type="file" accept="image/*" capture="environment" onChange={onStackPhoto} style={{ display: "none" }} />
            <div className="flex items-center justify-center gap-2 py-2.5" style={{ color: photoState === "error" ? C.lose : C.brass, fontSize: 12.5, fontWeight: 600 }}>
              {photoState === "analyzing" ? <><span className="spin"><RotateCcw size={14} /></span> {L.countingPhoto}</> : <><Camera size={15} /> {L.photoStack}</>}
            </div>
          </label>
          {photoState === "done" && <div className="mono flex items-start gap-1.5" style={{ fontSize: 11, color: C.win, lineHeight: 1.4 }}><Check size={12} style={{ marginTop: 1, flexShrink: 0 }} /> {L.fromPhoto}</div>}
          {photoState === "error" && <div className="mono flex items-start gap-1.5" style={{ fontSize: 11, color: C.lose, lineHeight: 1.4 }}><AlertTriangle size={12} style={{ marginTop: 1, flexShrink: 0 }} /> {L.photoFailed}</div>}

          {byDenom ? (
            <div className="space-y-2 pt-1">{denoms.map((d, i) => (
              <div key={i} className="flex items-center gap-3">
                <Chip size={22} color={d.c} /><span className="mono flex-1" style={{ fontSize: 12, color: C.mute }}>{d.n}</span>
                <input type="number" value={counts[i] ?? ""} placeholder="0" onChange={e => setCounts({ ...counts, [i]: Math.max(0, +e.target.value || 0) })} className="bg-transparent outline-none text-right mono" style={{ width: 64, fontSize: 16, color: C.ivory, borderBottom: `1px solid ${C.line}` }} />
              </div>))}</div>
          ) : (
            <input type="number" autoFocus value={quick} placeholder="0" onChange={e => setQuick(e.target.value)} className="bg-transparent outline-none w-full mono" style={{ fontSize: 38, fontWeight: 600, color: C.ivory, borderBottom: `1px solid ${C.line}`, paddingBottom: 6 }} />
          )}
          <div className="flex items-baseline justify-between"><span className="mono" style={{ fontSize: 11, color: C.mute }}>{value.toLocaleString()} {L.chipsWord}</span><span className="disp" style={{ fontSize: 20, fontWeight: 800 }}>{M(value / rate, cfg.cur)}</span></div>
          <Btn full disabled={!byDenom && String(quick).trim() === ""} onClick={() => { upd(viewer.id, { chips: value, submitted: true }); mkLog(L.countedLog(viewer.name, value.toLocaleString())); }}>{L.lockStack}</Btn>
        </div>
      )}
      <div className="space-y-2">
        {players.map(p => (
          <Row key={p.id}>
            <Dot p={p} /><span className="flex-1" style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</span>
            {p.submitted ? <span className="mono flex items-center gap-1.5" style={{ fontSize: 11, color: C.win }}><Check size={12} />{p.id === viewer.id ? p.chips.toLocaleString() : L.countedTag}</span> : <span className="mono" style={{ fontSize: 10.5, color: C.mute }}>{L.countingTag}</span>}
          </Row>
        ))}
      </div>
      <Btn full disabled={!allSubmitted} onClick={() => setGp("reconcile")}>{allSubmitted ? L.checkBooks : L.waitingStacks(players.filter(p => !p.submitted).length)}</Btn>
    </div>
  );
}
