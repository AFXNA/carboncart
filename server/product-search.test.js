import test from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { DEFAULT_MODEL, SEARCH_PATH, productSearchMiddleware } from "./product-search.js";

async function invoke(options = {}, body = JSON.stringify({ query: "oat milk" }), method = "POST") {
  const req = Object.assign(Readable.from([body]), {
    url: SEARCH_PATH, method, headers: { "content-type": "application/json" },
  });
  const result = {};
  const res = {
    setHeader() {},
    writeHead(status) { result.status = status; },
    end(value) { result.body = JSON.parse(value); },
  };
  await productSearchMiddleware(options)(req, res, () => { result.next = true; });
  return result;
}

const geminiReply = (output, extra = {}) => new Response(JSON.stringify({
  candidates: [{
    finishReason: "STOP",
    content: { parts: [{ text: "Private thought", thought: true }, { text: JSON.stringify(output) }] },
    ...extra,
  }],
}));

const pick = (overrides = {}) => ({
  name: "Oat Drink Carton", brand: "Oatly", category: "Groceries", summary: "Shelf-stable carton.",
  emoji: "🌾", price: 4.99, lifespan: "~30 days",
  bom: [{ material: "oat", kg: 1.9 }], packaging: [{ material: "cardboard", kg: 0.04 }],
  route: { mode: "truck", km: 1800, kg: 2 }, origin: { place: "Ogden, UT", lat: 41.2, lon: -112 },
  confidence: "medium",
  ...overrides,
});

test("ignores other paths", async () => {
  const req = { url: "/other" };
  let called = false;
  await productSearchMiddleware({})(req, {}, () => { called = true; });
  assert.ok(called);
});

test("rejects invalid requests before calling Gemini", async () => {
  const options = { apiKey: "secret", fetchImpl: () => assert.fail("Unexpected API call") };
  for (const body of ["invalid", "null", '{"query":42}', '{"query":" "}', JSON.stringify({ query: "x".repeat(201) })]) {
    assert.equal((await invoke(options, body)).status, 400);
  }
  assert.equal((await invoke(options, "x".repeat(4097))).status, 413);
  assert.equal((await invoke(options, "", "GET")).status, 405);
  assert.equal((await invoke()).status, 503);
});

test("returns up to three normalized picks with safe sources", async () => {
  const result = await invoke({ apiKey: "secret-key", fetchImpl: async (url, init) => {
    assert.match(url, new RegExp(`${DEFAULT_MODEL}:generateContent$`));
    assert.equal(init.headers["x-goog-api-key"], "secret-key");
    const input = JSON.parse(init.body);
    assert.deepEqual(input.tools, [{ google_search: {} }]);
    assert.equal(input.contents[0].parts[0].text, "oat milk");
    return geminiReply({
      picks: [
        pick(),
        pick({ name: "Oat Milk Glass Bottle", bom: [{ material: "oat", kg: 1 }, { material: "unobtainium", kg: 5 }] }),
        pick({ name: "Barista Oat Blend" }),
        pick({ name: "Fourth pick" }),
        pick({ name: "No materials", bom: [{ material: "unobtainium", kg: 1 }] }),
      ],
    }, { groundingMetadata: {
      groundingChunks: [
        { web: { uri: "https://example.com/product", title: "Product" } },
        { web: { uri: "https://example.com/product", title: "Duplicate" } },
        { web: { uri: "javascript:alert(1)" } },
      ],
      searchEntryPoint: { renderedContent: "<div>Suggestions</div>" },
    } });
  } });

  assert.equal(result.status, 200);
  const { picks, sources, searchSuggestions } = result.body;
  assert.deepEqual(picks.map((p) => p.name), ["Oat Drink Carton", "Oat Milk Glass Bottle", "Barista Oat Blend"]);
  assert.deepEqual(picks[0].bom, [["oat", 1.9]]);
  assert.deepEqual(picks[0].origin, ["Ogden, UT", 41.2, -112]);
  assert.equal(picks[0].source, "ai_inference");
  assert.deepEqual(picks[1].bom, [["oat", 1]], "unknown materials are dropped");
  assert.equal(new Set(picks.map((p) => p.id)).size, 3);
  assert.deepEqual(sources, [{ title: "Product", url: "https://example.com/product" }]);
  assert.equal(searchSuggestions, "<div>Suggestions</div>");
  assert.ok(!JSON.stringify(result).includes("secret-key"));
});

test("returns an empty list when nothing matches", async () => {
  const result = await invoke({ apiKey: "key", fetchImpl: async () => geminiReply({ picks: [] }) });
  assert.deepEqual(result, { status: 200, body: { picks: [], sources: [], searchSuggestions: "" } });
});

test("handles quota, upstream failures, bad output, and timeouts", async () => {
  for (const status of [429, 403, 500]) {
    const result = await invoke({ apiKey: "key", fetchImpl: async () => new Response("private error", { status }) });
    assert.equal(result.status, status === 429 ? 429 : 502);
    assert.ok(!JSON.stringify(result).includes("private error"));
  }
  const reply = (body) => async () => new Response(JSON.stringify(body));
  assert.equal((await invoke({ apiKey: "key", fetchImpl: reply({ candidates: [] }) })).status, 502);
  assert.equal((await invoke({ apiKey: "key", fetchImpl: reply({
    candidates: [{ finishReason: "STOP", content: { parts: [{ text: "not json" }] } }],
  }) })).status, 502);
  const timeout = async () => { throw new DOMException("timeout", "TimeoutError"); };
  assert.equal((await invoke({ apiKey: "key", fetchImpl: timeout })).status, 504);
});
