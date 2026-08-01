"use client";
import { C } from "@/lib/themes";
import { DICT } from "@/lib/i18n";
import { useL } from "@/lib/LangContext";
import { Eyebrow } from "./atoms";

export default function LedgerPanel({ log }) {
  const { L, lang } = useL();
  return (
    <div className="mx-5 mb-5 p-4 rounded-2xl" style={{ background: C.room, border: `1px solid ${C.line}` }}>
      <Eyebrow>{L.ledger}</Eyebrow>
      <div className="mt-3 space-y-2" style={{ maxHeight: 180, overflowY: "auto" }}>
        {log.length === 0 && <div className="mono" style={{ fontSize: 11, color: C.mute }}>{L.nothingYet}</div>}
        {log.map((l, i) => (
          <div key={i} className="mono flex gap-3" style={{ fontSize: 11, color: C.mute }}>
            <span style={{ color: C.line, flexShrink: 0 }}>{l.t.toLocaleTimeString(DICT[lang]._loc, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
            <span style={{ color: C.sub }}>{l.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
