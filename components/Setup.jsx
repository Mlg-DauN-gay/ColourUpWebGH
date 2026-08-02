"use client";
import { useState } from "react";
import { Camera, ChevronRight, Coins, QrCode, Receipt, X } from "lucide-react";
import { C, CURRENCIES } from "@/lib/themes";
import { useL } from "@/lib/LangContext";
import { Btn, Eyebrow, Field } from "./atoms";
import ChipScanner from "./ChipScanner";

export default function Setup({ cfg, setCfg, players, openLobby }) {
  const { L } = useL();
  const [scanning, setScanning] = useState(false);
  return (
    <div className="space-y-7">
      <div>
        <div className="disp" style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-.035em", lineHeight: 1.05 }}>{L.openTable}</div>
        <p className="mt-2" style={{ fontSize: 13.5, color: C.mute, lineHeight: 1.5 }}>{L.setupBlurb}</p>
      </div>
      <Field label={L.game} value={cfg.title} onChange={e => setCfg({ ...cfg, title: e.target.value })} />
      <div className="grid grid-cols-2 gap-5 items-end">
        <Field label={L.buyIn} type="number" value={cfg.buyIn} suffix={cfg.cur}
          onChange={e => { const b = Math.max(1, +e.target.value || 0); setCfg(c => ({ ...c, buyIn: b, chips: c.scan ? c.chips : b })); }} />
        <div>
          <Eyebrow>{L.currency}</Eyebrow>
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {CURRENCIES.map(cu => (
              <button key={cu} onClick={() => setCfg({ ...cfg, cur: cu })} className="rounded-lg mono" style={{ width: 38, height: 36, fontSize: 15, fontWeight: 600, background: cfg.cur === cu ? C.brass : C.room, color: cfg.cur === cu ? C.onAccent : C.ivory, border: `1px solid ${cfg.cur === cu ? C.brass : C.line}` }}>{cu}</button>
            ))}
          </div>
        </div>
      </div>

      {/* starting stack — cash by default, or scan a physical set */}
      <div>
        <Eyebrow>{L.startingStack}</Eyebrow>
        {cfg.scan ? (
          <div className="mt-2 p-4 rounded-2xl" style={{ background: C.room, border: `1px solid ${C.brass}` }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1.5">{cfg.scan.colors.slice(0, 5).map((c, i) => <span key={i} style={{ width: 18, height: 18, borderRadius: 99, background: c.hex, border: `1.5px solid ${C.room}` }} />)}</div>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{L.scannedSummary(cfg.scan.colors.length, cfg.scan.stackValue.toLocaleString())}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
              {cfg.scan.colors.map((c, i) => (
                <span key={i} className="mono flex items-center gap-1.5" style={{ fontSize: 11, color: C.mute }}>
                  <span style={{ width: 9, height: 9, borderRadius: 99, background: c.hex }} /> {c.denom.toLocaleString()} × {c.perPlayer}
                </span>
              ))}
            </div>
            <div className="flex gap-4 mt-3 pt-3" style={{ borderTop: `1px solid ${C.line}` }}>
              <button onClick={() => setScanning(true)} className="flex items-center gap-1.5" style={{ fontSize: 12, fontWeight: 600, color: C.brass }}><Camera size={13} /> {L.rescan}</button>
              <button onClick={() => setCfg(c => ({ ...c, scan: null, chips: c.buyIn }))} className="flex items-center gap-1.5" style={{ fontSize: 12, color: C.mute }}><X size={13} /> {L.clearScan}</button>
            </div>
          </div>
        ) : (
          <div className="mt-2 flex items-center gap-3 p-4 rounded-2xl" style={{ background: C.room, border: `1px solid ${C.line}` }}>
            <Coins size={18} style={{ color: C.mute, flexShrink: 0 }} />
            <div className="flex-1">
              <div style={{ fontSize: 13, fontWeight: 600 }}>{L.countAsCash(cfg.cur)}</div>
              <div style={{ fontSize: 11.5, color: C.mute, lineHeight: 1.4 }}>{L.countAsCashNote}</div>
            </div>
            <button onClick={() => setScanning(true)} className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg" style={{ background: C.brassSoft, border: `1px solid ${C.brass}`, fontSize: 12, fontWeight: 600, color: C.brass }}><Camera size={14} /> {L.scanSet}</button>
          </div>
        )}
      </div>
      <div>
        <Eyebrow>{L.howMoney}</Eyebrow>
        <div className="mt-2 flex gap-3 p-4 rounded-2xl" style={{ background: C.room, border: `1px solid ${C.line}` }}>
          <Receipt size={18} style={{ color: C.brass, flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{L.receiptT}</div>
            <div style={{ fontSize: 11.5, color: C.mute, lineHeight: 1.45 }}>{L.receiptD}</div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2.5 p-3.5 rounded-xl" style={{ background: C.brassSoft, border: `1px solid ${C.line}` }}>
        <QrCode size={16} style={{ color: C.brass, flexShrink: 0 }} />
        <span style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.4 }}>{L.seatsAfter}</span>
      </div>
      <Btn full onClick={openLobby}>{L.openLobby} <ChevronRight size={15} className="inline -mt-0.5" /></Btn>

      {scanning && (
        <ChipScanner P={Math.max(players.length, 1)} onClose={() => setScanning(false)}
          onApply={(scan) => { setCfg(c => ({ ...c, scan, chips: scan.stackValue })); setScanning(false); }} />
      )}
    </div>
  );
}
