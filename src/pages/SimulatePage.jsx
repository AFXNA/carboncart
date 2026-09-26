import { useMemo, useState } from "react";
import { CATEGORIES } from "../data/products";
import { AXES } from "../data/emissionFactors";
import { CATALOG } from "../lib/calculator";
import { fmt } from "../lib/format";
import SliderField from "../components/SliderField";

const KG_PER_TREE_YEAR = 21;

// Linear projection: purchases/year × share swapped × (lowest-CO₂ option − baseline). No AI involved.
function project(settings) {
  const total = { co2: 0, water: 0, waste: 0, energy: 0 };
  const rows = CATEGORIES.map((c) => {
    const { qty, share } = settings[c.name];
    const items = CATALOG.filter((p) => p.category === c.name);
    const base = items[0];
    const best = items.reduce((a, b) => (a.impact.co2 < b.impact.co2 ? a : b));
    const n = qty * c.perYear * share;
    AXES.forEach(({ key }) => (total[key] += n * (best.impact[key] - base.impact[key])));
    return { category: c.name, base, best, co2: n * (best.impact.co2 - base.impact.co2) };
  });
  return { total, rows };
}

export default function SimulatePage() {
  const [settings, setSettings] = useState(
    Object.fromEntries(CATEGORIES.map((c) => [c.name, { qty: c.defaultQty, share: 0.5 }]))
  );
  const [people, setPeople] = useState(10000);
  const { total, rows } = useMemo(() => project(settings), [settings]);
  const update = (name, patch) => setSettings((s) => ({ ...s, [name]: { ...s[name], ...patch } }));

  return (
    <>
      <div className="card">
        <h2>Impact simulator</h2>
        <p className="mute">Project a year of impact from category-level changes. Linear math, fully auditable.</p>
        {CATEGORIES.map((c) => (
          <div key={c.name}>
            <SliderField
              label={c.label} min={0} max={c.max} value={settings[c.name].qty}
              onChange={(e) => update(c.name, { qty: +e.target.value })}
            />
            <SliderField
              label="% swapped to lowest-CO₂ option" min={0} max={100} value={settings[c.name].share * 100}
              display={`${Math.round(settings[c.name].share * 100)}%`}
              onChange={(e) => update(c.name, { share: +e.target.value / 100 })}
            />
          </div>
        ))}
      </div>

      <div className="card">
        <h2>Your annual change</h2>
        <div className="big">{fmt(-total.co2)} kg CO₂ saved / year</div>
        <div className="mute">
          {fmt(-total.water)} L water · {fmt(-total.waste)} kg waste · {fmt(-total.energy)} MJ energy
        </div>
        <table className="gap-top">
          <thead><tr><th>Category</th><th>Swap</th><th>CO₂ / yr</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.category}>
                <td>{r.category}</td>
                <td>{r.base.name} → {r.best.name}</td>
                <td className={r.co2 < 0 ? "good" : ""}>{fmt(r.co2)} kg</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Community impact</h2>
        <SliderField
          label="If this many people did the same" min={100} max={1000000} step={100}
          value={people} display={people.toLocaleString()} onChange={(e) => setPeople(+e.target.value)}
        />
        <div className="big">{fmt((-total.co2 * people) / 1000)} tonnes CO₂ / year</div>
        <div className="mute">
          {fmt((-total.water * people) / 1e6)} million L water · ≈{" "}
          {Math.round((-total.co2 * people) / KG_PER_TREE_YEAR).toLocaleString()} tree-years of absorption
        </div>
      </div>
    </>
  );
}
