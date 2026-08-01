/* ═══════════════════════ chip-set scanner maths ═══════════════════════
   Photo → (vision) colour + count per chip → assign denominations and
   split an even starting stack across P players. Denominations climb a
   standard ladder, most-numerous colour gets the smallest value, and the
   top denomination is trimmed so value isn't locked in a couple of big
   chips.                                                                */
export const DENOMS = [
  { v: 1000, c: "#2F2A38", n: "1k" }, { v: 500, c: "#7A4E9E", n: "500" },
  { v: 100, c: "#1F1B27", n: "100" }, { v: 25, c: "#3E8A5F", n: "25" },
  { v: 5, c: "#B33A3A", n: "5" }, { v: 1, c: "#DDD5C6", n: "1" },
];

export const LADDER = [1, 5, 25, 100, 500, 1000, 5000];

export function assignDenoms(colors) {
  const order = [...colors.keys()].sort((a, b) => (colors[b].count || 0) - (colors[a].count || 0));
  order.forEach((idx, rank) => { colors[idx] = { ...colors[idx], denom: LADDER[Math.min(rank, LADDER.length - 1)] }; });
  return colors;
}

export function computeStacks(colors, P) {
  const p = Math.max(P, 1);
  const per = colors.map(c => Math.max(0, Math.floor((c.count || 0) / p)));
  for (let it = 0; it < 300; it++) {
    const total = colors.reduce((s, c, i) => s + c.denom * per[i], 0);
    if (total <= 0) break;
    const idxs = [...colors.keys()].sort((a, b) => colors[b].denom - colors[a].denom);
    let changed = false;
    for (const i of idxs) { if (per[i] > 1 && colors[i].denom * per[i] > 0.55 * total) { per[i]--; changed = true; break; } }
    if (!changed) break;
  }
  return { per, stackValue: colors.reduce((s, c, i) => s + c.denom * per[i], 0) };
}

export const normHex = (h) => { if (typeof h !== "string") return null; const s = h.trim(); return /^#?[0-9a-fA-F]{6}$/.test(s) ? (s[0] === "#" ? s : "#" + s) : null; };

export function hexToRgb(h) { let x = (h || "#000000").replace("#", ""); if (x.length === 3) x = x.split("").map(c => c + c).join(""); const n = parseInt(x, 16) || 0; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }

export function nearestDenomIndex(hex, denoms) {
  const [r, g, b] = hexToRgb(hex || "#808080");
  let best = 0, bd = Infinity;
  denoms.forEach((d, i) => { const [R, G, B] = hexToRgb(d.c); const dist = (r - R) ** 2 + (g - G) ** 2 + (b - B) ** 2; if (dist < bd) { bd = dist; best = i; } });
  return best;
}

// Defensively parses a Messages API response from /api/vision into a chips array.
export function parseVisionChips(data) {
  const text = (data?.content || []).map(b => (b.type === "text" ? b.text : "")).join("\n");
  const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
  const chips = Array.isArray(parsed.chips) ? parsed.chips : [];
  if (!chips.length) throw new Error("empty");
  return chips;
}
