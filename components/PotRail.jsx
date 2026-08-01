"use client";
import { C } from "@/lib/themes";
import { useL } from "@/lib/LangContext";
import { Chip, Eyebrow } from "./atoms";
import { DENOMS } from "@/lib/chips";

export default function PotRail({ inAll, chipsOut, counted, gp, cfg, drift }) {
  const { L, M } = useL();
  const counting = ["cashout", "reconcile", "settle", "done"].includes(gp);
  const pct = chipsOut ? Math.min(counted / chipsOut, 1.4) : 0;
  const off = counting && counted > 0 && Math.abs(drift) > 0;
  return (
    <div className="mx-5 mb-5 p-4 rounded-2xl" style={{ background: C.room, border: `1px solid ${C.line}` }}>
      <div className="flex items-end justify-between">
        <div>
          <Eyebrow>{counting ? L.countedIssued : L.inPot}</Eyebrow>
          <div className="disp mt-1" style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-.03em", lineHeight: 1 }}>
            {counting ? <>{counted.toLocaleString()}<span style={{ color: C.mute, fontSize: 18, fontWeight: 500 }}> / {chipsOut.toLocaleString()}</span></> : M(inAll, cfg.cur)}
          </div>
        </div>
        <div className="flex -space-x-2 items-center">{DENOMS.slice(2).map((d, i) => <Chip key={i} size={22} color={d.c} />)}</div>
      </div>
      {counting && (<>
        <div className="mt-3 h-1.5 rounded-full overflow-hidden relative" style={{ background: C.raise }}>
          <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 1) * 100}%`, background: off ? C.lose : C.win, transition: "width .4s ease" }} />
          <div className="absolute top-0 bottom-0" style={{ left: "100%", width: 2, background: C.brass }} />
        </div>
        <div className="mono mt-2" style={{ fontSize: 10.5, color: off ? C.lose : C.mute }}>{counted === 0 ? L.waitingCounts : off ? L.drift(drift) : L.balanced}</div>
      </>)}
    </div>
  );
}
