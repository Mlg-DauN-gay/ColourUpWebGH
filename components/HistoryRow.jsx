"use client";
import { C } from "@/lib/themes";
import { DICT } from "@/lib/i18n";
import { useL } from "@/lib/LangContext";
import { Row } from "./atoms";

export default function HistoryRow({ h }) {
  const { M, lang } = useL();
  const w = h.meNet >= 0;
  const d = new Date(h.date);
  const mon = d.toLocaleDateString(DICT[lang]._loc, { month: "short" }).replace(".", "");
  const full = d.toLocaleDateString(DICT[lang]._loc, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString(DICT[lang]._loc, { hour: "2-digit", minute: "2-digit" });
  return (
    <Row>
      <div className="grid shrink-0 rounded-lg text-center" style={{ width: 40, height: 40, background: C.raise, border: `1px solid ${C.line}`, placeItems: "center", lineHeight: 1 }}>
        <span className="mono" style={{ fontSize: 8, color: C.brass, letterSpacing: ".06em", textTransform: "uppercase" }}>{mon}</span>
        <span className="disp" style={{ fontSize: 16, fontWeight: 800, marginTop: 2 }}>{d.getDate()}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{h.title}</div>
        <div className="mono" style={{ fontSize: 10.5, color: C.mute }}>{full} · {time} · {Math.floor(h.duration / 3600)}h {Math.floor(h.duration / 60) % 60}m</div>
      </div>
      <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: w ? C.win : C.lose }}>{w ? "+" : "−"}{M(h.meNet, h.cur)}</span>
    </Row>
  );
}
