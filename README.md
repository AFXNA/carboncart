# carboncart
This is a hackathon project for ShellHacks 26.

## Gemini product search

Use Node.js 20.19+ and install dependencies with `npm install`.

1. Create a `.env.local` file in the project root with `GEMINI_API_KEY=...` (and optionally `GEMINI_MODEL=...`).
2. Create a key in [Google AI Studio](https://aistudio.google.com/app/apikey) and set `GEMINI_API_KEY` in `.env.local`.
3. Run `npm run dev`. Restart after changing environment variables.
4. On the Scan page, enter a product name, brand, barcode, or description. **Look up** checks the demo catalog first and uses Gemini on a miss. **Search web with Gemini** always searches online.

The server calls Gemini with [Google Search grounding](https://ai.google.dev/gemini-api/docs/generate-content/google-search) and returns up to three distinct picks, plus source links and Google Search suggestions. Each pick includes a bill of materials, packaging, and a shipping route, all described with the keys in `src/data/emissionFactors.js`. When the user selects a pick, it goes through the same calculator as the demo products and gets the same impact card, map, and swap views. `GEMINI_MODEL` is configurable; the default is `gemini-3.8-flash`. Your account needs access to the configured model and search tool; provider usage charges and quotas apply.

The API key stays in server environment variables. Never give it a `VITE_` prefix or put it in React code. Local environment files are ignored by Git.

Web picks are marked `ai_inference` (lower trust) because Gemini infers their materials and route. The emission factors stay deterministic. Demo products and camera simulation continue working without a key.

Run `npm test` for API tests and `npm run build` for the frontend build. `npm run preview` includes the API middleware for local build verification. A static deployment of `dist/` alone cannot serve search: deploy `productSearchMiddleware` from `server/product-search.js` behind `/api/products/search` on a Node server (passing the server environment key), and add authentication/rate limits before public use. Vite's dev/preview servers are for local use.
