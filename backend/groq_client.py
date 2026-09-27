"""Groq client: web-search product lookup (gpt-oss + browser_search) and photo identification (vision)."""
import asyncio
import json
import os
import re

import httpx
from dotenv import load_dotenv

from .gemini import ApiError, ROOT

load_dotenv(ROOT / ".env")
load_dotenv(ROOT / ".env.local", override=True)
URL = "https://api.groq.com/openai/v1/chat/completions"
SEARCH_MODEL = os.getenv("GROQ_SEARCH_MODEL", "openai/gpt-oss-20b")
VISION_MODEL = os.getenv("GROQ_VISION_MODEL", "qwen/qwen3.8-27b")


async def chat(model: str, messages: list, **extra) -> dict:
    key = os.getenv("GROQ_API_KEY")
    if not key:
        raise ApiError(503, "This feature needs a Groq API key. Set GROQ_API_KEY in .env and restart the server.")
    try:
        async with httpx.AsyncClient(timeout=100) as client:
            for attempt in range(2):
                r = await client.post(URL, headers={"Authorization": f"Bearer {key}"},
                                      json={"model": model, "messages": messages, **extra})
                if r.status_code != 429 or attempt:
                    break
                await asyncio.sleep(min(float(r.headers.get("retry-after", 5)), 15))
    except httpx.TimeoutException:
        raise ApiError(504, "Groq took too long. Please try again.")
    except httpx.HTTPError:
        raise ApiError(502, "Could not reach Groq. Please try again.")
    if r.status_code == 429:
        raise ApiError(429, "Groq rate limit hit: " + r.json().get("error", {}).get("message", "")[:160])
    if r.status_code != 200:
        raise ApiError(502, f"Groq error ({r.status_code}): {r.json().get('error', {}).get('message', r.text)[:200]}")
    return r.json()["choices"][0]["message"]


def parse_json(content: str) -> dict:
    """Pull the JSON object out of model text (tolerates code fences and prose)."""
    start, end = content.find("{"), content.rfind("}")
    if start < 0 or end < start:
        raise ValueError("no JSON object")
    return json.loads(content[start:end + 1])


async def search(system: str, query: str) -> tuple[dict, list[str]]:
    """Two steps (tool calls and strict JSON don't mix reliably): browse for facts, then structure them.
    Returns (parsed JSON, source URLs the model browsed)."""
    found = await chat(SEARCH_MODEL, [
        {"role": "system", "content": "Do at most two quick web searches, then reply with brief plain-text notes (no JSON): the closest matching "
                                      "products, their materials and weights, packaging, typical price, and where they are made."},
        {"role": "user", "content": query},
    ], tools=[{"type": "browser_search"}], reasoning_effort="low", temperature=0.2)
    urls = [u for tool in found.get("executed_tools") or []
            for u in re.findall(r"URL: (https://[^\s)]+)", tool.get("output") or "")]
    msg = await chat(SEARCH_MODEL, [
        {"role": "system", "content": system},
        {"role": "user", "content": f"Search: {query}\n\nWeb research notes:\n{found.get('content') or ''}"},
    ], response_format={"type": "json_object"}, temperature=0.2)
    return parse_json(msg.get("content") or ""), urls


async def identify(system: str, image_url: str) -> dict:
    msg = await chat(VISION_MODEL, [
        {"role": "system", "content": system},
        {"role": "user", "content": [
            {"type": "text", "text": "What product is this? Estimate its materials and shipping."},
            {"type": "image_url", "image_url": {"url": image_url}},
        ]},
    ], response_format={"type": "json_object"}, temperature=0.2)
    return parse_json(msg.get("content") or "")
