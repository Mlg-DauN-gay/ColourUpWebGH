"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { C, PALETTE, THEME, themeVars } from "@/lib/themes";
import { DICT, money } from "@/lib/i18n";
import { Lang } from "@/lib/LangContext";
import { Btn, Chip, Dot, Eyebrow, Field } from "@/components/atoms";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

// Real QR/link join flow. Language isn't known pre-sign-in, so this page
// hardcodes English rather than reading a lang preference. Guests sign in
// anonymously (see HANDOFF.md's Milestone 2 design) so they get a real
// auth.uid() immediately; a real logged-in user scanning someone else's
// code just reuses their existing session instead.
export default function JoinClient({ code }) {
  const router = useRouter();
  const L = DICT.en;
  const M = (n, cur) => money(n, cur, "en");
  const t = THEME;

  const [phase, setPhase] = useState("booting"); // booting | notfound | started | form | joining | error
  const [game, setGame] = useState(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PALETTE[0]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = getSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const { error: signInErr } = await supabase.auth.signInAnonymously();
        if (signInErr) { if (!cancelled) { setError(signInErr.message); setPhase("error"); } return; }
      }
      const { data: { user } } = await supabase.auth.getUser();
      // RPC, not a raw table select: the games SELECT policy only covers
      // the host and already-seated players (a guest has no seat yet at
      // this point) — see supabase/migrations/0006_fix_games_enumeration.sql.
      const { data: gameRow, error: gErr } = await supabase.rpc("lookup_game_by_code", { p_code: code });
      if (cancelled) return;
      if (gErr) { setError(gErr.message); setPhase("error"); return; }
      if (!gameRow || !gameRow.id) { setPhase("notfound"); return; }
      if (gameRow.phase !== "lobby") { setGame(gameRow); setPhase("started"); return; }
      setGame(gameRow);
      const { data: profileRow } = await supabase.from("profiles").select("display_name,color").eq("id", user.id).maybeSingle();
      if (cancelled) return;
      setName(profileRow?.display_name || "");
      setColor(profileRow?.color || PALETTE[Math.floor(Math.random() * PALETTE.length)]);
      setPhase("form");
    })();
    return () => { cancelled = true; };
  }, [code]);

  async function handleJoin() {
    setPhase("joining");
    const supabase = getSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { error: insErr } = await supabase.from("game_players")
      .insert({ game_id: game.id, user_id: user.id, seat_name: name.trim(), color });
    if (insErr && insErr.code !== "23505") { setError(insErr.message); setPhase("form"); return; }
    router.push(`/?game=${game.id}`);
  }

  return (
    <Lang.Provider value={{ L, lang: "en", M }}>
      <div style={{ ...themeVars(t), background: C.ink, minHeight: "100vh", color: C.ivory }}>
        <div className="mx-auto body" style={{ maxWidth: 460, padding: "48px 20px" }}>
          <div className="flex justify-center mb-8"><Chip size={36} color={C.gold} /></div>

          {phase === "booting" && (
            <div className="flex justify-center py-16"><Chip size={32} color={C.gold} /></div>
          )}

          {phase === "notfound" && (
            <div className="text-center space-y-3">
              <div className="disp" style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.02em" }}>{L.noTable}</div>
            </div>
          )}

          {phase === "started" && (
            <div className="text-center space-y-3">
              <div className="disp" style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.02em" }}>{game?.title}</div>
              <p style={{ fontSize: 13.5, color: C.mute, lineHeight: 1.5 }}>{L.alreadyStarted}</p>
            </div>
          )}

          {(phase === "form" || phase === "joining") && game && (
            <div className="space-y-6">
              <div className="text-center">
                <Eyebrow>{L.joinTitle}</Eyebrow>
                <div className="disp mt-1" style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-.02em" }}>{game.title}</div>
                <p className="mt-2" style={{ fontSize: 13.5, color: C.mute, lineHeight: 1.5 }}>
                  {L.lobbyBlurb(M(Number(game.buy_in), game.currency), Number(game.chips).toLocaleString())}
                </p>
              </div>
              <div className="flex justify-center"><Dot p={{ name, color }} size={64} /></div>
              <Field label={L.yourName} value={name} onChange={(e) => setName(e.target.value)} />
              <div>
                <Eyebrow>{L.pickColour}</Eyebrow>
                <div className="flex flex-wrap gap-2 mt-2">
                  {PALETTE.map((c) => (
                    <button key={c} onClick={() => setColor(c)} className="rounded-full"
                      style={{ width: 34, height: 34, background: c + "22", border: `2px solid ${color === c ? c : "transparent"}` }}>
                      <span className="block mx-auto rounded-full" style={{ width: 16, height: 16, background: c }} />
                    </button>
                  ))}
                </div>
              </div>
              {error && (
                <div className="flex items-start gap-1.5" style={{ fontSize: 12, color: C.lose, lineHeight: 1.4 }}>
                  <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
                </div>
              )}
              <Btn full disabled={!name.trim() || phase === "joining"} onClick={handleJoin}>{L.joinBtn}</Btn>
            </div>
          )}

          {phase === "error" && (
            <div className="text-center space-y-3">
              <AlertTriangle size={22} style={{ color: C.lose, margin: "0 auto", display: "block" }} />
              <p style={{ fontSize: 13.5, color: C.mute, lineHeight: 1.5 }}>{error}</p>
            </div>
          )}
        </div>
      </div>
    </Lang.Provider>
  );
}
