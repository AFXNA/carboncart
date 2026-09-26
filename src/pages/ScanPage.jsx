import { useState } from "react";
import { CATALOG, findByQuery } from "../lib/calculator";
import { useApp } from "../context/AppContext";
import ProductCard from "../components/ProductCard";

const DEMOS = CATALOG.filter((p) => p.barcode);

export default function ScanPage() {
  const { current, scan } = useApp();
  const [query, setQuery] = useState("");
  const [scanning, setScanning] = useState(false);
  const [miss, setMiss] = useState(null);

  const lookup = () => {
    if (!query.trim()) return;
    const p = findByQuery(query);
    if (p) { setMiss(null); scan(p); } else setMiss(query);
  };

  // Simulated camera: in production, decode with ZXing/quagga, falling back to the vision model.
  const startCamera = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      scan(DEMOS[Math.floor(Math.random() * DEMOS.length)]);
    }, 1800);
  };

  return (
    <>
      <div className="card">
        <h2>Scan a product</h2>
        <div className="row">
          <input
            className="grow" type="text" value={query} placeholder="Enter barcode or product name"
            aria-label="Barcode or product name"
            onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && lookup()}
          />
          <button className="primary" onClick={lookup}>Look up</button>
        </div>
        <div className="row gap-top">
          <button onClick={startCamera}>📷 Scan barcode / photo</button>
        </div>
        {scanning && (
          <div className="viewfinder"><p>Point camera at a barcode… (demo)</p></div>
        )}
        <div className="mute gap-top">
          Try a demo item:
          <div className="demo">
            {DEMOS.map((p) => (
              <button key={p.id} className="chip" onClick={() => { setMiss(null); scan(p); }}>
                {p.emoji} {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {miss && (
        <div className="card">
          No match for “{miss}”. In production, the vision model would identify it from a photo.
        </div>
      )}
      {current && <ProductCard product={current} />}
    </>
  );
}
