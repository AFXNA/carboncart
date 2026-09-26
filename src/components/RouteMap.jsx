// Schematic equirectangular route map. Swap for Leaflet/Mapbox tiles in production.
const W = 680, H = 340;
const px = (lon) => ((lon + 180) / 360) * W;
const py = (lat) => ((90 - lat) / 180) * H;

export default function RouteMap({ origin, destination }) {
  const [oName, oLat, oLon] = origin;
  const [dName, dLat, dLon] = destination;
  const ctrlX = (px(oLon) + px(dLon)) / 2;
  const ctrlY = Math.min(py(oLat), py(dLat)) - Math.abs(px(oLon) - px(dLon)) / 5;

  const lons = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150];
  const lats = [-60, -30, 0, 30, 60];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Route from ${oName} to ${dName}`}>
      <rect width={W} height={H} rx="10" fill="var(--bg)" />
      {lons.map((l) => <line key={l} x1={px(l)} x2={px(l)} y1="0" y2={H} stroke="var(--line)" />)}
      {lats.map((l) => <line key={l} y1={py(l)} y2={py(l)} x1="0" x2={W} stroke="var(--line)" />)}
      <path
        d={`M${px(oLon)},${py(oLat)} Q${ctrlX},${ctrlY} ${px(dLon)},${py(dLat)}`}
        fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeDasharray="6 5"
      />
      <circle cx={px(oLon)} cy={py(oLat)} r="6" fill="var(--warn)" />
      <circle cx={px(dLon)} cy={py(dLat)} r="6" fill="var(--accent)" />
      <text className="map-label" x={px(oLon) + 9} y={py(oLat) - 8}>{oName}</text>
      <text className="map-label" x={px(dLon) + 9} y={py(dLat) + 16}>{dName}</text>
    </svg>
  );
}
