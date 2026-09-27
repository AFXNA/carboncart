"""Supabase access. Uses the service-role key, so it must only ever run server-side."""
import os
from functools import lru_cache

from dotenv import load_dotenv
from supabase import Client, create_client

load_dotenv()
AXES = ("co2", "water", "waste", "energy")


@lru_cache(maxsize=1)
def client() -> Client:
    key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    return create_client(os.environ["SUPABASE_URL"], key)


def profile(email: str) -> dict | None:
    """A user's totals and recent swaps, or None if there is no such user."""
    db = client()
    users = db.table("users").select("id,name,email").eq("email", email.strip().lower()).limit(1).execute().data
    if not users:
        return None
    user = users[0]
    swaps = (db.table("swaps").select("*").eq("user_id", user["id"]).order("created_at", desc=True).execute().data)
    scans = db.table("scans").select("id", count="exact").eq("user_id", user["id"]).execute().count or 0
    names = {p["id"]: p["name"] for p in db.table("products").select("id,name").execute().data}
    return {
        "user": {"name": user["name"], "email": user["email"]},
        "scans": scans,
        "saved": {a: sum(s[f"saved_{a}"] for s in swaps) for a in AXES},
        "swaps": [
            {
                "from": names.get(s["from_product"], s["from_product"]),
                "to": names.get(s["to_product"], s["to_product"]),
                "saved": {a: s[f"saved_{a}"] for a in AXES},
                "at": s["created_at"],
            }
            for s in swaps
        ],
    }
