import { AXES } from "../data/emissionFactors";
import { fmt } from "../lib/format";

// Four-axis impact vector. `max` scales the bars (per-axis reference value).
export default function ImpactAxes({ impact, max }) {
  return (
    <div className="axes">
      {AXES.map((a) => (
        <div className="axis" key={a.key}>
          <small>{a.label}</small>
          <b>
            {fmt(impact[a.key])}
            <small> {a.unit}</small>
          </b>
          <div className="bar">
            <i style={{ width: `${Math.min(100, (impact[a.key] / max[a.key]) * 100)}%`, background: a.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}
