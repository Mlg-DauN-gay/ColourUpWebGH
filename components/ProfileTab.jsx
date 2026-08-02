"use client";
import { useMemo, useState } from "react";
import { AlertTriangle, Check, ChevronLeft, Clock, Cloud, History, LogOut, Spade, TrendingUp, Trophy, User } from "lucide-react";
import { C, CURRENCIES, PALETTE } from "@/lib/themes";
import { useL } from "@/lib/LangContext";
import { Btn, Chip, Dot, Eyebrow, Field } from "./atoms";
import HistoryRow from "./HistoryRow";
import FriendsTab from "./FriendsTab";
import AuthGate from "./AuthGate";

function BackBar({ onBack }) {
  return (
    <button onClick={onBack} className="grid place-items-center rounded-full mb-2" style={{ width: 30, height: 30, background: C.room, border: `1px solid ${C.line}`, color: C.mute }} aria-label="Back">
      <ChevronLeft size={16} />
    </button>
  );
}

function AccountSection({ userEmail, signOut, updatePassword }) {
  const { L } = useL();
  const [changing, setChanging] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [state, setState] = useState("idle"); // idle | saving | done | error
  const [error, setError] = useState("");

  async function handleChangePassword() {
    setState("saving"); setError("");
    const { error } = await updatePassword(newPassword);
    if (error) { setState("error"); setError(error.message); return; }
    setState("done");
    setNewPassword("");
    setTimeout(() => { setChanging(false); setState("idle"); }, 1200);
  }

  return (
    <div>
      <Eyebrow>{L.account}</Eyebrow>
      <div className="mt-2 p-4 rounded-xl space-y-3" style={{ background: C.room, border: `1px solid ${C.line}` }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><Cloud size={15} style={{ color: C.win }} /><span style={{ fontSize: 13, fontWeight: 600 }}>{L.signedInAs(userEmail)}</span></div>
          <button onClick={signOut} className="flex items-center gap-1.5" style={{ fontSize: 12, color: C.mute }}><LogOut size={13} /> {L.signOut}</button>
        </div>
        {changing ? (
          <div className="flex gap-2 items-center">
            <input type="password" autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder={L.newPasswordLabel}
              className="flex-1 bg-transparent outline-none mono" style={{ fontSize: 13, color: C.ivory, borderBottom: `1px solid ${C.line}`, paddingBottom: 6 }} />
            <Btn small disabled={newPassword.length < 6 || state === "saving"} onClick={handleChangePassword}>{L.setNewPasswordBtn}</Btn>
          </div>
        ) : (
          <button onClick={() => setChanging(true)} style={{ fontSize: 12, color: C.brass, fontWeight: 600 }}>{L.changePassword}</button>
        )}
        {state === "done" && <div className="mono flex items-center gap-1.5" style={{ fontSize: 11, color: C.win }}><Check size={12} /> {L.passwordUpdated}</div>}
        {state === "error" && <div className="flex items-start gap-1.5" style={{ fontSize: 11, color: C.lose, lineHeight: 1.4 }}><AlertTriangle size={12} style={{ flexShrink: 0, marginTop: 1 }} /> {error}</div>}
      </div>
    </div>
  );
}

export default function ProfileTab({
  session, dataReady, signUp, signIn, requestPasswordReset,
  profile, setProfile, history, userEmail, signOut, updatePassword,
  friends, setFriends, mkLog, gameLive, addSeatNamed,
  onBack,
}) {
  const { L, M } = useL();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const stats = useMemo(() => {
    const games = history.length;
    const net = history.reduce((s, h) => s + h.meNet, 0);
    const best = history.reduce((m, h) => Math.max(m, h.meNet), 0);
    const hours = history.reduce((s, h) => s + h.duration, 0) / 3600;
    const cur = history[0]?.cur || profile.currency;
    return { games, net, best, hours, cur };
  }, [history, profile.currency]);

  async function handleSave() {
    setSaving(true); setSaveError("");
    const { error } = await setProfile({ ...draft, registered: true });
    setSaving(false);
    if (error) { setSaveError(L.saveProfileError); return; }
    setEditing(false);
  }

  if (!session) {
    return (
      <div className="space-y-6">
        <BackBar onBack={onBack} />
        <AuthGate {...{ signUp, signIn, requestPasswordReset }} />
      </div>
    );
  }

  if (!dataReady) {
    return (
      <div className="space-y-6">
        <BackBar onBack={onBack} />
        <div className="flex justify-center py-10"><Chip size={32} color={C.gold} /></div>
      </div>
    );
  }

  if (!profile.registered || editing) {
    return (
      <div className="space-y-6">
        <BackBar onBack={onBack} />
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
        {saveError && <div className="flex items-start gap-1.5" style={{ fontSize: 12, color: C.lose, lineHeight: 1.4 }}><AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} /> {saveError}</div>}
        <div className="flex gap-2">
          {profile.registered && <Btn tone="ghost" onClick={() => { setDraft(profile); setEditing(false); }}>{L.cancel}</Btn>}
          <div className="flex-1"><Btn full disabled={!draft.name.trim() || draft.handle.length < 2 || saving} onClick={handleSave}>{L.saveProfile}</Btn></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackBar onBack={onBack} />
      <div className="flex items-center gap-4">
        <Dot p={profile} size={56} />
        <div className="flex-1"><div className="disp" style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.02em" }}>{profile.name}</div><div className="mono" style={{ fontSize: 12, color: C.mute }}>{profile.handle}</div></div>
        <button onClick={() => { setDraft(profile); setEditing(true); }} className="grid place-items-center rounded-full" style={{ width: 34, height: 34, background: C.room, border: `1px solid ${C.line}`, color: C.mute }}><User size={15} /></button>
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

      <div className="pt-2" style={{ borderTop: `1px solid ${C.line}` }}>
        <FriendsTab {...{ friends, setFriends, mkLog, gameLive, addSeatNamed }} />
      </div>

      <AccountSection {...{ userEmail, signOut, updatePassword }} />
    </div>
  );
}
