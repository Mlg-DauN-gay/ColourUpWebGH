"use client";
import { useMemo, useState } from "react";
import { Check, Clock, Cloud, CloudOff, History, Languages, LogOut, Palette, Spade, TrendingUp, Trophy, User } from "lucide-react";
import { C, CURRENCIES, PALETTE, THEMES } from "@/lib/themes";
import { useL } from "@/lib/LangContext";
import { Btn, Dot, Eyebrow, Field } from "./atoms";
import HistoryRow from "./HistoryRow";

function AccountSection({ mode, isAnonymous, userEmail, linkEmail, signInWithEmail, signOut }) {
  const { L } = useL();
  const [email, setEmail] = useState("");
  const [state, setState] = useState("idle"); // idle | sending | sent | error

  async function send(action) {
    if (!email.trim()) return;
    setState("sending");
    const { error } = await action(email.trim());
    setState(error ? "error" : "sent");
  }

  return (
    <div>
      <Eyebrow>{L.account}</Eyebrow>
      <div className="mt-2 p-4 rounded-xl space-y-3" style={{ background: C.room, border: `1px solid ${C.line}` }}>
        {mode === "online" && !isAnonymous && userEmail ? (
          <>
            <div className="flex items-center gap-2"><Cloud size={15} style={{ color: C.win }} /><span style={{ fontSize: 13, fontWeight: 600 }}>{L.signedInAs(userEmail)}</span></div>
            <button onClick={signOut} className="flex items-center gap-1.5" style={{ fontSize: 12, color: C.mute }}><LogOut size={13} /> {L.signOut}</button>
          </>
        ) : (
          <>
            <div className="flex items-start gap-2">
              {mode === "online" ? <Cloud size={15} style={{ color: C.brass, flexShrink: 0, marginTop: 1 }} /> : <CloudOff size={15} style={{ color: C.mute, flexShrink: 0, marginTop: 1 }} />}
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{mode === "online" ? L.guestAccount : L.syncOff}</div>
                <div style={{ fontSize: 11.5, color: C.mute, lineHeight: 1.4 }}>{mode === "online" ? L.guestAccountDesc : L.haveAccount}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <input type="email" value={email} onChange={e => { setEmail(e.target.value); setState("idle"); }} placeholder={L.emailPlaceholder}
                className="flex-1 bg-transparent outline-none mono" style={{ fontSize: 13, color: C.ivory, borderBottom: `1px solid ${C.line}`, paddingBottom: 6 }} />
              <Btn small disabled={!email.trim() || state === "sending"} onClick={() => send(mode === "online" ? linkEmail : signInWithEmail)}>
                {mode === "online" ? L.sendLink : L.signInEmail}
              </Btn>
            </div>
            {state === "sent" && <div className="mono flex items-center gap-1.5" style={{ fontSize: 11, color: C.win }}><Check size={12} /> {L.linkSent}</div>}
            {state === "error" && <div className="mono" style={{ fontSize: 11, color: C.lose }}>{L.linkError}</div>}
          </>
        )}
      </div>
    </div>
  );
}

