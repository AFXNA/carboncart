// Mock product catalog standing in for Open Food Facts + the AI extraction step.
// bom / packaging: [materialKey, kg]. route.kg is the shipped mass.
// source: product_label | retrieved_benchmark | ai_inference

export const DESTINATION = ["Miami, FL", 25.8, -80.2];

export const PRODUCTS = [
  {
    id: "energy-can", barcode: "0123456789012", name: "Energy Drink 16oz", category: "Beverages",
    price: 2.99, emoji: "🥤", lifespan: "Single use",
    bom: [["aluminum", 0.014], ["sugarLiquid", 0.47]], packaging: [["cardboard", 0.02]],
    route: { km: 9200, mode: "ship", kg: 0.5 }, origin: ["Guangdong, CN", 23.1, 113.3], destination: DESTINATION,
    source: "ai_inference", confidence: "medium",
  },
  {
    id: "energy-can-r", name: "Energy Drink 16oz (recycled can)", category: "Beverages",
    price: 3.49, emoji: "🥫", lifespan: "Single use",
    bom: [["recycledAluminum", 0.014], ["sugarLiquid", 0.47]], packaging: [["cardboard", 0.02]],
    route: { km: 1400, mode: "truck", kg: 0.5 }, origin: ["Atlanta, GA", 33.7, -84.4], destination: miami,
    source: "retrieved_benchmark", confidence: "high",
  },
  {
    id: "cold-brew", name: "Cold Brew, glass bottle", category: "Beverages",
    price: 4.29, emoji: "🍾", lifespan: "Reusable bottle",
    bom: [["glass", 0.3], ["sugarLiquid", 0.35]], packaging: [["cardboard", 0.03]],
    route: { km: 600, mode: "truck", kg: 0.7 }, origin: ["Orlando, FL", 28.5, -81.4], destination: miami,
    source: "product_label", confidence: "high",
  },
  {
    id: "tee", barcode: "0987654321098", name: "Basic Cotton T-Shirt", category: "Clothing",
    price: 12, emoji: "👕", lifespan: "~2 years",
    bom: [["cotton", 0.2]], packaging: [["pet", 0.01]],
    route: { km: 14500, mode: "air", kg: 0.25 }, origin: ["Dhaka, BD", 23.8, 90.4], destination: miami,
    source: "ai_inference", confidence: "medium",
  },
  {
    id: "tee-o", name: "Organic Cotton T-Shirt", category: "Clothing",
    price: 18, emoji: "🌿", lifespan: "~4 years",
    bom: [["organicCotton", 0.2]], packaging: [["cardboard", 0.02]],
    route: { km: 14500, mode: "ship", kg: 0.25 }, origin: ["Izmir, TR", 38.4, 27.1], destination: DESTINATION,
    source: "retrieved_benchmark", confidence: "medium",
  },
  {
    id: "milk", barcode: "0555555555555", name: "Whole Milk 1 gal", category: "Groceries",
    price: 4.2, emoji: "🥛", lifespan: "7–10 days",
    bom: [["milk", 3.8]], packaging: [["pet", 0.06]],
    route: { km: 300, mode: "truck", kg: 3.9 }, origin: ["Okeechobee, FL", 27.2, -80.8], destination: DESTINATION,
    source: "product_label", confidence: "high",
  },
  {
    id: "oat", name: "Oat Drink 1 gal", category: "Groceries",
    price: 6.5, emoji: "🌾", lifespan: "~30 days shelf-stable",
    bom: [["oat", 3.8]], packaging: [["cardboard", 0.05]],
    route: { km: 1800, mode: "truck", kg: 3.9 }, origin: ["Minneapolis, MN", 45, -93.3], destination: DESTINATION,
    source: "retrieved_benchmark", confidence: "medium",
  },
];

export const CATEGORIES = [
  { name: "Beverages", label: "Drinks / week", perYear: 52, defaultQty: 5, max: 21 },
  { name: "Clothing", label: "Clothing items / year", perYear: 1, defaultQty: 4, max: 20 },
  { name: "Groceries", label: "Milk & dairy / week", perYear: 52, defaultQty: 2, max: 14 },
];
