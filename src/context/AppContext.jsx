import { createContext, useContext, useState } from "react";
import { usePersistentState } from "../hooks/usePersistentState";
import { AXES } from "../data/emissionFactors";
import { findProduct } from "../lib/calculator";

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

const DEFAULT_PREFS = { co2: 70, water: 40, waste: 30, energy: 20, budget: 50 };
const clamp = (n) => Math.min(100, Math.max(0, n));

// Per-axis savings for one logged swap. Older entries stored only a CO₂ number (or nothing);
// web-search products aren't in the catalog, so new entries store the deltas up front.
function savedOf(s) {
  if (s.saved && typeof s.saved === "object") return s.saved;
  if (typeof s.saved === "number") return { co2: s.saved };
  const from = findProduct(s.from), to = findProduct(s.to);
  return from && to ? Object.fromEntries(AXES.map(({ key }) => [key, from.impact[key] - to.impact[key]])) : {};
}

export function AppProvider({ children }) {
  const [tab, setTab] = useState("scan");
  const [current, setCurrent] = useState(null);
  const [prefs, setPrefs] = usePersistentState("cc-prefs", DEFAULT_PREFS);
  const [history, setHistory] = usePersistentState("cc-history", []);
  const [swaps, setSwaps] = usePersistentState("cc-swaps", []);

  const scan = (product) => {
    setCurrent(product);
    setHistory((h) => [{ id: product.id, t: Date.now() }, ...h].slice(0, 50));
  };

  // Simple preference learning: accepting a swap raises CO₂ weight, passing raises budget sensitivity.
  const acceptSwap = (to) => {
    const saved = Object.fromEntries(AXES.map(({ key }) => [key, current.impact[key] - to.impact[key]]));
    setSwaps((s) => [...s, { from: current.id, to: to.id, saved, t: Date.now() }]);
    setPrefs((p) => ({ ...p, co2: clamp(p.co2 + 3) }));
  };
  const rejectSwap = () => setPrefs((p) => ({ ...p, budget: clamp(p.budget + 4) }));

  const saved = swaps.reduce(
    (total, s) => {
      const d = savedOf(s);
      return Object.fromEntries(AXES.map(({ key }) => [key, total[key] + (d[key] ?? 0)]));
    },
    { co2: 0, water: 0, waste: 0, energy: 0 }
  );

  const value = { tab, setTab, current, scan, prefs, setPrefs, history, swaps, acceptSwap, rejectSwap, co2Avoided: saved.co2, saved };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
