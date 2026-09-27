import json
import unittest
from unittest.mock import patch

import httpx
from fastapi.testclient import TestClient

from backend import gemini, main
from backend.factors import MATERIAL_KEYS, TRANSPORT_MODES
from backend.gemini import ApiError

client = TestClient(main.app, raise_server_exceptions=False)
CFG = {"api_key": "k", "model": "m1", "fallback_model": "m2"}


def pick(**over):
    return {
        "name": "Oat Drink Carton", "brand": "Oatly", "category": "Groceries", "summary": "Shelf-stable carton.",
        "emoji": "🌾", "price": 4.99, "lifespan": "~30 days",
        "bom": [{"material": "oat", "kg": 1.9}], "packaging": [{"material": "cardboard", "kg": 0.04}],
        "route": {"mode": "truck", "km": 1800, "kg": 2}, "origin": {"place": "Ogden, UT", "lat": 41.2, "lon": -112},
        "confidence": "medium", **over,
    }


def candidate(output):
    return {"finishReason": "STOP", "content": {"parts": [{"text": "hidden", "thought": True}, {"text": json.dumps(output)}]}}


class Factors(unittest.TestCase):
    def test_keys_parsed_from_frontend_table(self):
        self.assertIn("aluminum", MATERIAL_KEYS)
        self.assertEqual(set(TRANSPORT_MODES), {"ship", "truck", "air"})


class Routes(unittest.TestCase):
    def post(self, path, body, **kw):
        return client.post(path, json=body, **kw)

    def test_search_returns_normalized_picks(self):
        async def fake(*_):
            return {"picks": [pick(), pick(name="", bom=[]), pick(bom=[{"material": "nope", "kg": 1}])]}, ["https://a.example/x"]
        with patch.object(main.groq_client, "search", fake):
            r = self.post("/api/products/search", {"query": "oat milk"})
        body = r.json()
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(body["picks"]), 1)
        p = body["picks"][0]
        self.assertEqual(p["bom"], [["oat", 1.9]])
        self.assertEqual(p["origin"], ["Ogden, UT", 41.2, -112])
        self.assertEqual(p["source"], "ai_inference")
        self.assertEqual(body["sources"], [{"title": "a.example", "url": "https://a.example/x"}])

    def test_search_validates_query(self):
        self.assertEqual(self.post("/api/products/search", {"query": "  "}).status_code, 400)
        self.assertEqual(self.post("/api/products/search", {"query": "x" * 201}).status_code, 400)
        self.assertEqual(client.post("/api/products/search", content="q").status_code, 415)

    def test_missing_key_is_503_with_error_field(self):
        with patch.object(gemini, "settings", lambda: {**CFG, "api_key": None}):
            r = self.post("/api/chat", {"messages": [{"role": "user", "text": "hi"}]})
        self.assertEqual(r.status_code, 503)
        self.assertIn("GEMINI_API_KEY", r.json()["error"])

    def test_identify_rejects_bad_images(self):
        self.assertEqual(self.post("/api/products/identify", {"image": "abc", "mime": "image/gif"}).status_code, 400)
        self.assertEqual(self.post("/api/products/identify", {"image": "!!!", "mime": "image/png"}).status_code, 400)

    def test_identify_uses_groq_vision(self):
        async def fake(system, image_url):
            self.assertTrue(image_url.startswith("data:image/png;base64,"))
            return {"picks": [pick()]}
        with patch.object(main.groq_client, "identify", fake):
            r = self.post("/api/products/identify", {"image": "aGVsbG8=", "mime": "image/png"})
        self.assertEqual(len(r.json()["picks"]), 1)

    def test_chat_validates_and_replies(self):
        self.assertEqual(self.post("/api/chat", {"messages": []}).status_code, 400)
        self.assertEqual(self.post("/api/chat", {"messages": [{"role": "model", "text": "hi"}]}).status_code, 400)

        async def fake(payload, cfg, **_):
            self.assertIn("Product context", payload["systemInstruction"]["parts"][0]["text"])
            return {"content": {"parts": [{"text": " Beef emits methane. "}]}}
        with patch.object(gemini, "generate", fake):
            r = self.post("/api/chat", {"messages": [{"role": "user", "text": "why?"}], "context": "Beef burger"})
        self.assertEqual(r.json(), {"reply": "Beef emits methane."})


class Retry(unittest.IsolatedAsyncioTestCase):
    async def test_retries_503_then_falls_back_to_second_model(self):
        seen = []

        def handler(request: httpx.Request):
            seen.append(request.url.path.split("/")[-1].split(":")[0])
            if len(seen) < 3:
                return httpx.Response(503, json={"error": {"message": "high demand"}})
            return httpx.Response(200, json={"candidates": [{"content": {"parts": [{"text": "ok"}]}}]})

        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as c:
            with patch("asyncio.sleep", return_value=None):
                cand = await gemini.generate({}, CFG, busy_message="busy", client=c)
        self.assertEqual(seen, ["m1", "m1", "m2"])
        self.assertEqual(gemini.text_of(cand), "ok")

    async def test_quota_error_maps_to_429(self):
        async with httpx.AsyncClient(transport=httpx.MockTransport(lambda r: httpx.Response(429, text="quota"))) as c:
            with patch("asyncio.sleep", return_value=None), self.assertRaises(ApiError) as ctx:
                await gemini.generate({}, CFG, busy_message="busy", client=c)
        self.assertEqual((ctx.exception.status, ctx.exception.message), (429, "busy"))

    async def test_non_retryable_error_fails_fast(self):
        calls = []

        def handler(request):
            calls.append(1)
            return httpx.Response(400, text="bad")

        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as c:
            with self.assertRaises(ApiError) as ctx:
                await gemini.generate({}, CFG, busy_message="busy", client=c)
        self.assertEqual((len(calls), ctx.exception.status), (1, 502))


if __name__ == "__main__":
    unittest.main()