export default function ProfileTab({
  profile, setProfile, history, themeKey, setThemeKey, lang, setLang,
  mode, goOnline, goSolo, isAnonymous, userEmail, linkEmail, signInWithEmail, signOut,
}) {
  const { L, M, lang: cur } = useL();
  const [editing, setEditing] = useState(!profile.registered);
  const [draft, setDraft] = useState(profile);
  const [wantOnline, setWantOnline] = useState(mode === "online");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const stats = useMemo(() => {
    const games = history.length;
    const net = history.reduce((s, h) => s + h.meNet, 0);
    const best = history.reduce((m, h) => Math.max(m, h.meNet), 0);
    const hours = history.reduce((s, h) => s + h.duration, 0) / 3600;
    const cur = history[0]?.cur || profile.currency;
    return { games, net, best, hours, cur };
  }, [history, profile.currency]);

  async function handleSave() {
    setSaving(true);
    setSaveError(false);
    if (wantOnline) {
      const { error } = await goOnline();
      if (error) { setSaving(false); setSaveError(true); return; }
    } else {
      goSolo();
    }
    await setProfile({ ...draft, registered: true });
    setSaving(false);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="space-y-6">
        <div><div className="disp" style={{ fontSize: 27, fontWeight: 800, letterSpacing: "-.03em" }}>{profile.registered ? L.editProfile : L.createProfile}</div>
          <p className="mt-2" style={{ fontSize: 13.5, color: C.mute, lineHeight: 1.5 }}>{L.regBlurb}</p></div>
        <div className="flex justify-center py-2"><Dot p={draft} size={72} /></div>
        <Field label={L.yourName} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} />
        <Field label={L.username} value={draft.handle} onChange={e => setDraft({ ...draft, handle: e.target.value.replace(/^@?/, "@") })} />
        <div>
          <Eyebrow>{L.pickColour}</Eyebrow>
          <div className="flex flex-wrap gap-2 mt-2">
            {PALETTE.map(c => <button key={c} onClick={() => setDraft({ ...draft, color: c })} className="rounded-full" style={{ width: 34, height: 34, background: c + "22", border: `2px solid ${draft.color === c ? c : "transparent"}` }}><span className="block mx-auto rounded-full" style={{ width: 16, height: 16, background: c }} /></button>)}
          </div>
        </div>
        <div>
          <Eyebrow>{L.homeCur}</Eyebrow>
          <div className="flex gap-2 mt-2">{CURRENCIES.map(cu => <button key={cu} onClick={() => setDraft({ ...draft, currency: cu })} className="rounded-lg mono" style={{ width: 44, height: 40, fontSize: 16, fontWeight: 600, background: draft.currency === cu ? C.brass : C.room, color: draft.currency === cu ? C.onAccent : C.ivory, border: `1px solid ${draft.currency === cu ? C.brass : C.line}` }}>{cu}</button>)}</div>
        </div>
        <div>
          <Eyebrow>{L.account}</Eyebrow>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {[[false, L.syncOff, CloudOff], [true, L.syncAcross, Cloud]].map(([val, label, Icon]) => (
              <button key={String(val)} onClick={() => setWantOnline(val)}
                className="flex flex-col items-center justify-center gap-1.5 rounded-xl py-3.5"
                style={{ background: wantOnline === val ? C.brass : C.room, color: wantOnline === val ? C.onAccent : C.ivory, border: `1px solid ${wantOnline === val ? C.brass : C.line}` }}>
                <Icon size={18} /><span style={{ fontSize: 12, fontWeight: 600, textAlign: "center" }}>{label}</span>
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: C.mute, lineHeight: 1.4, marginTop: 8 }}>{wantOnline ? L.syncOn : L.syncOffDesc}</div>
        </div>
        {saveError && <div className="mono" style={{ fontSize: 11, color: C.lose }}>{L.linkError}</div>}
        <Btn full disabled={!draft.name.trim() || draft.handle.length < 2 || saving} onClick={handleSave}>{L.saveProfile}</Btn>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Dot p={profile} size={56} />
        <div className="flex-1"><div className="disp" style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.02em" }}>{profile.name}</div><div className="mono" style={{ fontSize: 12, color: C.mute }}>{profile.handle}</div></div>
        <button onClick={() => { setDraft(profile); setWantOnline(mode === "online"); setEditing(true); }} className="grid place-items-center rounded-full" style={{ width: 34, height: 34, background: C.room, border: `1px solid ${C.line}`, color: C.mute }}><User size={15} /></button>
      </div>

      <div>
        <Eyebrow>{L.lifetime}</Eyebrow>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {[[L.gamesPlayed, stats.games, Spade], [L.netLifetime, `${stats.net >= 0 ? "+" : "−"}${M(stats.net, stats.cur)}`, TrendingUp], [L.biggestNight, `+${M(stats.best, stats.cur)}`, Trophy], [L.hoursPlayed, stats.hours.toFixed(1), Clock]].map(([k, v, Icon], i) => (
            <div key={i} className="p-3.5 rounded-xl" style={{ background: C.room, border: `1px solid ${C.line}` }}>
              <div className="flex items-center gap-1.5" style={{ color: i === 2 ? C.gold : C.mute }}><Icon size={12} /><Eyebrow tone={i === 2 ? C.gold : C.mute}>{k}</Eyebrow></div>
              <div className="disp mt-1.5" style={{ fontSize: 20, fontWeight: 800, color: (i === 1 && stats.net < 0) ? C.lose : i === 1 ? C.win : i === 2 ? C.gold : C.ivory }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-1.5 mb-2" style={{ color: C.mute }}><History size={12} /><Eyebrow>{L.historyTitle}</Eyebrow></div>
        {history.length === 0 ? <div className="mono px-4 py-6 rounded-xl text-center" style={{ fontSize: 12, color: C.mute, background: C.room }}>{L.noHistory}</div>
          : <div className="space-y-2">{history.map(h => <HistoryRow key={h.id} h={h} />)}</div>}
      </div>

      <AccountSection {...{ mode, isAnonymous, userEmail, linkEmail, signInWithEmail, signOut }} />

      <div>
        <Eyebrow>{L.appearance}</Eyebrow>
        <div className="mt-2 space-y-2">
          <div className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: C.room, border: `1px solid ${C.line}` }}>
            <div className="flex items-center gap-2"><Palette size={15} style={{ color: C.brass }} /><span style={{ fontSize: 13.5, fontWeight: 600 }}>{L.theme}</span></div>
            <div className="flex gap-2">{Object.entries(THEMES).map(([k, th]) => (
              <button key={k} onClick={() => setThemeKey(k)} className="rounded-lg p-1 flex gap-0.5" style={{ border: `1px solid ${k === themeKey ? th.swatch[1] : C.line}`, background: th.swatch[0] }} aria-label={th.name[cur]}>
                {th.swatch.map((c, i) => <span key={i} style={{ width: 9, height: 18, borderRadius: 3, background: c }} />)}
              </button>))}</div>
          </div>
          <div className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: C.room, border: `1px solid ${C.line}` }}>
            <div className="flex items-center gap-2"><Languages size={15} style={{ color: C.brass }} /><span style={{ fontSize: 13.5, fontWeight: 600 }}>{L.langLabel}</span></div>
            <div className="flex gap-2">{[["en", "English"], ["ru", "Русский"]].map(([k, lbl]) => (
              <button key={k} onClick={() => setLang(k)} className="rounded-lg px-3 py-1.5" style={{ fontSize: 12, fontWeight: 600, background: lang === k ? C.brass : C.raise, color: lang === k ? C.onAccent : C.mute, border: `1px solid ${lang === k ? C.brass : C.line}` }}>{lbl}</button>))}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
