"use client";
import { Layers, ShieldCheck, ScrollText, UserPlus } from "lucide-react";
import { C } from "@/lib/themes";
import { useL } from "@/lib/LangContext";
import { Btn, Chip } from "./atoms";

const STEPS = [
  { icon: UserPlus, titleKey: "introStep1", subKey: "introStep1Sub" },
  { icon: Layers, titleKey: "introStep2", subKey: "introStep2Sub" },
  { icon: ShieldCheck, titleKey: "introStep3", subKey: "introStep3Sub" },
  { icon: ScrollText, titleKey: "introStep4", subKey: "introStep4Sub" },
];

// The skippable first-run explainer — the flow, in four honest steps, plus
// the receipt-only promise stated plainly. One dismiss action; "skippable"
// means nothing here is a gate, not that there are two ways to close it.
export default function Intro({ onClose }) {
  const { L } = useL();
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(10,7,4,.72)" }} role="dialog" aria-modal="true" aria-labelledby="intro-title">
      <div className="w-full rounded-t-3xl p-6 space-y-5" style={{ maxWidth: 460, background: C.felt, border: `1px solid ${C.line}`, borderBottom: "none" }}>
        <div className="flex justify-center"><Chip size={32} color={C.gold} /></div>
        <div id="intro-title" className="disp text-center" style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-.02em" }}>{L.introTitle}</div>

        <div className="space-y-3">
          {STEPS.map(({ icon: Icon, titleKey, subKey }, i) => (
            <div key={titleKey} className="flex items-start gap-3">
              <span className="shrink-0 grid place-items-center rounded-full" style={{ width: 32, height: 32, background: C.raise, border: `1px solid ${C.line}`, color: C.brass }}><Icon size={15} /></span>
              <div className="pt-1">
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{L[titleKey]}</div>
                <div style={{ fontSize: 12, color: C.mute, marginTop: 1, lineHeight: 1.4 }}>{L[subKey]}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3.5 rounded-xl" style={{ background: C.raise, border: `1px solid ${C.brassSoft}` }}>
          <p style={{ fontSize: 12, color: C.sub, lineHeight: 1.5 }}>{L.introPromise}</p>
        </div>

        <Btn full onClick={onClose}>{L.introCta}</Btn>
      </div>
    </div>
  );
}
