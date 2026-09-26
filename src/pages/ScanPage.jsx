import { useEffect, useRef, useState } from "react";
import { CATALOG, findByQuery, withImpact } from "../lib/calculator";
import { prepareImage } from "../lib/image";
import { DESTINATION } from "../data/products";
import { useApp } from "../context/AppContext";
import ProductCard from "../components/ProductCard";

const DEMOS = CATALOG.filter((p) => p.barcode);

const CONFIDENCE_LABEL = {
  high: "✅ High confidence",
  medium: "⚠️ Medium confidence",
  low: "⚠️ Low confidence",
};

async function searchProducts(query, signal, path = "/api/products/search", payload = { query }) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
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
  const [photo, setPhoto] = useState(null);
  const fileInput = useRef(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState(null);
  const request = useRef(null);

  const cancelPending = () => {
    request.current?.abort();
    request.current = null;
  };
  useEffect(() => cancelPending, []);

  const reset = () => {
    cancelPending();
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

  // Photo upload: Gemini identifies the product and estimates its materials; the calculator scores it.
  const onPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    reset();
    setSearching(true);
    const controller = new AbortController();
    request.current = controller;
    try {
      const { image, mime, url } = await prepareImage(file);
      setPhoto(url);
      setResults(await searchProducts("your photo", controller.signal, "/api/products/identify", { image, mime }));
    } catch (err) {
      if (!controller.signal.aborted) setError(err.message || "Could not read that image.");
    } finally {
      if (request.current === controller) {
        request.current = null;
        setSearching(false);
      }
    }
  };

  const cannotSearch = searching || !query.trim();
  // While web results are on screen, only show the product card for one of their picks.
  const showCurrent = current && !searching && !error && (!results || results.picks.some((p) => p.id === current.id));

  return (
    <>
      <div className="card">
        <h2>Snap a product</h2>
        <label className={`dropzone${searching ? " busy" : ""}`}>
          <input ref={fileInput} type="file" accept="image/*" capture="environment" hidden onChange={onPhoto} disabled={searching} />
          {photo ? <img src={photo} alt="Your uploaded product" /> : <span className="drop-emoji">📸</span>}
          <strong>{searching ? "Analyzing your photo…" : photo ? "Upload a different photo" : "Upload or take a photo"}</strong>
          <span className="mute">Gemini identifies the product and estimates its materials and shipping.</span>
        </label>
        <h3>Or search by name</h3>
        <form className="row" onSubmit={(e) => { e.preventDefault(); lookup(); }}>
          <input
            className="grow" type="text" value={query} placeholder="Product name or brand"
            aria-label="Product name or brand" maxLength={200}
            onChange={(e) => { reset(); setQuery(e.target.value); }}
          />
          <button className="primary" type="submit" disabled={cannotSearch}>Look up</button>
          <button type="button" disabled={cannotSearch} onClick={() => lookup(true)}>Search web with Gemini</button>
        </form>
        <p className="mute">Look up a demo product or search the web by name, brand, barcode, or description.</p>
        {searching && <p role="status">Finding the closest products with Gemini…</p>}
        {error && <p role="alert" className="bad">{error}</p>}
        <div className="mute gap-top">
          Try a demo item:
          <div className="demo">
            {DEMOS.map((p) => (
              <button key={p.id} className="chip" onClick={() => selectProduct(p)}>{p.emoji} {p.name}</button>
            ))}
          </div>
        </div>
      </div>

      {results && <SearchResults results={results} selectedId={current?.id} onSelect={scan} />}
      {showCurrent && <ProductCard product={current} />}
    </>
  );
}
