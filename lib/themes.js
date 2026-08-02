/* ═══════════════════════ theme ═══════════════════════
   One fixed palette, built on the trust/gambling colour research:
   · Blue  → primary. Security & competence — chrome, CTAs, active states.
   · White/Gray → clarity & professional neutrality — surfaces, borders, text.
   · Green → money. Gains, positive nets, the pot.
   · Red   → risk/excitement. Losses and warnings.
   · Gold  → luxury & winning. Reserved for win moments (receipt, best night).
   Tokens are CSS custom properties, so every `C.x` reads from it for free. */
export const THEME = {
  ink: "#EDF0F5", sheet: "#FFFFFF", room: "#FFFFFF", raise: "#F3F5F9", line: "#DCE1EA",
  ivory: "#1B2430", sub: "#5A6675", mute: "#8A94A3",
  brass: "#2F6FED", brassSoft: "rgba(47,111,237,.10)", onAccent: "#FFFFFF",
  win: "#1F9D57", lose: "#D64550", gold: "#C99A2E",
};

export const C = {
  ink: "var(--ink)", sheet: "var(--sheet)", room: "var(--room)", raise: "var(--raise)",
  line: "var(--line)", ivory: "var(--ivory)", sub: "var(--sub)", mute: "var(--mute)",
  brass: "var(--brass)", brassSoft: "var(--brassSoft)", onAccent: "var(--onAccent)",
  win: "var(--win)", lose: "var(--lose)", gold: "var(--gold)",
};

export const themeVars = (t) => ({
  "--ink": t.ink, "--sheet": t.sheet, "--room": t.room, "--raise": t.raise, "--line": t.line,
  "--ivory": t.ivory, "--sub": t.sub, "--mute": t.mute, "--brass": t.brass,
  "--brassSoft": t.brassSoft, "--onAccent": t.onAccent, "--win": t.win, "--lose": t.lose, "--gold": t.gold,
});

export const PALETTE = ["#C4514A", "#5FA97C", "#7A6DB0", "#CBA45E", "#4E93A8", "#C47C4A", "#A85F86", "#6E9E4E"];
export const CURRENCIES = ["£", "$", "€", "₸", "₽"];
