"""Thin Gemini REST client. The API key stays on the server; the browser only calls /api/*."""
import asyncio
import logging
import os
from pathlib import Path

import httpx
from dotenv import dotenv_values

log = logging.getLogger("carboncart")
ROOT = Path(__file__).resolve().parent.parent
TIMEOUT_S = 30
RETRY_STATUSES = {429, 500, 503}  # 503 "high demand" is common; retry, then fall back to another model


class ApiError(Exception):
    def __init__(self, status: int, message: str):
        super().__init__(message)
        self.status, self.message = status, message


def settings() -> dict:
    """GEMINI_* from .env, then .env.local, then the real environment (highest priority)."""
    merged: dict = {}
    for name in (".env", ".env.local"):
        merged.update({k.strip(): v for k, v in dotenv_values(ROOT / name).items() if v})
    merged.update({k: v for k, v in os.environ.items() if k.startswith("GEMINI_")})
    return {
        "api_key": merged.get("GEMINI_API_KEY"),
        "model": merged.get("GEMINI_MODEL") or "gemini-3.5-flash",
        "fallback_model": merged.get("GEMINI_FALLBACK_MODEL") or "gemini-3.5-flash-lite",
    }


def require_key(cfg: dict) -> None:
    if not cfg["api_key"] or cfg["api_key"] == "your_google_ai_studio_key":
        raise ApiError(503, "This feature needs a Gemini API key. Set GEMINI_API_KEY in .env and restart the server.")


async def generate(payload: dict, cfg: dict, *, busy_message: str, client: httpx.AsyncClient | None = None) -> dict:
    """POST generateContent, retrying transient failures. Returns the first candidate."""
    require_key(cfg)
    models = [cfg["model"], cfg["model"], cfg["fallback_model"], cfg["fallback_model"]]
    own = client is None
    client = client or httpx.AsyncClient(timeout=TIMEOUT_S)
    try:
        for i, model in enumerate(models):
            try:
                response = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
                    headers={"x-goog-api-key": cfg["api_key"]},
                    json=payload,
                )
            except httpx.TimeoutException:
                raise ApiError(504, "Gemini took too long. Please try again.")
            except httpx.HTTPError as exc:
                log.error("Gemini fetch failed: %s", exc)
                raise ApiError(502, "Could not reach Gemini. Please try again.")
            if response.status_code == 200:
                candidates = response.json().get("candidates") or [{}]
                return candidates[0]
            log.error("Gemini API error %s on %s: %s", response.status_code, model, response.text[:500])
            if response.status_code not in RETRY_STATUSES or i == len(models) - 1:
                break
            await asyncio.sleep(0.7 * (i + 1))
        if response.status_code == 429:
            raise ApiError(429, busy_message)
        raise ApiError(502, "Gemini is unavailable. Check the server API key and model configuration.")
    finally:
        if own:
            await client.aclose()


def text_of(candidate: dict) -> str:
    parts = (candidate.get("content") or {}).get("parts") or []
    return "".join(p.get("text", "") for p in parts if not p.get("thought")).strip()
