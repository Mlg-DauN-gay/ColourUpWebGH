/* ═══════════════════════ exact-cent money ═══════════════════════
   Settlement has to sum to precisely zero — plain floats can't promise
   that (0.1 + 0.2 !== 0.3), and the old `simplify()`'s `< 0.005` epsilon
   thresholds were a symptom of exactly that, not a real fix. Everything
   in the actual receipt (nets, transfers) is computed in integer minor
   units (cents/tiyin/kopecks) via this module; only entry (user types a
   buy-in) and display (money() in lib/i18n.js) ever touch major units. */

export const toMinor = (major) => Math.round((Number(major) || 0) * 100);
export const toMajor = (minor) => minor / 100;

// Largest-remainder (Hamilton) apportionment: split `totalMinor` integer
// minor units across `weights` proportionally, as integers, so the shares
// sum to exactly `totalMinor` — no cent lost or invented to independent
// rounding. This is how the pot (total buy-ins) divides by final chip
// count without the old chips/rate float division drifting.
export function distributeLargestRemainder(totalMinor, weights) {
  const weightSum = weights.reduce((a, b) => a + b, 0);
  if (weightSum <= 0) return weights.map(() => 0);
  const raw = weights.map((w) => (totalMinor * w) / weightSum);
  const shares = raw.map(Math.floor);
  const used = shares.reduce((a, b) => a + b, 0);
  const remainder = Math.max(0, Math.min(totalMinor - used, weights.length));
  const byFraction = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < remainder; k++) shares[byFraction[k].i] += 1;
  return shares;
}
