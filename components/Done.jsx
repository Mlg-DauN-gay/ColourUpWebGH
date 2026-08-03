"use client";
import { ArrowRight, Receipt, RotateCcw } from "lucide-react";
import { C } from "@/lib/themes";
import { useL } from "@/lib/LangContext";
import { Btn, Chip, Eyebrow } from "./atoms";

export default function Done({ cfg, nets, transfers, elapsed, backHome, players }) {
  const { L, M } = useL();
  const sorted = [...nets].sort((a, b) => b.net - a.net);
  const top = sorted[0]; const hrs = Math.max(elapsed / 3600, 0.01);
  const pot = nets.reduce((s, n) => s + n.put, 0);
  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <div className="flex justify-center mb-4"><Chip size={44} color={C.gold} /></div>
        <div className="disp" style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-.03em" }}>{L.settled}</div>
        <p className="mt-1.5" style={{ fontSize: 13, color: C.mute }}>{cfg.title} · {L.throughTable(M(pot, cfg.cur))}</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[[L.length, `${Math.floor(elapsed / 3600)}h ${Math.floor(elapsed / 60) % 60}m`], [L.biggestWin, `+${M(top.net, cfg.cur)}`], [L.seatsWord, players.length]].map(([k, v]) => (
          <div key={k} className="p-3 rounded-xl text-center" style={{ background: C.room, border: `1px solid ${C.line}` }}><Eyebrow>{k}</Eyebrow><div className="mono mt-1.5" style={{ fontSize: 14, fontWeight: 600 }}>{v}</div></div>
        ))}
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
        <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: C.raise }}><Receipt size={13} style={{ color: C.gold }} /><Eyebrow tone={C.gold}>{L.receipt}</Eyebrow></div>
        {sorted.map(n => (
          <div key={n.id} className="px-4 py-3 flex items-center" style={{ background: C.room, borderTop: `1px solid ${C.line}` }}>
            <span className="flex-1" style={{ fontSize: 13.5, fontWeight: 500 }}>{n.name}</span>
            <span className="mono" style={{ fontSize: 11, color: C.mute, marginRight: 12 }}>{(n.net / n.put * 100).toFixed(0)}% · {M(n.net / hrs, cfg.cur)}/hr</span>
            <span className="mono" style={{ fontSize: 14, fontWeight: 600, color: n.net >= 0 ? C.win : C.lose }}>{n.net >= 0 ? "+" : "−"}{M(n.net, cfg.cur)}</span>
          </div>
        ))}
      </div>
      {transfers.length > 0 && (
        <div className="space-y-3">
          {/* The signature moment: every seat's position colouring up into
              the fewest transfers that settle the table — dramatizing the
              app's actual value proposition instead of just stating it. */}
          <div className="flex items-center justify-center gap-3 py-1">
            <div className="flex -space-x-2.5">
              {players.map((p, i) => <Chip key={p.id} size={16} color={p.color} spot="rgba(255,255,255,.25)" />)}
            </div>
            <ArrowRight size={14} style={{ color: C.mute, flexShrink: 0 }} />
            <div className="flex -space-x-1.5">
              {transfers.map((_, i) => (
                <span key={i} style={{ animation: `colour-up-settle .5s cubic-bezier(.2,.8,.3,1) ${i * 0.09}s both` }}>
                  <Chip size={24} color={C.brass} />
                </span>
              ))}
            </div>
          </div>
          <div className="text-center mono" style={{ fontSize: 11, color: C.mute }}>{L.colourUpSummary(players.length, transfers.length)}</div>

          <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
            <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: C.raise }}><ArrowRight size={13} style={{ color: C.brass }} /><Eyebrow tone={C.brass}>{L.transfers}</Eyebrow></div>
            {transfers.map((t, i) => (
              <div key={i} className="px-4 py-3 flex items-center gap-2" style={{ background: C.room, borderTop: `1px solid ${C.line}`, animation: `colour-up-settle .4s ease ${i * 0.06}s both` }}>
                <span style={{ fontSize: 13.5, fontWeight: 500 }}>{t.from.name}</span>
                <ArrowRight size={13} style={{ color: C.mute }} />
                <span style={{ fontSize: 13.5, fontWeight: 500 }}>{t.to.name}</span>
                <span className="figure flex-1 text-right" style={{ fontSize: 14, fontWeight: 600, color: C.brass }}>{M(t.amount, cfg.cur)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <Btn tone="ghost" full onClick={backHome}><RotateCcw size={14} className="inline -mt-0.5 mr-1.5" /> {L.newTable}</Btn>
    </div>
  );
}
