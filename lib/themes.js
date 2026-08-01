/* ═══════════════════════ themes ═══════════════════════
   Palette is built on the trust/gambling colour research:
   · Blue  → primary. Security & competence — chrome, CTAs, active states.
   · White/Gray → clarity & professional neutrality — surfaces, borders, text.
   · Green → money. Gains, positive nets, the pot.
   · Red   → risk/excitement. Losses and warnings.
   · Gold  → luxury & winning. Reserved for win moments (receipt, best night).
   Tokens are CSS custom properties, so every `C.x` re-themes for free.     */
export const THEMES = {
  trust: {
    name: { en: "Trust", ru: "Доверие" }, swatch: ["#EEF1F6", "#2F6FED", "#C99A2E"],
    ink: "#EDF0F5", sheet: "#FFFFFF", room: "#FFFFFF", raise: "#F3F5F9", line: "#DCE1EA",
    ivory: "#1B2430", sub: "#5A6675", mute: "#8A94A3",
    brass: "#2F6FED", brassSoft: "rgba(47,111,237,.10)", onAccent: "#FFFFFF",
    win: "#1F9D57", lose: "#D64550", gold: "#C99A2E",
  },
  night: {
    name: { en: "Night", ru: "Ночь" }, swatch: ["#0B1120", "#4C8DFF", "#E3B23C"],
    ink: "#0B1120", sheet: "#070B14", room: "#131C2E", raise: "#1C273B", line: "#29344A",
    ivory: "#E7ECF4", sub: "#A9B4C6", mute: "#7A8699",
    brass: "#4C8DFF", brassSoft: "rgba(76,141,255,.18)", onAccent: "#FFFFFF",
    win: "#34C77B", lose: "#F2555F", gold: "#E3B23C",
  },
  steel: {
    name: { en: "Steel", ru: "Сталь" }, swatch: ["#10151D", "#3B82C4", "#3FB984"],
    ink: "#10151D", sheet: "#0A0E14", room: "#182029", raise: "#212B36", line: "#2E3945",
    ivory: "#E6EBF0", sub: "#A6B0BC", mute: "#7C8794",
    brass: "#3B82C4", brassSoft: "rgba(59,130,196,.18)", onAccent: "#FFFFFF",
    win: "#3FB984", lose: "#E15561", gold: "#D9A83B",
  },
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
