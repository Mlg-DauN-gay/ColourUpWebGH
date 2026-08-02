"use client";
import { useState } from "react";
import { AlertTriangle, Check, Wallet } from "lucide-react";
import { C } from "@/lib/themes";
import { useL } from "@/lib/LangContext";
import { Btn, Dot, Eyebrow, Field, Row } from "./atoms";

function AnonymousUpgradeGate({ upgradeAnonymousAccount }) {
  const { L } = useL();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true); setError(""); setNotice("");
    const { data, error } = await upgradeAnonymousAccount(email.trim(), password);
    setBusy(false);
    if (error) { setError(error.message); return; }
    if (!data?.session) setNotice(L.confirmEmailSent);
  }

  return (
    <div className="space-y-6">
      <Eyebrow>{L.stepTwo}</Eyebrow>
      <div className="disp mt-1" style={{ fontSize: 27, fontWeight: 800, letterSpacing: "-.03em" }}>{L.needAccountTitle}</div>
      <p className="mt-2" style={{ fontSize: 13.5, color: C.mute, lineHeight: 1.5 }}>{L.needAccountBlurb}</p>
      {notice ? (
        <div className="p-4 rounded-2xl flex items-start gap-2" style={{ background: C.raise, border: `1px solid ${C.brassSoft}` }}>
          <Check size={15} style={{ color: C.win, flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 13, lineHeight: 1.5 }}>{notice}</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label={L.emailLabel} type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} />
          <Field label={L.passwordLabel} type="password" autoComplete="new-password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} />
          {error && <div className="flex items-start gap-1.5" style={{ fontSize: 12, color: C.lose, lineHeight: 1.4 }}><AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} /> {error}</div>}
          <Btn full disabled={busy || !email.trim() || password.length < 6} onClick={handleSubmit}>{L.signUpBtn}</Btn>
        </form>
      )}
    </div>
  );
}

export default function Fund({ cfg, players, viewer, recordEntry, allFunded, setGp, setStarted, mkLog, session, upgradeAnonymousAccount }) {
  const { L, M } = useL();
  const paid = viewer.entries.length > 0;

  if (session?.user?.is_anonymous) {
    return <AnonymousUpgradeGate upgradeAnonymousAccount={upgradeAnonymousAccount} />;
  }

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
