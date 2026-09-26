import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The Gemini-backed API lives in the Python service (backend/). Vite forwards /api/* to it,
// so the key stays server-side and the browser only ever talks to this origin.
const api = { "/api": { target: "http://127.0.0.1:8000", changeOrigin: true, timeout: 120_000 } };

export default defineConfig({
  plugins: [react()],
  server: { proxy: api },
  preview: { proxy: api },
});
