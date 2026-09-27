// In dev, Vite proxies /api to the local backend (see vite.config.js), and when the backend
// serves the built frontend itself they share an origin — both cases want a relative path.
// Only a split deployment (e.g. frontend on Vercel, backend on Render) needs an absolute base.
const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "";

export function apiUrl(path) {
  return `${API_BASE}${path}`;
}
