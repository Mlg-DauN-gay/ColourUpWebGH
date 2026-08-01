"use client";
import { useEffect, useState } from "react";
import QRCodeLib from "qrcode";

// A real, scannable QR code encoding `value` (the join URL). Rendered as an
// SVG data URL so it stays crisp at any size.
export default function QRCode({ value, size = 168, fg = "#141018", bg = "#F4F1EA" }) {
  const [svg, setSvg] = useState(null);

  useEffect(() => {
    let cancelled = false;
    QRCodeLib.toString(value, { type: "svg", margin: 1, width: size, color: { dark: fg, light: bg } })
      .then((s) => { if (!cancelled) setSvg(s); })
      .catch(() => { if (!cancelled) setSvg(null); });
    return () => { cancelled = true; };
  }, [value, fg, bg, size]);

  if (!svg) {
    return <div style={{ width: size, height: size, background: bg, borderRadius: 12 }} />;
  }
  return (
    <div
      style={{ width: size, height: size, borderRadius: 12, overflow: "hidden", display: "block" }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
