import { createContext, useContext, useState } from "react";
import { usePersistentState } from "../hooks/usePersistentState";
import { findProduct } from "../lib/calculator";

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

const DEFAULT_PREFS = { co2: 70, water: 40, waste: 30, energy: 20, budget: 50 };
const clamp = (n) => Math.min(100, Math.max(0, n));

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
    setSwaps((s) => [...s, { from: current.id, to: to.id, saved: current.impact.co2 - to.impact.co2, t: Date.now() }]);
    setPrefs((p) => ({ ...p, co2: clamp(p.co2 + 3) }));
  };
  const rejectSwap = () => setPrefs((p) => ({ ...p, budget: clamp(p.budget + 4) }));

  const co2Avoided = swaps.reduce(
    // Older entries lack `saved`; web-search products aren't in the catalog, so store the delta up front.
    (sum, s) => sum + (s.saved ?? findProduct(s.from).impact.co2 - findProduct(s.to).impact.co2),
    0
  );

  const value = { tab, setTab, current, scan, prefs, setPrefs, history, swaps, acceptSwap, rejectSwap, co2Avoided };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
