import { useApp } from "../context/AppContext";
import { TRANSPORT } from "../data/emissionFactors";
import { transportCo2 } from "../lib/calculator";
import { fmt } from "../lib/format";
import Globe from "../components/Globe";
import Safe from "../components/Safe";
import RouteMap from "../components/RouteMap";

export default function MapPage() {
  const { current: p } = useApp();
  if (!p) return <div className="card mute">Scan a product to see where it comes from.</div>;
  const [o, d] = [p.origin, p.destination];

  return (
    <>
      <div className="card globe-card">
        <div className="globe-head">
          <h2>{p.emoji} {p.name}</h2>
          <span className="mute">{o[0]} → {d[0]}</span>
        </div>
        <Safe fallback={<div style={{ height: 8 }} />}><Globe origin={o} destination={d} height={340} label="Globe route" /></Safe>
        <div className="stats">
          <div><small>Distance</small><b>{p.route.km.toLocaleString()} km</b></div>
          <div><small>Mode</small><b>{p.route.mode}</b></div>
          <div><small>Transport CO₂</small><b>{fmt(transportCo2(p))} kg</b></div>
        </div>
      </div>
      <div className="card">
        <h2>Route map</h2>
        <RouteMap origin={o} destination={d} />
        <p className="mute">
          Emission factor source: <span className="chip">{TRANSPORT[p.route.mode].src}</span>
        </p>
      </div>
    </>
  );
}
