import { useState } from "react";
import { fmt, money, pct } from "../lib/format";

// Price-vs-impact tradeoff for one alternative.
export default function AlternativeCard({ alt, base, best, onSwitch, onPass }) {
  const dCo2 = alt.impact.co2 / base.impact.co2 - 1;
  const dWater = alt.impact.water / base.impact.water - 1;
  const [passed, setPassed] = useState(false);

  return (
    <div className={`alt ${best ? "best" : ""}`} style={{ opacity: passed ? 0.4 : 1 }}>
      <div>
        <b>{alt.emoji} {alt.name}</b>
        {best && <span className="pill">best for you</span>}
        <div className="mute">
          CO₂ {fmt(alt.impact.co2)} kg · water {fmt(alt.impact.water)} L · waste {fmt(alt.impact.waste)} kg
        </div>
        <div className={`delta ${dCo2 < 0 ? "good" : "bad"}`}>
          {money(alt.price - base.price)} for {pct(dCo2)} CO₂ · {pct(dWater)} water
        </div>
      </div>
      <div className="row">
        <button className="primary" onClick={onSwitch}>Switch</button>
        <button onClick={() => { setPassed(true); onPass(); }}>Pass</button>
      </div>
    </div>
  );
}
