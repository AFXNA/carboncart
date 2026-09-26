# CarbonCart 2.0

**"CarbonCart doesn't tell you what to buy. It shows you the consequences of your choices."**

CarbonCart answers a different question than a basic carbon calculator. Instead of
"this product produces 8.4 kg CO₂," it answers: *what are the real environmental
consequences of choosing this product over the alternatives?*

## Core features

1. **Product scanner** — scan a barcode or take a photo to identify a product
2. **AI product intelligence** — materials, manufacturing, transportation, packaging, expected lifespan
3. **Impact visualization** — CO₂, water usage, waste, energy, packaging
4. **Alternative simulator** — "what if I buy this instead?", compare multiple alternatives
5. **Price vs. impact** — side-by-side cost and footprint tradeoffs (e.g. +$6 for -51% estimated CO₂)
6. **Personal impact AI** — learns budget, purchasing habits, preferences, and priorities over time
7. **Community impact** — "if 10,000 people made this substitution," visualized in aggregate
8. **Impact simulator** — project annual CO₂/waste/water impact from category-level purchasing changes
9. **Impact map** — visualize where products and materials originate and how they move through the supply chain
10. **Evidence layer** — every major claim can be opened to show where the estimate came from, rather than presenting AI-generated numbers as facts

## Architecture

### Core principle

The AI never outputs a CO₂ number directly. It only extracts structured facts
(materials, transport mode, packaging type) grounded against retrieved reference
data. A separate, deterministic calculator applies real emission-factor math to
those facts. This split is what makes the Evidence Layer possible — every number
traces back to either a cited source or an auditable formula, never "the AI said so."

### Core pipeline

```
Product scan (barcode or photo)
        ↓
Identification service (barcode lookup, vision fallback)
        ↓
AI extraction — grounded (materials, transport, lifespan)
        ↓
Impact calculator — deterministic (emission factors × bill of materials)
        ↓
Impact profile (cached, linked to evidence records)
```

### Components

**1. Client layer**
- Mobile-first (React Native, or a PWA for hackathon speed) with camera access for scanning
- Barcode decoded on-device (ZXing / quagga) before hitting the network — instant for the common case

**2. Identification service**
- Barcode hit → lookup against Open Food Facts / UPCitemdb / a cached product table
- Barcode miss or photo-only → multimodal model identifies product name/brand/category from the image
- Either path resolves to a canonical `product_id`, checked against cache before anything downstream runs

**3. AI extraction service (grounded, not freestanding)**
- Retrieves nearest category-level reference data via vector similarity (e.g. embed "16oz aluminum energy
  drink" → pull benchmark LCA data for similar products)
- Calls an LLM with that retrieved context to extract structured fields: material breakdown, manufacturing
  region guess, transport assumption, packaging type, expected lifespan — each field tagged with a
  confidence level and a source type (`retrieved_benchmark`, `product_label`, `ai_inference`)
- Never asked to output CO₂ numbers itself — only structured facts

**4. Impact calculator (deterministic)**
- Plain code, not a model call: multiplies extracted quantities by emission factors from a curated table
  (seed from public sources — DEFRA conversion factors, EPA emission factor hub — rather than invented numbers)
- Outputs the four-axis Impact Vector (CO₂, water, waste, energy) plus a citation for every multiplier used

**5. Alternative simulator**
- pgvector similarity search over the product catalog within the same category, returning a Pareto-ish set
  ranked on price vs. impact rather than a single "best" pick

**6. Personalization**
- A lightweight preference vector per user (budget sensitivity, weighting across CO₂/water/waste/energy)
  updated via simple logistic weighting on accept/reject choices

**7. Community impact**
- A rolling Postgres counter table of substitution events; "if 10,000 people made this switch" is pure
  arithmetic (per-substitution delta × count), not a model call

**8. Impact simulator**
- User-configured category deltas projected against either scan history or a default basket — linear
  projection, not AI, so it's instant and auditable

**9. Impact map**
- Geocode manufacturer/origin data (from the extraction step) and render with Mapbox/Leaflet

**10. Evidence layer**
- Every stored number carries a structured record: `{claim, value, source_type, source_reference, confidence}`
- UI renders this as an expandable citation chip under any number

### Data model (core tables)

| Table | Purpose |
|---|---|
| `products` | id, barcode, name, category, cached impact_vector, last_verified |
| `emission_factors` | material/transport/packaging type → CO₂/water/waste/energy per unit, source citation |
| `impact_evidence` | product_id, field, value, source_type, source_ref, confidence |
| `users` | preference_vector, budget_band, scan_history |
| `substitution_events` | user_id, from_product, to_product, timestamp — feeds community aggregation |
| vector index (pgvector) | product category embeddings, used by the extraction-grounding step and alternative-finder |

### Suggested tech stack

- **Client**: React Native or PWA, on-device barcode decoding
- **Backend**: FastAPI or Node, one service per pipeline stage
- **Database**: PostgreSQL + pgvector for embeddings
- **AI**: multimodal LLM for identification/extraction, called only for structured extraction — never for
  the final impact numbers
- **Emission factor data**: curated table seeded from DEFRA / EPA reference data
- **Maps**: Mapbox or Leaflet
- **Queue**: Redis or a simple background worker for expensive multimodal calls, with aggressive caching by
  `product_id` so repeat scans are free

### Hackathon build order

1. Scan → identify → grounded extract → deterministic calculate → evidence chip
   *(this alone is a complete, demoable product)*
2. Alternative simulator + price-vs-impact card
3. Stretch goals: personalization, community aggregate, impact map — additive, not load-bearing; safe to
   cut under time pressure without changing the core pitch

## Why this architecture, not a simpler one

Most "carbon calculator" hackathon projects have an LLM output a number directly, which means the number
is only as trustworthy as the prompt that produced it, and can't survive a judge asking "where did that
come from." Separating grounded AI extraction from deterministic calculation, and logging every value's
provenance in the Evidence Layer, is what turns "AI-generated numbers presented as facts" into a system
where every claim can be opened and checked.
