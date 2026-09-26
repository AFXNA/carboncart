import { useApp } from "../context/AppContext";
import { fmt } from "../lib/format";

const TILES = [
  { key: "co2", icon: "🌫️", label: "CO₂ avoided", unit: "kg", color: "var(--co2)" },
  { key: "water", icon: "💧", label: "Water saved", unit: "L", color: "var(--water)" },
  { key: "waste", icon: "♻️", label: "Waste avoided", unit: "kg", color: "var(--waste)" },
  { key: "energy", icon: "⚡", label: "Energy saved", unit: "MJ", color: "var(--energy)" },
];

// Everyday equivalents. Rough public figures: ~21 kg CO₂/tree-year, ~0.25 kg CO₂/km driven,
// ~65 L per 8-minute shower, 3.6 MJ per kWh.
const equivalents = (s) => [
  { icon: "🌳", value: s.co2 / 21, text: "tree-years of CO₂ absorption" },
  { icon: "🚗", value: s.co2 / 0.25, text: "km of driving avoided" },
  { icon: "🚿", value: s.water / 65, text: "showers' worth of water" },
  { icon: "💡", value: s.energy / 3.6, text: "kWh of electricity" },
];

export default function ProfilePage() {
  const { swaps, saved } = useApp();
  const anySaved = swaps.length > 0;
  const eq = equivalents(saved);

  return (
    <>
      <img className="robot-banner" src={`${import.meta.env.BASE_URL}robot-small.jpg`} alt="CarbonCart robot mascot" />
      <div className="card saved-card">
        <h2>🌍 Resources you've saved</h2>
        {anySaved ? (
          <p className="mute">Across {swaps.length} swap{swaps.length === 1 ? "" : "s"} you chose over the original product.</p>
        ) : (
          <p className="mute">Nothing yet. Scan a product, open Swap, and pick a lower-impact alternative to start tracking.</p>
        )}
        <div className="saved-grid">
          {TILES.map((t) => (
            <div className="saved-tile" key={t.key} style={{ "--tile": t.color }}>
              <span className="saved-icon" aria-hidden="true">{t.icon}</span>
              <b>{fmt(saved[t.key])}<small> {t.unit}</small></b>
              <span>{t.label}</span>
            </div>
          ))}
        </div>
        {anySaved && (
          <div className="equivs">
            {eq.filter((e) => e.value >= 0.05).map((e) => (
              <span key={e.text} className="chip">{e.icon} ≈ {fmt(e.value, 1)} {e.text}</span>
            ))}
          </div>
        )}
      </div>

    </>
  );
}
