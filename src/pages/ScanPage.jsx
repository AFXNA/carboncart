import { useEffect, useRef, useState } from "react";
import { CATALOG, findByQuery, withImpact } from "../lib/calculator";
import { DESTINATION } from "../data/products";
import { useApp } from "../context/AppContext";
import ProductCard from "../components/ProductCard";

const DEMOS = CATALOG.filter((p) => p.barcode);

const CONFIDENCE_LABEL = {
  high: "✅ High confidence",
  medium: "⚠️ Medium confidence",
  low: "⚠️ Low confidence",
};

async function searchProducts(query, signal) {
  const response = await fetch("/api/products/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
    signal,
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("Search service is unavailable. Please try again.");
  }
  if (!response.ok) throw new Error(data.error || "Product search failed. Please try again.");
  // Run web picks through the same calculator as catalog products.
  return { ...data, query, picks: data.picks.map((p) => withImpact({ ...p, destination: DESTINATION })) };
}

function PickCard({ product: p, selected, onSelect }) {
  return (
    <button className={`pick-card${selected ? " on" : ""}`} aria-pressed={selected} onClick={() => onSelect(p)}>
      <div className="pick-main">
        {p.emoji} <strong>{p.name}</strong>
        {p.brand && <span className="mute"> · {p.brand}</span>}
      </div>
      {p.summary && <div className="pick-meta mute">{p.summary}</div>}
      <div className="pick-meta mute">{p.category} · ${p.price.toFixed(2)}</div>
      <span className={`confidence-badge confidence-${p.confidence}`}>{CONFIDENCE_LABEL[p.confidence]}</span>
    </button>
  );
}

function SearchResults({ results, selectedId, onSelect }) {
  if (!results.picks.length) {
    return (
      <section className="card">
        <p className="mute">No products found for "{results.query}". Try a more specific name or brand.</p>
      </section>
    );
  }
  return (
    <section className="card" aria-label="Product search results">
      <h2>Closest matches for "{results.query}"</h2>
      <p className="mute">Pick one to see its estimated impact. Materials and route are AI-inferred, then scored with the same emission factors as demo products.</p>
      <div className="pick-list">
        {results.picks.map((p) => (
          <PickCard key={p.id} product={p} selected={p.id === selectedId} onSelect={onSelect} />
        ))}
      </div>
      {results.sources.length > 0 && (
        <>
          <h3>Sources</h3>
          <ul>
            {results.sources.map((s) => (
              <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a></li>
            ))}
          </ul>
        </>
      )}
      {results.searchSuggestions && (
        <iframe
          className="search-suggestions" title="Google Search suggestions"
          sandbox="allow-popups allow-popups-to-escape-sandbox"
          referrerPolicy="no-referrer" srcDoc={results.searchSuggestions}
        />
      )}
    </section>
  );
}

export default function ScanPage() {
  const { current, scan } = useApp();
  const [query, setQuery] = useState("");
  const [scanning, setScanning] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState(null);
  const request = useRef(null);
  const cameraTimer = useRef(null);

  const cancelPending = () => {
    request.current?.abort();
    request.current = null;
    clearTimeout(cameraTimer.current);
  };
  useEffect(() => cancelPending, []);

  const reset = () => {
    cancelPending();
    setScanning(false);
    setSearching(false);
    setError("");
    setResults(null);
  };

  const selectProduct = (product) => {
    reset();
    scan(product);
  };

  const lookup = async (webOnly = false) => {
    const term = query.trim();
    if (!term) return;
    const match = !webOnly && findByQuery(term);
    if (match) return selectProduct(match);

    reset();
    setSearching(true);
    const controller = new AbortController();
    request.current = controller;
    try {
      setResults(await searchProducts(term, controller.signal));
    } catch (err) {
      if (!controller.signal.aborted) setError(err.message);
    } finally {
      if (request.current === controller) {
        request.current = null;
        setSearching(false);
      }
    }
  };

  // Simulated camera: in production, decode with ZXing/quagga, falling back to the vision model.
  const startCamera = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      scan(DEMOS[Math.floor(Math.random() * DEMOS.length)]);
    }, 1800);
  };

  const cannotSearch = searching || !query.trim();
  // While web results are on screen, only show the product card for one of their picks.
  const showCurrent = current && !searching && !error && (!results || results.picks.some((p) => p.id === current.id));

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

      {results && <SearchResults results={results} selectedId={current?.id} onSelect={scan} />}
      {showCurrent && <ProductCard product={current} />}
    </>
  );
}
