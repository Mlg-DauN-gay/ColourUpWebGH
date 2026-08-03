"use client";
import { LogOut, Plus } from "lucide-react";
import { C } from "@/lib/themes";
import { useL } from "@/lib/LangContext";
import { Btn, Dot, Eyebrow, Row } from "./atoms";

export default function Live({ cfg, players, viewer, recordEntry, rate, isHost, markOut, startCashout }) {
  const { L, M } = useL();
  const myIn = viewer.entries.reduce((a, e) => a + e.amount, 0);
  return (
    <div className="space-y-6">
      <div><Eyebrow tone={C.win}>{L.live}</Eyebrow><div className="disp mt-1" style={{ fontSize: 27, fontWeight: 800, letterSpacing: "-.03em" }}>{cfg.title}</div></div>
      <div className="space-y-2">
        {players.map(p => {
          const put = p.entries.reduce((a, e) => a + e.amount, 0);
          return (
            <Row key={p.id}>
              <Dot p={p} />
              <div className="flex-1">
                <div style={{ fontSize: 14, fontWeight: 500 }}>{p.name} {p.out && <span className="mono" style={{ fontSize: 10, color: C.mute }}>{L.leftTag}</span>}</div>
                <div className="mono" style={{ fontSize: 10.5, color: C.mute }}>{L.buyinsChips(p.entries.length, (put * rate).toLocaleString())}</div>
              </div>
              <span className="mono" style={{ fontSize: 13, color: C.ivory }}>{M(put, cfg.cur)}</span>
            </Row>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Btn tone="ghost" full disabled={viewer.entries.length >= cfg.maxRebuys + 1} onClick={() => recordEntry(viewer.id, cfg.buyIn, "re-buy")}><Plus size={14} className="inline -mt-0.5 mr-1" /> {L.rebuy}</Btn>
        <Btn tone="ghost" full disabled={viewer.out} onClick={markOut}><LogOut size={14} className="inline -mt-0.5 mr-1" /> {L.cashEarly}</Btn>
      </div>
      <div className="p-4 rounded-2xl" style={{ background: C.room, border: `1px solid ${C.line}` }}>
        <Eyebrow>{L.exposure(viewer.name)}</Eyebrow>
        <div className="disp mt-1" style={{ fontSize: 24, fontWeight: 800 }}>{M(myIn, cfg.cur)}</div>
        <div className="mono mt-1" style={{ fontSize: 10.5, color: C.mute }}>{L.exposureNoteReceipt}</div>
      </div>
      {isHost ? <Btn full onClick={startCashout}>{L.lastHand}</Btn> : <div className="mono text-center" style={{ fontSize: 11, color: C.mute }}>{L.bankerOnly}</div>}
    </div>
  );
}
