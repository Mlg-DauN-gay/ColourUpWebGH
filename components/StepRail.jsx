"use client";
import { C } from "@/lib/themes";
import { useL } from "@/lib/LangContext";

// The game's real sequence, always visible — set up → open → buy in → play
// → count → reconcile → settle. Honest structure, not decoration: this is
// literally which `gp` phase in app/page.jsx is active. Home and Done are
// the bookends and don't appear on the rail itself.
const STEPS = ["setup", "lobby", "fund", "live", "cashout", "reconcile", "settle"];
const LABEL_KEY = { setup: "railSetup", lobby: "railOpen", fund: "railBuyIn", live: "railPlay", cashout: "railCount", reconcile: "railCheck", settle: "railSettle" };

export default function StepRail({ gp }) {
  const { L } = useL();
  const idx = STEPS.indexOf(gp);
  if (idx === -1) return null;

  const activeLabel = L[LABEL_KEY[gp]];

  return (
    <div className="mb-5">
      <ol role="list" aria-label={L.stepOf(idx + 1, STEPS.length, activeLabel)} className="flex items-center">
        {STEPS.map((step, i) => {
          const state = i < idx ? "done" : i === idx ? "current" : "upcoming";
          const label = L[LABEL_KEY[step]];
          return (
            <li key={step} className="flex items-center" style={{ flex: i === STEPS.length - 1 ? "0 0 auto" : "1 1 auto" }}>
              <span
                aria-current={state === "current" ? "step" : undefined}
                aria-label={state === "done" ? L.stepDone(label) : state === "current" ? label : L.stepUpcoming(label)}
                className="shrink-0 grid place-items-center rounded-full"
                style={{
                  width: state === "current" ? 12 : 8, height: state === "current" ? 12 : 8,
                  background: state === "upcoming" ? "transparent" : state === "done" ? C.brass : C.gold,
                  border: `1.5px solid ${state === "upcoming" ? C.line : state === "done" ? C.brass : C.gold}`,
                  boxShadow: state === "current" ? `0 0 0 4px ${C.brassSoft}` : "none",
                  transition: "all .25s ease",
                }}
              />
              {i < STEPS.length - 1 && (
                <span aria-hidden="true" className="flex-1" style={{ height: 0, borderTop: `2px dashed ${i < idx ? C.brass : C.line}`, margin: "0 3px" }} />
              )}
            </li>
          );
        })}
      </ol>
      <div className="mono mt-2" style={{ fontSize: 10.5, letterSpacing: ".1em", color: C.mute, textTransform: "uppercase" }}>
        {L.stepOf(idx + 1, STEPS.length, activeLabel)}
      </div>
    </div>
  );
}
