import { useApp } from "../context/AppContext";
import { TRANSPORT } from "../data/emissionFactors";
import { transportCo2 } from "../lib/calculator";
import { fmt } from "../lib/format";
import RouteMap from "../components/RouteMap";

export default function MapPage() {
  const { current: p } = useApp();
  if (!p) return <div className="card mute">Scan a product to see where it comes from.</div>;

  return (
    <div className="card">
      <h2>Impact map</h2>
      <RouteMap origin={p.origin} destination={p.destination} />
      <h3>{p.emoji} {p.name}</h3>
      <table>
        <tbody>
          <tr><th>Origin</th><td>{p.origin[0]}</td></tr>
          <tr><th>Destination</th><td>{p.destination[0]}</td></tr>
          <tr><th>Mode</th><td>{p.route.mode} · {p.route.km.toLocaleString()} km</td></tr>
          <tr>
            <th>Transport CO₂</th>
            <td>{fmt(transportCo2(p))} kg <span className="chip">{TRANSPORT[p.route.mode].src}</span></td>
          </tr>
        </tbody>
      </table>
      <p className="mute">Schematic projection; production would render Mapbox/Leaflet tiles.</p>
    </div>
  );
}
