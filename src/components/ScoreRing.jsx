// Animated circular eco score (0-100, higher is better).
export default function ScoreRing({ score }) {
  const r = 34, c = 2 * Math.PI * r;
  const hue = Math.round((score / 100) * 130);
  return (
    <div className="ring" aria-label={`Eco score ${score} out of 100`}>
      <svg viewBox="0 0 80 80" width="88" height="88">
        <circle cx="40" cy="40" r={r} fill="none" stroke="var(--line)" strokeWidth="7" />
        <circle cx="40" cy="40" r={r} fill="none" stroke={`hsl(${hue} 70% 48%)`} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} transform="rotate(-90 40 40)"
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(.2,.8,.2,1)" }} />
      </svg>
      <b>{score}</b>
      <small>Eco Score</small>
    </div>
  );
}
