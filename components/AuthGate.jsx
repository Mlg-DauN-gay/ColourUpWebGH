"use client";
import { useState } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { C } from "@/lib/themes";
import { useL } from "@/lib/LangContext";
import { Btn, Chip, Field } from "./atoms";

const GoogleIcon = () => (
  <svg width={16} height={16} viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4c-7.5 0-14 4.2-17.3 10.4-.2.1-.3.2-.4.3z"/>
    <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.2-5.1l-6.6-5.6C29.6 35 26.9 36 24 36c-5.3 0-9.7-3.3-11.3-7.9l-6.6 5.1C9.9 39.7 16.4 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.4l6.6 5.6C39.8 37.5 44 31.4 44 24c0-1.3-.1-2.7-.4-3.5z"/>
  </svg>
);

// Embeddable sign-up / log-in / forgot-password form — rendered inside the
// Profile screen (components/ProfileTab.jsx) whenever there's no session.
export default function AuthGate({ signUp, signIn, signInWithGoogle, requestPasswordReset }) {
  const { L } = useL();
  const [view, setView] = useState("signin"); // signin | signup | reset
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
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

  async function handleGoogle() {
    setError(""); setNotice(""); setGoogleBusy(true);
    // On success this redirects the browser to Google, so there's nothing
    // more to do here on the happy path — only failures return control.
    const { error } = await signInWithGoogle();
    if (error) { setError(error.message); setGoogleBusy(false); }
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
        <>
          {view !== "reset" && (
            <>
              <button onClick={handleGoogle} disabled={googleBusy} className="w-full flex items-center justify-center gap-2.5 rounded-lg transition-opacity"
                style={{ background: "#fff", color: "#1f1f1f", border: "1px solid #dadce0", padding: "12px 18px",
                  font: "600 14px 'Inter Tight', system-ui, sans-serif", opacity: googleBusy ? 0.6 : 1, cursor: googleBusy ? "not-allowed" : "pointer" }}>
                <GoogleIcon /> {L.continueWithGoogle}
              </button>
              <div className="flex items-center gap-3" style={{ color: C.mute }}>
                <div className="flex-1" style={{ height: 1, background: C.line }} />
                <span style={{ fontSize: 11.5, textTransform: "uppercase", letterSpacing: ".08em" }}>{L.orDivider}</span>
                <div className="flex-1" style={{ height: 1, background: C.line }} />
              </div>
            </>
          )}
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
        </>
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
