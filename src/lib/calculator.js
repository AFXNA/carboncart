// Deterministic impact calculator: emission factors × bill of materials.
// No model calls — every number traces to a factor and its cited source.
import { MATERIALS, TRANSPORT, AXES } from "../data/emissionFactors";
import { PRODUCTS } from "../data/products";

export function calculateImpact(product) {
  const impact = { co2: 0, water: 0, waste: 0, energy: 0 };
  const evidence = [];

  for (const [material, kg] of [...product.bom, ...product.packaging]) {
    const f = MATERIALS[material];
    AXES.forEach(({ key }) => (impact[key] += f[key] * kg));
    evidence.push({
      claim: `${material} × ${kg} kg`,
      value: `${(f.co2 * kg).toFixed(3)} kg CO₂`,
      sourceType: "emission_factor",
      sourceRef: f.src,
      confidence: product.confidence,
    });
  }

  const { mode, km, kg } = product.route;
  const t = TRANSPORT[mode];
  const tonneKm = (kg / 1000) * km;
  impact.co2 += t.co2 * tonneKm;
  impact.energy += t.energy * tonneKm;
  evidence.push({
    claim: `${mode} freight, ${km} km × ${kg} kg`,
    value: `${(t.co2 * tonneKm).toFixed(3)} kg CO₂`,
    sourceType: "emission_factor",
    sourceRef: t.src,
    confidence: product.confidence,
  });

  evidence.push({
    claim: "Bill of materials & origin",
    value: "structured extraction",
    sourceType: product.source,
    sourceRef: {
      product_label: "Read from product label / Open Food Facts",
      retrieved_benchmark: "Nearest category benchmark LCA (vector retrieval)",
      ai_inference: "Multimodal model inference — lower trust",
    }[product.source],
    confidence: product.confidence,
  });

  return { impact, evidence };
}

export function transportCo2(product) {
  const { mode, km, kg } = product.route;
  return TRANSPORT[mode].co2 * (kg / 1000) * km;
}

// Attach computed impact + evidence to a product definition.
export const withImpact = (p) => ({ ...p, ...calculateImpact(p) });

export const CATALOG = PRODUCTS.map(withImpact);

export const findProduct = (id) => CATALOG.find((p) => p.id === id);

export function findByQuery(query) {
  const q = query.trim().toLowerCase();
  return CATALOG.find((p) => p.barcode === q) || CATALOG.find((p) => p.name.toLowerCase().includes(q));
}

// Weighted improvement of `alt` vs `base` (positive = better), using user priorities.
export function preferenceScore(alt, base, prefs) {
  let score = 0, weight = 0;
  for (const { key } of AXES) {
    const w = prefs[key] / 100;
    weight += w;
    score += w * (1 - alt.impact[key] / base.impact[key]);
  }
  return weight ? score / weight : 0;
}
