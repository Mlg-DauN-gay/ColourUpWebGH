"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { C } from "@/lib/themes";
import { useL } from "@/lib/LangContext";
import { Btn, Chip, Dot, Eyebrow, Row } from "./atoms";
import QRCode from "./QRCode";

export default function Lobby({ cfg, players, viewer, isHost, allAgreed, onAgree, onDecline, onStart, mkLog, lobbyCode }) {
  const { L, M } = useL();
  const [copied, setCopied] = useState(false);
  const [agreeing, setAgreeing] = useState(false);
  const link = typeof window !== "undefined"
    ? `${window.location.origin}/join/${lobbyCode}`
    : `https://colour-up.app/join/${lobbyCode}`;

  if (!viewer) {
    return <div className="flex justify-center py-16"><Chip size={32} color={C.gold} /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>{L.stepOne}</Eyebrow>
        <div className="disp mt-1" style={{ fontSize: 27, fontWeight: 800, letterSpacing: "-.03em" }}>{L.agreeStake}</div>
        <p className="mt-2" style={{ fontSize: 13.5, color: C.mute, lineHeight: 1.5 }}>{L.lobbyBlurb(M(cfg.buyIn, cfg.cur), cfg.chips.toLocaleString())}</p>
      </div>

      {/* QR invite */}
      <div className="p-4 rounded-2xl" style={{ background: C.room, border: `1px solid ${C.line}` }}>
        <Eyebrow>{L.invite}</Eyebrow>
        <div className="flex gap-4 mt-3">
          <div className="shrink-0 p-2 rounded-2xl" style={{ background: "#F4F1EA" }}><QRCode value={link} size={116} /></div>
          <div className="flex-1 flex flex-col justify-between py-0.5">
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{L.scanToJoin}</div>
              <div className="mono mt-2" style={{ fontSize: 10, color: C.mute, letterSpacing: ".12em" }}>{L.orCode}</div>
              <div className="mono mt-1" style={{ fontSize: 22, fontWeight: 600, letterSpacing: ".14em", color: C.brass }}>{lobbyCode}</div>
            </div>
            <button onClick={() => { navigator.clipboard?.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1400); }} className="flex items-center gap-1.5 mt-2" style={{ fontSize: 12, fontWeight: 600, color: copied ? C.win : C.ivory }}>
              {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? L.copied : L.copyLink}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {players.map(p => (
          <Row key={p.id}>
            <Dot p={p} />
            <span className="flex-1" style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</span>
            {p.agreed ? <span className="flex items-center gap-1 mono" style={{ fontSize: 10.5, color: C.win }}><Check size={13} /> {L.agreed}</span> : <span className="mono" style={{ fontSize: 10.5, color: C.mute }}>{L.waiting}</span>}
          </Row>
        ))}
      </div>

      {!viewer.agreed ? (
        <div className="p-4 rounded-2xl space-y-3" style={{ background: C.raise, border: `1px solid ${C.brassSoft}` }}>
          <div style={{ fontSize: 13.5 }}><span style={{ color: C.mute }}>{L.onPhone(viewer.name)}</span> {L.agreeQ(M(cfg.buyIn, cfg.cur))}</div>
          <div className="flex gap-2">
            <Btn full disabled={agreeing} onClick={async () => { setAgreeing(true); await onAgree(); mkLog(L.agreedLog(viewer.name, M(cfg.buyIn, cfg.cur))); setAgreeing(false); }}>{L.agree}</Btn>
            <Btn tone="danger" onClick={onDecline}>{L.decline}</Btn>
          </div>
        </div>
      ) : isHost ? (
        <Btn full disabled={!allAgreed || players.length < 2} onClick={onStart}>{players.length < 2 ? L.waitingSeats(1) : allAgreed ? L.takeBuyins : L.waitingSeats(players.filter(p => !p.agreed).length)}</Btn>
      ) : (
        <div className="mono text-center" style={{ fontSize: 11.5, color: C.mute }}>{L.waitingForHost}</div>
      )}
    </div>
  );
}
