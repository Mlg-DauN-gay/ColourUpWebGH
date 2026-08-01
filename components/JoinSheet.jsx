"use client";
import { useState } from "react";
import { AlertTriangle, Camera, RotateCcw } from "lucide-react";
import { C } from "@/lib/themes";
import { useL } from "@/lib/LangContext";
import { Btn, Eyebrow } from "./atoms";

export default function JoinSheet({ onClose }) {
  const { L } = useL();
  const [code, setCode] = useState("");
  const [state, setState] = useState("idle"); // idle | searching | none
  function tryJoin() { setState("searching"); setTimeout(() => setState("none"), 1400); }
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(6,6,10,.72)" }}>
      <div className="w-full rounded-t-3xl p-5 pb-8" style={{ maxWidth: 460, background: C.sheet, border: `1px solid ${C.line}` }}>
        <div className="mx-auto mb-5" style={{ width: 36, height: 4, borderRadius: 99, background: C.line }} />
        <div className="disp" style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.02em" }}>{L.joinTitle}</div>
        <p className="mt-2" style={{ fontSize: 13, color: C.mute, lineHeight: 1.5 }}>{L.joinBlurb}</p>
        <div className="mt-5 rounded-2xl grid place-items-center" style={{ aspectRatio: "1.5", background: C.room, border: `1px dashed ${C.line}` }}>
          <div className="text-center" style={{ color: C.mute }}><Camera size={26} style={{ margin: "0 auto 8px" }} /><div className="mono" style={{ fontSize: 11 }}>{L.scanFrame}</div></div>
        </div>
        <div className="mt-5"><Eyebrow>{L.enterCodeLabel}</Eyebrow>
          <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="XXXXXX" maxLength={6} className="w-full bg-transparent outline-none mono mt-2 pb-2" style={{ fontSize: 30, fontWeight: 600, letterSpacing: ".22em", color: C.ivory, borderBottom: `1px solid ${C.line}` }} />
        </div>
        {state === "none" && <div className="mono mt-3 flex items-center gap-1.5" style={{ fontSize: 11.5, color: C.lose }}><AlertTriangle size={12} /> {L.noTable}</div>}
        <div className="mt-5">
          <Btn full disabled={code.length < 4 || state === "searching"} onClick={tryJoin}>{state === "searching" ? <><span className="spin inline-block mr-2"><RotateCcw size={14} /></span>{L.lookingFor}</> : L.joinBtn}</Btn>
          <button onClick={onClose} className="w-full mt-3" style={{ fontSize: 12.5, color: C.mute }}>{L.cancel}</button>
        </div>
      </div>
    </div>
  );
}
