import { useState } from "react";
import { CATALOG, preferenceScore } from "../lib/calculator";
import { fmt } from "../lib/format";
import { useApp } from "../context/AppContext";
import AlternativeCard from "../components/AlternativeCard";

export default function SwapPage() {
  const { current, prefs, acceptSwap, rejectSwap } = useApp();
  const [message, setMessage] = useState(null);

  if (!current) return <div className="card mute">Scan a product to compare alternatives.</div>;

  // Ranked by the user's priorities rather than a single "best" pick.
  const alts = CATALOG.filter((p) => p.category === current.category && p.id !== current.id).sort(
    (a, b) => preferenceScore(b, current, prefs) - preferenceScore(a, current, prefs)
  );

  const onSwitch = (alt) => {
    acceptSwap(alt);
    setMessage(
      `Logged. You'd save ${fmt(current.impact.co2 - alt.impact.co2)} kg CO₂ and ` +
        `${fmt(current.impact.water - alt.impact.water)} L water per purchase. Your profile learned from this choice.`
    );
  };

  return (
    <div className="card">
      <h2>Instead of {current.emoji} {current.name}</h2>
      <p className="mute">Ranked by your priorities. Cost vs. impact shown side by side.</p>
      {alts.length ? (
        alts.map((a, i) => (
          <AlternativeCard
            key={a.id} alt={a} base={current} best={i === 0}
            onSwitch={() => onSwitch(a)} onPass={rejectSwap}
          />
        ))
      ) : (
        <p className="mute">No alternatives in this category yet.</p>
      )}
      {message && <div className="evbox">✅ {message}</div>}
    </div>
  );
}
