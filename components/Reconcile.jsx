"use client";
import { AlertTriangle, Check, Lock, RotateCcw } from "lucide-react";
import { C } from "@/lib/themes";
import { useL } from "@/lib/LangContext";
import { Btn, Dot, Eyebrow, Row } from "./atoms";

// counted/issued come from the aggregate-only reconcile_totals() RPC, not
// from summing players[].chips — individual counts are still RLS-hidden
// from everyone but their own owner at this phase (that's the actual
// "reconciliation without revealing" guarantee from the original spec),
// so the per-player list below shows a "counted" tag for every seat but
// the viewer's own, the same way Cashout's roster already does.
export default function Reconcile({ players, viewer, isHost, totals, startSettle, recount }) {
  const { L } = useL();
  const drift = totals.counted - totals.issued;
  const ok = drift === 0;
  const close = !ok && Math.abs(drift) <= Math.round(totals.issued * 0.005);
  return (
    <div className="space-y-6">
      <div>
        <Eyebrow tone={ok ? C.win : C.lose}>{L.stepFour}</Eyebrow>
        <div className="disp mt-1" style={{ fontSize: 27, fontWeight: 800, letterSpacing: "-.03em" }}>{ok ? L.booksBalance : L.countOff}</div>
        <p className="mt-2" style={{ fontSize: 13.5, color: C.mute, lineHeight: 1.5 }}>{ok ? L.reconOk(totals.counted.toLocaleString(), totals.issued.toLocaleString()) : L.reconBad(totals.counted.toLocaleString(), totals.issued.toLocaleString(), Math.abs(drift).toLocaleString(), drift > 0 ? L.tooMany : L.unaccounted)}</p>
      </div>
      {!ok && (
        <div className="p-3.5 rounded-xl flex gap-3" style={{ background: C.lose + "1e", border: `1px solid ${C.lose}55` }}>
          <AlertTriangle size={16} style={{ color: C.lose, flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12.5, color: C.lose, lineHeight: 1.45, opacity: .95 }}>{close ? L.closeMsg : L.bigGap}</div>
        </div>
      )}
      <div className="space-y-2">
        {players.map(p => (
          <Row key={p.id}>
            <Dot p={p} /><span className="flex-1" style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</span>
            {p.id === viewer.id
              ? <span className="mono" style={{ fontSize: 15, fontWeight: 600, color: ok ? C.ivory : C.sub }}>{(p.chips ?? 0).toLocaleString()}</span>
              : <span className="mono flex items-center gap-1.5" style={{ fontSize: 11, color: C.win }}><Check size={12} /> {L.countedTag}</span>}
          </Row>
        ))}
      </div>
      {ok ? (
        isHost
          ? <Btn full onClick={startSettle}>{L.drawSettle}</Btn>
          : <div className="mono text-center" style={{ fontSize: 11, color: C.mute }}>{L.waitingForHost}</div>
      ) : isHost ? (
        <div className="space-y-3">
          <div className="flex items-start gap-2 px-1" style={{ color: C.mute }}>
            <Lock size={13} style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 11.5, lineHeight: 1.45 }}>{L.reconLocked}</span>
          </div>
          <Btn full onClick={recount}>
            <RotateCcw size={15} className="inline -mt-0.5 mr-1.5" /> {L.recountAll}
          </Btn>
        </div>
      ) : (
        <div className="flex items-start gap-2 px-1" style={{ color: C.mute }}>
          <Lock size={13} style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 11.5, lineHeight: 1.45 }}>{L.reconLocked}</span>
        </div>
      )}
    </div>
  );
}
