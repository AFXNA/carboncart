export const fmt = (n, digits = 2) =>
  Math.abs(n) >= 100 ? Math.round(n).toLocaleString() : n.toFixed(Math.abs(n) < 1 ? 3 : digits);

export const pct = (ratio) => `${ratio < 0 ? "−" : "+"}${Math.abs(ratio * 100).toFixed(0)}%`;

export const money = (n) => `${n >= 0 ? "+" : "−"}$${Math.abs(n).toFixed(2)}`;
