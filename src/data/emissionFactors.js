// Illustrative emission factors, structured like DEFRA / EPA reference tables.
// Replace with real seeded data before presenting numbers as sourced.
// Materials: per kg. Transport: per tonne-km.

export const MATERIALS = {
  aluminum: { co2: 8.2, water: 35, waste: 0.05, energy: 155, src: "DEFRA 2023 – Materials use (primary aluminium)" },
  recycledAluminum: { co2: 0.7, water: 6, waste: 0.02, energy: 12, src: "DEFRA 2023 – Materials use (recycled aluminium)" },
  glass: { co2: 1.1, water: 8, waste: 0.03, energy: 15, src: "DEFRA 2023 – Glass" },
  pet: { co2: 2.6, water: 60, waste: 0.08, energy: 80, src: "EPA WARM – PET" },
  cardboard: { co2: 0.9, water: 25, waste: 0.03, energy: 20, src: "EPA WARM – corrugated cardboard" },
  cotton: { co2: 8, water: 9000, waste: 0.1, energy: 120, src: "DEFRA 2023 – Textiles (cotton)" },
  organicCotton: { co2: 4.2, water: 2500, waste: 0.08, energy: 80, src: "DEFRA 2023 – Textiles (organic cotton, est.)" },
  sugarLiquid: { co2: 0.8, water: 180, waste: 0.02, energy: 6, src: "Agribalyse – beverages" },
  oat: { co2: 0.9, water: 50, waste: 0.02, energy: 5, src: "Agribalyse – oat drink" },
  milk: { co2: 3.2, water: 630, waste: 0.02, energy: 8, src: "Agribalyse – cow milk" },
};

export const TRANSPORT = {
  ship: { co2: 0.016, energy: 0.2, src: "DEFRA 2023 – Freight, container ship" },
  truck: { co2: 0.11, energy: 1.5, src: "DEFRA 2023 – Freight, HGV" },
  air: { co2: 1.1, energy: 14, src: "DEFRA 2023 – Freight, air" },
};

export const AXES = [
  { key: "co2", label: "CO₂", unit: "kg", color: "var(--co2)" },
  { key: "water", label: "Water", unit: "L", color: "var(--water)" },
  { key: "waste", label: "Waste", unit: "kg", color: "var(--waste)" },
  { key: "energy", label: "Energy", unit: "MJ", color: "var(--energy)" },
];
