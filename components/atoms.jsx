"use client";
import { C } from "@/lib/themes";

// The brand mark and the root of the signature motif — a chip's milled edge,
// drawn once here as a dashed ring, then reused as `.chip-edge`/`.chip-ring`
// everywhere the app needs a divider.
export const Chip = ({ size = 26, color = C.brass, spot = "rgba(255,255,255,.4)" }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" style={{ display: "block" }}>
    <circle cx="20" cy="20" r="19" fill={color} />
    <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(0,0,0,.45)" strokeWidth="4" strokeDasharray="7 6" />
    <circle cx="20" cy="20" r="12.5" fill="none" stroke={spot} strokeWidth="1.4" opacity=".7" />
    <circle cx="20" cy="20" r="9" fill="rgba(0,0,0,.2)" />
  </svg>
);

export const Eyebrow = ({ children, tone = C.mute }) => (
  <div style={{ font: "600 10px/1.3 var(--font-body), system-ui, sans-serif", letterSpacing: ".14em", textTransform: "uppercase", color: tone }}>{children}</div>
);

export const Btn = ({ children, onClick, disabled, tone = "brass", full, small, type = "button", "aria-label": ariaLabel }) => {
  const map = {
    brass: { bg: C.brass, fg: C.onAccent, bd: C.brass },
    ghost: { bg: C.raise, fg: C.ivory, bd: C.line },
    danger: { bg: "transparent", fg: C.lose, bd: C.lose },
  }[tone];
  return (
    <button type={type} onClick={onClick} disabled={disabled} aria-label={ariaLabel}
      className={`${full ? "w-full" : ""} rounded-xl transition-opacity`}
      style={{
        background: map.bg, color: map.fg, border: `1px solid ${map.bd}`,
        padding: small ? "9px 14px" : "14px 18px", minHeight: small ? 36 : 48,
        font: `600 ${small ? 12 : 14.5}px var(--font-body), system-ui, sans-serif`, letterSpacing: ".01em",
        opacity: disabled ? 0.35 : 1, cursor: disabled ? "not-allowed" : "pointer",
      }}>
      {children}
    </button>
  );
};

export const Field = ({ label, suffix, numeric, ...p }) => (
  <label className="block">
    <Eyebrow>{label}</Eyebrow>
    <div className="flex items-baseline gap-2 mt-2 pb-2" style={{ borderBottom: `2px dashed ${C.line}` }}>
      <input {...p} className={`bg-transparent outline-none w-full ${numeric ? "figure" : ""}`}
        style={{ font: `500 22px ${numeric ? "var(--font-mono), ui-monospace, monospace" : "var(--font-body), system-ui, sans-serif"}`, color: C.ivory }} />
      {suffix && <span className="figure" style={{ fontSize: 12, color: C.mute }}>{suffix}</span>}
    </div>
  </label>
);

// A clickable roster/list row. Accessible as a real control when `onClick`
// is passed — a poker roster is exactly the kind of list a keyboard or
// screen-reader user needs to be able to step through and act on.
export const Row = ({ children, onClick, active, "aria-label": ariaLabel }) => (
  <div
    onClick={onClick}
    role={onClick ? "button" : undefined}
    tabIndex={onClick ? 0 : undefined}
    aria-label={ariaLabel}
    onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(e); } } : undefined}
    className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors"
    style={{ background: active ? C.raise : C.felt, border: `1px solid ${active ? C.brass : C.line}`, cursor: onClick ? "pointer" : "default" }}>
    {children}
  </div>
);

export const Dot = ({ p, size = 30 }) => (
  <div className="shrink-0 grid place-items-center rounded-full chip-ring"
    style={{ width: size, height: size, background: p.color + "26", color: p.color, font: `700 ${size / 2.6}px var(--font-body),sans-serif` }}>
    {(p.name || "?").slice(0, 1).toUpperCase()}</div>
);

// Big money/count figures — the signature numeral treatment. Tabular Plex
// Mono, underlined by the chip's own dashed edge instead of a hairline.
export const Figure = ({ children, size = 32, color = C.ivory, edge = true }) => (
  <div className="figure" style={{ fontSize: size, fontWeight: 600, color, lineHeight: 1.1, display: "inline-block", paddingBottom: edge ? 6 : 0, borderBottom: edge ? `2px dashed ${C.line}` : "none" }}>
    {children}
  </div>
);
