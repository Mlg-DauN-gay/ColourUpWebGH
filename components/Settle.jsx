"use client";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { C } from "@/lib/themes";
import { useL } from "@/lib/LangContext";
import { Btn, Dot, Eyebrow, Row } from "./atoms";

export default function Settle({ cfg, nets, transfers, players, viewer, upd, allApproved, release }) {
  const { L, M } = useL();
  const sorted = [...nets].sort((a, b) => b.net - a.net);
  const naive = players.length * (players.length - 1) / 2;
  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>{L.stepFive}</Eyebrow>
        <div className="disp mt-1" style={{ fontSize: 27, fontWeight: 800, letterSpacing: "-.03em" }}>{L.settleUp}</div>
        <p className="mt-2" style={{ fontSize: 13.5, color: C.mute, lineHeight: 1.5 }}>{L.settleReceipt(L.transferN(transfers.length), L.paymentN(naive))}</p>
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
        <div className="flex px-4 py-2" style={{ background: C.raise }}>
          <span className="mono flex-1" style={{ fontSize: 9.5, color: C.mute, letterSpacing: ".12em" }}>{L.colSeat}</span>
          <span className="mono" style={{ fontSize: 9.5, color: C.mute, letterSpacing: ".12em", width: 62, textAlign: "right" }}>{L.colIn}</span>
          <span className="mono" style={{ fontSize: 9.5, color: C.mute, letterSpacing: ".12em", width: 62, textAlign: "right" }}>{L.colOut}</span>
          <span className="mono" style={{ fontSize: 9.5, color: C.mute, letterSpacing: ".12em", width: 72, textAlign: "right" }}>{L.colNet}</span>
        </div>
        {sorted.map(n => (
          <div key={n.id} className="flex items-center px-4 py-3" style={{ background: C.room, borderTop: `1px solid ${C.line}` }}>
            <span className="flex-1 flex items-center gap-2" style={{ fontSize: 13.5, fontWeight: 500 }}><span style={{ width: 6, height: 6, borderRadius: 99, background: n.color }} />{n.name}</span>
            <span className="mono" style={{ fontSize: 12, color: C.mute, width: 62, textAlign: "right" }}>{M(n.put, cfg.cur)}</span>
            <span className="mono" style={{ fontSize: 12, color: C.mute, width: 62, textAlign: "right" }}>{M(n.got, cfg.cur)}</span>
            <span className="mono" style={{ fontSize: 13.5, fontWeight: 600, width: 72, textAlign: "right", color: n.net >= 0 ? C.win : C.lose }}>{n.net >= 0 ? "+" : "−"}{M(n.net, cfg.cur)}</span>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <Eyebrow>{L.transfers}</Eyebrow>
        {transfers.map((t, i) => (
          <Row key={i}><span style={{ fontSize: 13.5, fontWeight: 500 }}>{t.from.name}</span><ArrowRight size={13} style={{ color: C.mute }} /><span style={{ fontSize: 13.5, fontWeight: 500 }}>{t.to.name}</span><span className="mono flex-1 text-right" style={{ fontSize: 13.5, color: C.brass }}>{M(t.amount, cfg.cur)}</span></Row>
        ))}
        {!transfers.length && <div className="mono" style={{ fontSize: 11, color: C.mute }}>{L.allLevel}</div>}
      </div>
      <div className="space-y-2">
        <Eyebrow>{L.signoff}</Eyebrow>
        {players.map(p => (
          <Row key={p.id}><Dot p={p} /><span className="flex-1" style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</span>{p.approved ? <span className="mono flex items-center gap-1" style={{ fontSize: 10.5, color: C.win }}><Check size={12} /> {L.signed}</span> : <span className="mono" style={{ fontSize: 10.5, color: C.mute }}>{L.pending}</span>}</Row>
        ))}
      </div>
      {!viewer.approved
        ? <Btn full onClick={() => upd(viewer.id, { approved: true })}><ShieldCheck size={15} className="inline -mt-0.5 mr-1.5" /> {L.thisRight(viewer.name)}</Btn>
        : <Btn full disabled={!allApproved} onClick={release}>{allApproved ? L.finaliseReceipt : L.waitingSigs(players.filter(p => !p.approved).length)}</Btn>}
    </div>
  );
}
