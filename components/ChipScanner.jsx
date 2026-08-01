"use client";
import { useMemo, useState } from "react";
import { AlertTriangle, Camera, Plus, RotateCcw, X } from "lucide-react";
import { C, PALETTE } from "@/lib/themes";
import { useL } from "@/lib/LangContext";
import { LADDER, assignDenoms, computeStacks, normHex } from "@/lib/chips";
import { scanChipPhoto } from "@/lib/vision";
import { Btn, Eyebrow } from "./atoms";

export default function ChipScanner({ P, onClose, onApply }) {
  const { L } = useL();
  const [state, setState] = useState("idle"); // idle | analyzing | done | error
  const [preview, setPreview] = useState(null);
  const [colors, setColors] = useState([]);
  const [np, setNp] = useState(Math.max(P || 6, 2));

  const { per, stackValue } = useMemo(() => computeStacks(colors, np), [colors, np]);

  async function onFile(e) {
    const file = e.target.files?.[0]; if (!file) return;
    setState("analyzing");
    try {
      const { chips, preview: dataUrl } = await scanChipPhoto(file, "chipset");
      setPreview(dataUrl);
      let cols = chips.map((c, i) => ({
        name: c.color || `Colour ${i + 1}`, hex: normHex(c.hex) || PALETTE[i % PALETTE.length],
        count: Math.max(0, Math.round(+c.count || 0)), denom: 1,
      })).slice(0, 7);
      if (!cols.length) throw new Error("empty");
      setColors(assignDenoms(cols)); setState("done");
    } catch (err) {
      const reader = new FileReader();
      reader.onload = () => setPreview(String(reader.result));
      reader.readAsDataURL(file);
      setColors(assignDenoms([
        { name: "White", hex: "#DDD5C6", count: 100, denom: 1 },
        { name: "Red", hex: "#B33A3A", count: 100, denom: 1 },
        { name: "Green", hex: "#3E8A5F", count: 50, denom: 1 },
        { name: "Black", hex: "#22222A", count: 25, denom: 1 },
      ]));
      setState("error");
    }
  }

  const cycleDenom = (i) => setColors(cs => cs.map((c, j) => j === i ? { ...c, denom: LADDER[(LADDER.indexOf(c.denom) + 1) % LADDER.length] } : c));
  const setCount = (i, v) => setColors(cs => cs.map((c, j) => j === i ? { ...c, count: Math.max(0, v) } : c));
  const addColour = () => setColors(cs => [...cs, { name: "Colour", hex: PALETTE[cs.length % PALETTE.length], count: 0, denom: LADDER[Math.min(cs.length, LADDER.length - 1)] }]);
  const removeColour = (i) => setColors(cs => cs.filter((_, j) => j !== i));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(6,6,10,.75)" }}>
      <div className="w-full rounded-t-3xl p-5 pb-8" style={{ maxWidth: 460, maxHeight: "92vh", overflowY: "auto", background: C.sheet, border: `1px solid ${C.line}` }}>
        <div className="mx-auto mb-4" style={{ width: 36, height: 4, borderRadius: 99, background: C.line }} />
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-3">
            <div className="disp" style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.02em" }}>{L.scanTitle}</div>
            <p className="mt-1.5" style={{ fontSize: 12.5, color: C.mute, lineHeight: 1.5 }}>{L.scanBlurb}</p>
          </div>
          <button onClick={onClose} style={{ color: C.mute }}><X size={18} /></button>
        </div>

        {/* photo area */}
        <label className="block mt-4 rounded-2xl overflow-hidden cursor-pointer" style={{ border: `1px dashed ${C.line}` }}>
          <input type="file" accept="image/*" capture="environment" onChange={onFile} style={{ display: "none" }} />
          {preview ? (
            <div className="relative">
              <img src={preview} alt="chips" style={{ width: "100%", maxHeight: 180, objectFit: "cover", display: "block", opacity: state === "analyzing" ? 0.5 : 1 }} />
              {state === "analyzing" && (
                <div className="absolute inset-0 grid place-items-center">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-full" style={{ background: C.sheet + "d9", color: C.brass, fontSize: 12, fontWeight: 600 }}>
                    <span className="spin"><RotateCcw size={13} /></span> {L.analyzing}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid place-items-center py-8" style={{ color: C.mute }}>
              <Camera size={26} /><div className="mt-2" style={{ fontSize: 12.5, fontWeight: 600 }}>{L.takePhoto}</div>
            </div>
          )}
        </label>

        {state === "error" && <div className="mono mt-3 flex items-start gap-1.5" style={{ fontSize: 11.5, color: C.lose, lineHeight: 1.4 }}><AlertTriangle size={12} style={{ marginTop: 1, flexShrink: 0 }} /> {L.scanFailed}</div>}

        {colors.length > 0 && (<>
          <div className="flex items-center justify-between mt-5 mb-3 p-3 rounded-xl" style={{ background: C.raise, border: `1px solid ${C.line}` }}>
            <span style={{ fontSize: 12.5, fontWeight: 600 }}>{L.forPlayers(np)}</span>
            <div className="flex items-center gap-3">
              <button onClick={() => setNp(n => Math.max(2, n - 1))} className="grid place-items-center rounded-full" style={{ width: 28, height: 28, background: C.room, border: `1px solid ${C.line}`, color: C.ivory }}>−</button>
              <span className="mono" style={{ fontSize: 16, fontWeight: 700, minWidth: 18, textAlign: "center" }}>{np}</span>
              <button onClick={() => setNp(n => Math.min(12, n + 1))} className="grid place-items-center rounded-full" style={{ width: 28, height: 28, background: C.room, border: `1px solid ${C.line}`, color: C.ivory }}>+</button>
            </div>
          </div>
          <div className="flex items-center justify-between mb-2">
            <Eyebrow>{L.detected}</Eyebrow>
            <button onClick={addColour} className="flex items-center gap-1" style={{ fontSize: 11.5, fontWeight: 600, color: C.brass }}><Plus size={12} /> {L.addColour}</button>
          </div>
          <div className="grid grid-cols-[auto_1fr_auto_auto] gap-x-2 gap-y-1 items-center mb-1">
            <span /><span className="mono" style={{ fontSize: 9, color: C.mute, letterSpacing: ".1em" }}>{L.countLabel.toUpperCase()}</span>
            <span className="mono text-right" style={{ fontSize: 9, color: C.mute, letterSpacing: ".1em" }}>{L.worth.toUpperCase()}</span>
            <span className="mono text-right pr-1" style={{ fontSize: 9, color: C.mute, letterSpacing: ".1em" }}>{L.perPlayerCol.toUpperCase()}</span>
          </div>
          <div className="space-y-1.5">
            {colors.map((c, i) => {
              const short = c.count < np;
              return (
                <div key={i} className="grid grid-cols-[auto_1fr_auto_auto] gap-x-2 items-center rounded-xl px-2.5 py-2" style={{ background: C.room, border: `1px solid ${C.line}` }}>
                  <span className="rounded-full" style={{ width: 22, height: 22, background: c.hex, border: `1.5px solid rgba(255,255,255,.15)` }} />
                  <div className="flex items-center gap-1.5 min-w-0">
                    <input type="number" value={c.count} onChange={e => setCount(i, +e.target.value || 0)} className="bg-transparent outline-none mono" style={{ width: 52, fontSize: 15, color: C.ivory, borderBottom: `1px solid ${C.line}` }} />
                    <button onClick={() => removeColour(i)} style={{ color: C.mute, opacity: .6 }}><X size={12} /></button>
                  </div>
                  <button onClick={() => cycleDenom(i)} title={L.tapValue} className="mono rounded-lg px-2 py-1" style={{ fontSize: 13, fontWeight: 600, color: C.brass, background: C.raise, border: `1px solid ${C.line}`, minWidth: 52, textAlign: "center" }}>{c.denom.toLocaleString()}</button>
                  <span className="mono text-right pr-1" style={{ fontSize: 13, fontWeight: 600, width: 48, color: short ? C.lose : C.ivory }}>{short ? L.notEnough(np) : `×${per[i]}`}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-end justify-between mt-4 p-3.5 rounded-xl" style={{ background: C.raise, border: `1px solid ${C.brassSoft}` }}>
            <div><Eyebrow>{L.stackWorth}</Eyebrow><div className="mono" style={{ fontSize: 10.5, color: C.brass, marginTop: 3 }}>{L.equalsBuyin}</div></div>
            <div className="disp" style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-.02em" }}>{stackValue.toLocaleString()}</div>
          </div>

          <div className="mt-4"><Btn full disabled={stackValue <= 0} onClick={() => onApply({ colors: colors.map((c, i) => ({ name: c.name, hex: c.hex, denom: c.denom, count: c.count, perPlayer: per[i] })), stackValue })}>{L.useSetup}</Btn></div>
        </>)}
      </div>
    </div>
  );
}
