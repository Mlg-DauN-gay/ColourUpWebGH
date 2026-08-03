/* ═══════════════════════ theme ═══════════════════════
   One fixed palette — warm, dark, lamplit. A kitchen-table game at night, not
   a casino floor and not a fintech dashboard. Built on the same trust/money
   colour research as before, recoloured into that world:
   · Brass  → trust. Primary accent, every-day CTAs, active states.
   · Ivory/dim → warmth & legibility — surfaces, borders, text, on dark.
   · Green  → money. Gains, positive nets, the pot.
   · Red    → risk/excitement. Losses and warnings. Never on a positive CTA.
   · Gold   → luxury & winning. Reserved for win moments — brighter than
     brass on purpose, so it still reads as a step up when it shows up.
   Tokens are CSS custom properties, so every `C.x` reads from it for free. */
export const THEME = {
  ink: "#17120E", felt: "#241C15", room: "#241C15", raise: "#2E241A", line: "#3C2F21",
  ivory: "#F3E7D6", sub: "#C9B79C", mute: "#A6957D", dim: "#6E5F4C",
  brass: "#C9973B", brassSoft: "rgba(201,151,59,.16)", onAccent: "#1A1109",
  win: "#4C8B5D", lose: "#C1523E", gold: "#F0C24B",
};

export const C = {
  ink: "var(--ink)", felt: "var(--felt)", room: "var(--room)", raise: "var(--raise)",
  line: "var(--line)", ivory: "var(--ivory)", sub: "var(--sub)", mute: "var(--mute)", dim: "var(--dim)",
  brass: "var(--brass)", brassSoft: "var(--brassSoft)", onAccent: "var(--onAccent)",
  win: "var(--win)", lose: "var(--lose)", gold: "var(--gold)",
};

export const themeVars = (t) => ({
  "--ink": t.ink, "--felt": t.felt, "--room": t.room, "--raise": t.raise, "--line": t.line,
  "--ivory": t.ivory, "--sub": t.sub, "--mute": t.mute, "--dim": t.dim, "--brass": t.brass,
  "--brassSoft": t.brassSoft, "--onAccent": t.onAccent, "--win": t.win, "--lose": t.lose, "--gold": t.gold,
});

// Player/avatar palette — warmed to sit on the dark ground without turning
// neon; each still needs to read clearly against `ink`/`felt`.
export const PALETTE = ["#D97A6B", "#7FB88F", "#9C8FD1", "#D9B36C", "#6FADC2", "#D4966A", "#C282A3", "#8FB56C"];
export const CURRENCIES = ["£", "$", "€", "₸", "₽"];
