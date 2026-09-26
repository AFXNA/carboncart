import { useApp } from "../context/AppContext";
import { fmt } from "../lib/format";
import SliderField from "../components/SliderField";

const LABELS = { co2: "CO₂", water: "Water", waste: "Waste", energy: "Energy", budget: "Budget sensitivity" };

export default function ProfilePage() {
  const { prefs, setPrefs, history, swaps, co2Avoided } = useApp();
  return (
    <div className="card">
      <h2>Personal impact profile</h2>
      <p className="mute">CarbonCart learns what you care about. Adjust weights, or keep accepting and rejecting swaps.</p>
      {Object.entries(LABELS).map(([key, label]) => (
        <SliderField
          key={key} label={label} min={0} max={100} value={prefs[key]}
          onChange={(e) => setPrefs((p) => ({ ...p, [key]: +e.target.value }))}
        />
      ))}
      <h3>Habits</h3>
      <div className="row">
        <span className="chip">{history.length} scans</span>
        <span className="chip">{swaps.length} swaps</span>
        <span className="chip">{fmt(co2Avoided)} kg CO₂ avoided</span>
      </div>
    </div>
  );
}
