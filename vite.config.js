import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { productSearchMiddleware } from "./server/product-search.js";

export default defineConfig(({ mode }) => {
  // Load GEMINI_* from .env files server-side only; never expose them to the client bundle.
  const env = { ...loadEnv(mode, process.cwd(), "GEMINI_"), ...process.env };
  const addSearchApi = (server) => {
    server.middlewares.use(productSearchMiddleware({
      apiKey: env.GEMINI_API_KEY,
      model: env.GEMINI_MODEL || undefined,
    }));
  };
  return {
    plugins: [react(), { name: "gemini-product-search", configureServer: addSearchApi, configurePreviewServer: addSearchApi }],
  };
});
