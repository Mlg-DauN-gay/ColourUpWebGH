"use client";
import { C } from "@/lib/themes";

export const Chip = ({ size = 26, color = C.brass, spot = "rgba(255,255,255,.55)" }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" style={{ display: "block" }}>
    <circle cx="20" cy="20" r="19" fill={color} />
    <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(0,0,0,.4)" strokeWidth="4" strokeDasharray="7 6" />
    <circle cx="20" cy="20" r="12.5" fill="none" stroke={spot} strokeWidth="1.4" opacity=".7" />
    <circle cx="20" cy="20" r="9" fill="rgba(0,0,0,.18)" />
  </svg>
);

export const Eyebrow = ({ children, tone = C.mute }) => (
  <div style={{ font: "600 10px/1 'IBM Plex Mono', monospace", letterSpacing: ".16em", textTransform: "uppercase", color: tone }}>{children}</div>
);

export const Btn = ({ children, onClick, disabled, tone = "brass", full, small }) => {
  const map = { brass: { bg: C.brass, fg: C.onAccent, bd: C.brass }, ghost: { bg: "transparent", fg: C.ivory, bd: C.line }, danger: { bg: "transparent", fg: C.lose, bd: C.lose } }[tone];
  return (
    <button onClick={onClick} disabled={disabled} className={`${full ? "w-full" : ""} rounded-lg transition-opacity`}
      style={{ background: map.bg, color: map.fg, border: `1px solid ${map.bd}`, padding: small ? "8px 12px" : "13px 18px",
        font: `600 ${small ? 12 : 14}px 'Inter Tight', system-ui, sans-serif`, letterSpacing: ".01em", opacity: disabled ? 0.35 : 1, cursor: disabled ? "not-allowed" : "pointer" }}>{children}</button>
  );
};

export const Field = ({ label, suffix, ...p }) => (
  <label className="block">
    <Eyebrow>{label}</Eyebrow>
    <div className="flex items-baseline gap-2 mt-2 pb-2" style={{ borderBottom: `1px solid ${C.line}` }}>
      <input {...p} className="bg-transparent outline-none w-full" style={{ font: "500 22px 'IBM Plex Mono', monospace", color: C.ivory }} />
      {suffix && <span style={{ font: "400 12px 'IBM Plex Mono',monospace", color: C.mute }}>{suffix}</span>}
    </div>
  </label>
);

export const Row = ({ children, onClick, active }) => (
  <div onClick={onClick} className="flex items-center gap-3 px-4 py-3 rounded-xl"
    style={{ background: active ? C.raise : C.room, border: `1px solid ${active ? C.line : "transparent"}`, cursor: onClick ? "pointer" : "default" }}>{children}</div>
);

export const Dot = ({ p, size = 30 }) => (
  <div className="shrink-0 grid place-items-center rounded-full"
    style={{ width: size, height: size, background: p.color + "22", border: `1.5px solid ${p.color}`, color: p.color, font: `700 ${size / 2.6}px 'Inter Tight',sans-serif` }}>
    {(p.name || "?").slice(0, 1).toUpperCase()}</div>
);
