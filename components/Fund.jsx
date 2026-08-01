"use client";
import { Check, Wallet } from "lucide-react";
import { C } from "@/lib/themes";
import { useL } from "@/lib/LangContext";
import { Btn, Dot, Eyebrow, Row } from "./atoms";

export default function Fund({ cfg, players, viewer, recordEntry, allFunded, setGp, setStarted, mkLog }) {
  const { L, M } = useL();
  const paid = viewer.entries.length > 0;
  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>{L.stepTwo}</Eyebrow>
        <div className="disp mt-1" style={{ fontSize: 27, fontWeight: 800, letterSpacing: "-.03em" }}>{L.buyInTitle}</div>
        <p className="mt-2" style={{ fontSize: 13.5, color: C.mute, lineHeight: 1.5 }}>{L.fundReceipt}</p>
      </div>
      <div className="space-y-2">
        {players.map(p => (
          <Row key={p.id}>
            <Dot p={p} />
            <span className="flex-1" style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</span>
            {p.entries.length
              ? <span className="mono flex items-center gap-1" style={{ fontSize: 10.5, color: C.win }}><Check size={11} /> {M(cfg.buyIn, cfg.cur)} {L.inTag}</span>
              : <span className="mono" style={{ fontSize: 10.5, color: C.mute }}>{L.unpaid}</span>}
          </Row>
        ))}
      </div>
      {!paid
        ? <Btn full onClick={() => recordEntry(viewer.id, cfg.buyIn, "buy-in")}><Wallet size={15} className="inline -mt-0.5 mr-1.5" /> {L.buyInTitle} · {M(cfg.buyIn, cfg.cur)}</Btn>
        : <Btn full disabled={!allFunded} onClick={() => { setGp("live"); setStarted(Date.now()); mkLog(L.cardsUp); }}>{allFunded ? L.deal : L.waitingBuyins(players.filter(p => !p.entries.length).length)}</Btn>}
    </div>
  );
}
