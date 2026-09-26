import { useState } from "react";

// Evidence layer: expandable citations for every number in the impact vector.
export default function EvidencePanel({ evidence }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="ev" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        evidence
      </button>
      {open && (
        <div className="evbox">
          <b>Where these numbers come from</b>
          <table>
            <thead>
              <tr><th>Claim</th><th>Value</th><th>Source</th></tr>
            </thead>
            <tbody>
              {evidence.map((e, i) => (
                <tr key={i}>
                  <td>{e.claim}</td>
                  <td>{e.value}</td>
                  <td>
                    <span className="chip">{e.sourceType}</span> {e.sourceRef}
                    <div className="conf">confidence: {e.confidence}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mute">
            The AI only extracted materials and transport facts. The CO₂ math is a deterministic calculator, never a
            model guess.
          </p>
        </div>
      )}
    </>
  );
}
