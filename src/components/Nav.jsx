import { useApp } from "../context/AppContext";

export const TABS = [
  { key: "scan", icon: "🔍", label: "Scan" },
  { key: "swap", icon: "🔁", label: "Swap" },
  { key: "chat", icon: "💬", label: "Ask AI" },
  { key: "map", icon: "🗺️", label: "Map" },
  { key: "me", icon: "👤", label: "Me" },
];

export default function Nav() {
  const { tab, setTab } = useApp();
  return (
    <nav className="nav">
      <div>
        {TABS.map((t) => (
          <button key={t.key} className={tab === t.key ? "on" : ""} onClick={() => setTab(t.key)}>
            {t.icon}
            <br />
            {t.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
