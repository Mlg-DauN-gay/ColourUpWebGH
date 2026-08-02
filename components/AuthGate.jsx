"use client";
import { useState } from "react";
import { AlertTriangle, Check, Languages, Palette } from "lucide-react";
import { C, THEMES } from "@/lib/themes";
import { useL } from "@/lib/LangContext";
import { Btn, Chip, Field } from "./atoms";

export default function AuthGate({ signUp, signIn, requestPasswordReset, themeKey, setThemeKey, lang, setLang }) {
  const { L } = useL();
  const [view, setView] = useState("signin"); // signin | signup | reset
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(""); // confirmEmailSent | resetSent
  const [showThemes, setShowThemes] = useState(false);

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
    <div style={{ minHeight: "100vh", background: C.ink, color: C.ivory }}>
      <div className="mx-auto body" style={{ maxWidth: 460 }}>
        <div className="flex items-center justify-between px-5 pt-6 pb-4">
          <div className="flex items-center gap-2">
            <Chip size={20} color={C.gold} />
            <span className="disp" style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-.02em" }}>{L.brand}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <button onClick={() => setShowThemes(s => !s)} className="grid place-items-center rounded-full" style={{ width: 28, height: 28, border: `1px solid ${C.line}`, background: showThemes ? C.raise : C.room }} aria-label="Palette">
                <Palette size={14} style={{ color: C.brass }} />
              </button>
              {showThemes && (
                <div className="absolute right-0 mt-2 p-2 rounded-2xl z-40 flex gap-2" style={{ background: C.sheet, border: `1px solid ${C.line}` }}>
                  {Object.entries(THEMES).map(([k, th]) => (
                    <button key={k} onClick={() => { setThemeKey(k); setShowThemes(false); }} className="rounded-xl p-1.5 flex gap-1" style={{ border: `1px solid ${k === themeKey ? th.swatch[1] : "transparent"}`, background: th.swatch[0] }} aria-label={th.name[lang]}>
                      {th.swatch.map((c, i) => <span key={i} style={{ width: 14, height: 22, borderRadius: 4, background: c }} />)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setLang(l => l === "en" ? "ru" : "en")} className="flex items-center gap-1 rounded-full px-2 py-1" style={{ border: `1px solid ${C.line}`, background: C.room, height: 28 }} aria-label="Language">
              <Languages size={13} style={{ color: C.brass }} />
              <span className="mono" style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: ".06em" }}>
                <span style={{ color: lang === "en" ? C.ivory : C.mute }}>EN</span>
                <span style={{ color: C.line, margin: "0 3px" }}>/</span>
                <span style={{ color: lang === "ru" ? C.ivory : C.mute }}>RU</span>
              </span>
            </button>
          </div>
        </div>

        <div className="px-5 pt-10 space-y-6">
          <div className="flex justify-center mb-2"><Chip size={40} color={C.gold} /></div>
          <div className="text-center">
            <div className="disp" style={{ fontSize: 27, fontWeight: 800, letterSpacing: "-.03em" }}>{title}</div>
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
      </div>
    </div>
  );
}
