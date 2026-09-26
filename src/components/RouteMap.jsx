// Flat world map (real Earth imagery, equirectangular) with an animated route.
const W = 1024, H = 512;
const px = (lon) => ((lon + 180) / 360) * W;
const py = (lat) => ((90 - lat) / 180) * H;

export default function RouteMap({ origin, destination }) {
  const [oName, oLat, oLon] = origin;
  const [dName, dLat, dLon] = destination;
  const x1 = px(oLon), y1 = py(oLat), x2 = px(dLon), y2 = py(dLat);
  const d = `M${x1},${y1} Q${(x1 + x2) / 2},${Math.min(y1, y2) - Math.hypot(x2 - x1, y2 - y1) / 4} ${x2},${y2}`;
  const tag = (x, y, name) => (
    <g transform={`translate(${Math.min(Math.max(x, 70), W - 70)},${y})`}>
      <rect x="-62" y={y < 60 ? 12 : -34} width="124" height="22" rx="11" fill="rgba(10,16,13,.78)" />
      <text textAnchor="middle" y={y < 60 ? 27 : -19} fill="#fff" fontSize="12" fontWeight="600">{name}</text>
    </g>
  );

  return (
    <svg className="routemap" viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Route from ${oName} to ${dName}`}>
      <image href={`${import.meta.env.BASE_URL}earth.jpg`} width={W} height={H} />
      <rect width={W} height={H} fill="rgba(8,20,14,.35)" />
      <path d={d} fill="none" stroke="#6ee7a8" strokeWidth="3" strokeDasharray="10 8" strokeLinecap="round">
        <animate attributeName="stroke-dashoffset" from="36" to="0" dur="1.2s" repeatCount="indefinite" />
      </path>
      {[[x1, y1, "#fb923c"], [x2, y2, "#4cc38a"]].map(([x, y, c], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="8" fill={c}>
            <animate attributeName="r" values="8;22" dur="1.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values=".6;0" dur="1.8s" repeatCount="indefinite" />
          </circle>
          <circle cx={x} cy={y} r="7" fill={c} stroke="#fff" strokeWidth="2" />
        </g>
      ))}
      {tag(x1, y1, oName)}
      {tag(x2, y2, dName)}
    </svg>
  );
}
