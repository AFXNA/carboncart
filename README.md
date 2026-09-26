# carboncart
This is a hackathon project for ShellHacks 26.

## Running it

The frontend is React + Vite (needs Node.js 20.19+ for the dev server and build). The API is a Python 3.10+ FastAPI service in `backend/`.

```
npm install
py -m venv .venv                      # macOS/Linux: python3 -m venv .venv
.venvScriptspip install -r backend/requirements.txt   # macOS/Linux: .venv/bin/pip ...
```

Put `GEMINI_API_KEY=...` in `.env` (or `.env.local`; optional `GEMINI_MODEL`, `GEMINI_FALLBACK_MODEL`). Get a key at [Google AI Studio](https://aistudio.google.com/app/apikey). Then run two terminals:

```
.venvScriptspython -m uvicorn backend.main:app --port 8000    # API
npm run dev                                                       # UI at http://localhost:5173
```

Vite proxies `/api/*` to the Python service. Restart the API after changing environment variables.

## What Gemini does

- **Photo upload** (`POST /api/products/identify`): identifies the product in a photo and estimates its materials and shipping route.
- **Web search** (`POST /api/products/search`): grounded in [Google Search](https://ai.google.dev/gemini-api/docs/generate-content/google-search); returns up to three distinct picks plus sources.
- **Ask AI** (`POST /api/chat`): a chatbot about carbon emissions. Transient 503/429 errors are retried, then a fallback model is tried.

Gemini only describes products using the keys in `src/data/emissionFactors.js`; the browser's deterministic calculator produces every number. Picks are marked `ai_inference` (lower trust). The API key stays in server environment variables — never give it a `VITE_` prefix or put it in React code. Environment files are ignored by Git.

## Tests and production

`python -m unittest backend.test_api` (inside the venv) runs the API tests; `npm run build` builds the frontend. After building, `uvicorn backend.main:app` also serves `dist/` on the same port, so one Python process can host the whole app (e.g. on Render or Railway). The routes have no rate limiting, so add limits and a spending cap on the key before making it public.
