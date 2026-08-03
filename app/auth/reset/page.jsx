"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { C, THEME, themeVars } from "@/lib/themes";

// Standalone route (outside app/page.jsx's shell), so it carries its own
// themeVars wrapper — same pattern as app/join/[code]/JoinClient.jsx — to
// pick up the shared palette instead of hardcoding one of its own.
export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
      setCheckingSession(false);
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true); setError("");
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) setError(error.message); else setDone(true);
  }

  return (
    <div style={{ ...themeVars(THEME), minHeight: "100vh", background: C.ink, color: C.ivory, display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 360 }} className="body">
        <div style={{ fontSize: 13, letterSpacing: ".14em", textTransform: "uppercase", color: C.mute, marginBottom: 8, textAlign: "center" }}>Colour Up</div>
        <h1 className="disp" style={{ fontSize: 24, fontWeight: 800, margin: "0 0 20px", textAlign: "center" }}>Set a new password</h1>

        {checkingSession ? null : !hasSession ? (
          <div style={{ display: "flex", gap: 8, padding: 14, borderRadius: 14, background: C.felt, border: `1px solid ${C.line}`, fontSize: 13, color: C.lose, lineHeight: 1.4 }}>
            <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>That reset link is invalid or has expired. Request a new one from the app.</span>
          </div>
        ) : done ? (
          <div style={{ display: "flex", gap: 8, padding: 14, borderRadius: 14, background: C.felt, border: `1px solid ${C.line}`, fontSize: 13 }}>
            <Check size={15} style={{ color: C.win, flexShrink: 0, marginTop: 1 }} />
            <span>Password updated. You can close this tab and log in with your new password.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label style={{ display: "block", fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: C.mute, marginBottom: 6 }}>new password</label>
            <input
              type="password" autoComplete="new-password" required minLength={6}
              value={password} onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%", boxSizing: "border-box", background: "transparent", outline: "none", border: "none", borderBottom: `2px dashed ${C.line}`, color: C.ivory, fontSize: 18, padding: "6px 0 10px", marginBottom: 16 }}
            />
            {error && (
              <div style={{ display: "flex", gap: 6, fontSize: 12, color: C.lose, marginBottom: 16, lineHeight: 1.4 }}>
                <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
              </div>
            )}
            <button
              type="submit" disabled={busy || password.length < 6}
              className="rounded-xl"
              style={{ width: "100%", padding: "14px 18px", minHeight: 48, border: `1px solid ${C.brass}`, background: C.brass, color: C.onAccent, fontSize: 14.5, fontWeight: 600, opacity: busy || password.length < 6 ? 0.35 : 1, cursor: busy ? "not-allowed" : "pointer" }}
            >
              Save new password
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
