import { AXES } from "../data/emissionFactors";
import { CATALOG } from "../lib/calculator";
import { useApp } from "../context/AppContext";
import Safe from "./Safe";
import ImpactOrb from "./ImpactOrb";
import ScoreRing from "./ScoreRing";
import ImpactAxes from "./ImpactAxes";
import EvidencePanel from "./EvidencePanel";

export default function ProductCard({ product: p }) {
  const { setTab } = useApp();
  // Scale bars against the highest value in the same category.
  const peers = CATALOG.filter((x) => x.category === p.category);
  const max = Object.fromEntries(AXES.map((a) => [a.key, Math.max(...peers.map((x) => x.impact[a.key]))]));

  const score = Math.round(100 * (1 - AXES.reduce((s, a) => s + (max[a.key] ? p.impact[a.key] / max[a.key] : 0), 0) / AXES.length));
  return (
    <div className="card product">
      <div className="row">
        <span className="emoji">{p.emoji}</span>
        <div className="grow">
          <h2 className="flush">{p.name}</h2>
          <span className="mute">
            {p.category} · ${p.price.toFixed(2)} · {p.lifespan}
          </span>
        </div>
      </div>

      <div className="score-row"><ScoreRing score={score} /><Safe fallback={<span />}><ImpactOrb score={score} /></Safe><p className="mute">Lower footprint than peers scores higher. The orb gets spikier and hotter as impact rises.</p></div>

      <h3>
        Impact vector <EvidencePanel evidence={p.evidence} />
      </h3>
      <ImpactAxes impact={p.impact} max={max} />

      <h3>Product intelligence</h3>
      <table>
        <tbody>
          <tr><th>Materials</th><td>{p.bom.map(([m, kg]) => `${m} (${kg} kg)`).join(", ")}</td></tr>
          <tr><th>Packaging</th><td>{p.packaging.map(([m]) => m).join(", ")}</td></tr>
          <tr><th>Transport</th><td>{p.route.mode}, ~{p.route.km.toLocaleString()} km</td></tr>
          <tr><th>Lifespan</th><td>{p.lifespan}</td></tr>
        </tbody>
      </table>

      <div className="row gap-top">
        <button className="primary" onClick={() => setTab("swap")}>See alternatives →</button>
        <button onClick={() => setTab("map")}>View supply chain</button>
      </div>
    </div>
  );
}
