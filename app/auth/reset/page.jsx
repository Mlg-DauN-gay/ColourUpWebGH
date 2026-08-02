"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const ink = "#0B1120", room = "#131C2E", raise = "#1C273B", line = "#29344A";
const ivory = "#E7ECF4", mute = "#7A8699", brass = "#4C8DFF", win = "#34C77B", lose = "#F2555F";

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
    <div style={{ minHeight: "100vh", background: ink, color: ivory, display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 360, fontFamily: "system-ui, sans-serif" }}>
        <div style={{ fontSize: 13, letterSpacing: ".14em", textTransform: "uppercase", color: mute, marginBottom: 8, textAlign: "center" }}>Colour Up</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 20px", textAlign: "center" }}>Set a new password</h1>

        {checkingSession ? null : !hasSession ? (
          <div style={{ display: "flex", gap: 8, padding: 14, borderRadius: 12, background: room, border: `1px solid ${line}`, fontSize: 13, color: lose, lineHeight: 1.4 }}>
            <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>That reset link is invalid or has expired. Request a new one from the app.</span>
          </div>
        ) : done ? (
          <div style={{ display: "flex", gap: 8, padding: 14, borderRadius: 12, background: room, border: `1px solid ${line}`, fontSize: 13 }}>
            <Check size={15} style={{ color: win, flexShrink: 0, marginTop: 1 }} />
            <span>Password updated. You can close this tab and log in with your new password.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label style={{ display: "block", fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: mute, marginBottom: 6 }}>new password</label>
            <input
              type="password" autoComplete="new-password" required minLength={6}
              value={password} onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%", boxSizing: "border-box", background: "transparent", outline: "none", border: "none", borderBottom: `1px solid ${line}`, color: ivory, fontSize: 18, padding: "6px 0 10px", marginBottom: 16 }}
            />
            {error && (
              <div style={{ display: "flex", gap: 6, fontSize: 12, color: lose, marginBottom: 16, lineHeight: 1.4 }}>
                <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
              </div>
            )}
            <button
              type="submit" disabled={busy || password.length < 6}
              style={{ width: "100%", padding: "13px 18px", borderRadius: 8, border: `1px solid ${brass}`, background: brass, color: "#fff", fontSize: 14, fontWeight: 600, opacity: busy || password.length < 6 ? 0.35 : 1, cursor: busy ? "not-allowed" : "pointer" }}
            >
              Save new password
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
