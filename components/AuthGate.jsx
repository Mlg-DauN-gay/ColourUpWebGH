"use client";
import { useState } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { C } from "@/lib/themes";
import { useL } from "@/lib/LangContext";
import { Btn, Chip, Field } from "./atoms";

// Embeddable sign-up / log-in / forgot-password form — rendered inside the
// Profile screen (components/ProfileTab.jsx) whenever there's no session.
export default function AuthGate({ signUp, signIn, requestPasswordReset }) {
  const { L } = useL();
  const [view, setView] = useState("signin"); // signin | signup | reset
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(""); // confirmEmailSent | resetSent

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setNotice(""); setBusy(true);
    if (view === "reset") {
      const { error } = await requestPasswordReset(email.trim());
      setBusy(false);
      if (error) setError(error.message); else setNotice(L.resetSent);
      return;
    }
    const action = view === "signup" ? signUp : signIn;
    const { data, error } = await action(email.trim(), password);
    setBusy(false);
    if (error) { setError(error.message); return; }
    if (view === "signup" && !data.session) setNotice(L.confirmEmailSent);
  }

  const title = view === "signup" ? L.signUpTitle : view === "reset" ? L.resetTitle : L.signInTitle;

  return (
    <div className="space-y-6">
      <div className="flex justify-center mb-2"><Chip size={36} color={C.gold} /></div>
      <div className="text-center">
        <div className="disp" style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-.03em" }}>{title}</div>
        <p className="mt-2" style={{ fontSize: 13.5, color: C.mute, lineHeight: 1.5 }}>{L.authTagline}</p>
      </div>

      {notice ? (
        <div className="p-4 rounded-2xl flex items-start gap-2" style={{ background: C.raise, border: `1px solid ${C.brassSoft}` }}>
          <Check size={15} style={{ color: C.win, flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 13, lineHeight: 1.5 }}>{notice}</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label={L.emailLabel} type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} />
          {view !== "reset" && (
            <Field label={L.passwordLabel} type="password" autoComplete={view === "signup" ? "new-password" : "current-password"} required minLength={6} value={password} onChange={e => setPassword(e.target.value)} />
          )}
          {error && <div className="flex items-start gap-1.5" style={{ fontSize: 12, color: C.lose, lineHeight: 1.4 }}><AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} /> {error}</div>}
          <Btn full disabled={busy || !email.trim() || (view !== "reset" && password.length < 6)} onClick={handleSubmit}>
            {view === "signup" ? L.signUpBtn : view === "reset" ? L.sendResetLink : L.signInBtn}
          </Btn>
        </form>
      )}

      <div className="text-center space-y-2">
        {view === "signin" && <button onClick={() => { setView("reset"); setError(""); setNotice(""); }} className="block w-full" style={{ fontSize: 12.5, color: C.mute }}>{L.forgotPassword}</button>}
        {view === "reset"
          ? <button onClick={() => { setView("signin"); setError(""); setNotice(""); }} className="block w-full" style={{ fontSize: 12.5, color: C.brass, fontWeight: 600 }}>{L.backToLogin}</button>
          : <button onClick={() => { setView(view === "signup" ? "signin" : "signup"); setError(""); setNotice(""); }} className="block w-full" style={{ fontSize: 12.5, color: C.brass, fontWeight: 600 }}>
              {view === "signup" ? L.switchToSignIn : L.switchToSignUp}
            </button>}
      </div>
    </div>
  );
}
