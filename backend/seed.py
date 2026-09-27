"""Populate Supabase with dummy data: `py -m backend.seed`. Safe to re-run (upserts / skips)."""
import os
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
db = create_client(os.environ["SUPABASE_URL"], os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ["SUPABASE_KEY"])

now = datetime.now(timezone.utc)
ago = lambda days: (now - timedelta(days=days)).isoformat()

PRODUCTS = [  # id, name, co2, water, waste, energy
    ("energy-can", "Energy Drink 16oz", 0.35, 12.0, 0.02, 9.0),
    ("energy-can-r", "Energy Drink 16oz (recycled can)", 0.12, 8.0, 0.01, 3.5),
    ("cold-brew", "Cold Brew, glass bottle", 0.28, 10.0, 0.02, 6.0),
    ("tee", "Basic Cotton T-Shirt", 8.0, 2700.0, 0.1, 120.0),
    ("tee-o", "Organic Cotton T-Shirt", 4.2, 750.0, 0.08, 80.0),
    ("milk", "Whole Milk 1 gal", 12.1, 2400.0, 0.05, 30.0),
    ("oat", "Oat Drink 1 gal", 3.4, 190.0, 0.03, 20.0),
]
products = [dict(id=i, name=n, source="catalog", co2=c, water=w, waste=ws, energy=e) for i, n, c, w, ws, e in PRODUCTS]
db.table("products").upsert(products).execute()

USERS = [("Ava Green", "ava@example.com"), ("Ben Rivera", "ben@example.com"), ("Chloe Park", "chloe@example.com")]
# The tables have no auto-generated ids, so ids are assigned here.
db.table("users").upsert([
    {"id": n, "name": name, "email": email, "password_hash": "dummy-not-a-real-hash"} for n, (name, email) in enumerate(USERS, 1)
], on_conflict="email").execute()
ids = {u["email"]: u["id"] for u in db.table("users").select("id,email").execute().data}

PREFS = {"ava@example.com": (80, 40, 30, 20, 40), "ben@example.com": (60, 30, 20, 40, 70), "chloe@example.com": (70, 60, 50, 20, 50)}
db.table("preferences").upsert([
    dict(user_id=ids[e], co2=a, water=b, waste=c, energy=d, budget=f) for e, (a, b, c, d, f) in PREFS.items()
]).execute()

by_id = {p["id"]: p for p in products}
SWAPS = [("ava@example.com", "energy-can", "energy-can-r", 6), ("ava@example.com", "tee", "tee-o", 4),
         ("ava@example.com", "milk", "oat", 2), ("ben@example.com", "milk", "oat", 5), ("chloe@example.com", "tee", "tee-o", 3)]
SCANS = [("ava@example.com", "energy-can", 6), ("ava@example.com", "tee", 4), ("ava@example.com", "milk", 2),
         ("ben@example.com", "milk", 5), ("ben@example.com", "cold-brew", 1), ("chloe@example.com", "tee", 3)]
for table in ("scans", "swaps"):
    db.table(table).delete().in_("user_id", list(ids.values())).execute()  # keeps re-runs from duplicating
db.table("scans").insert([dict(id=n, user_id=ids[e], product_id=p, scanned_at=ago(d)) for n, (e, p, d) in enumerate(SCANS, 1)]).execute()
db.table("swaps").insert([
    dict(id=n, user_id=ids[e], from_product=f, to_product=t, created_at=ago(d),
         **{f"saved_{k}": round(by_id[f][k] - by_id[t][k], 3) for k in ("co2", "water", "waste", "energy")})
    for n, (e, f, t, d) in enumerate(SWAPS, 1)
]).execute()

for t in ("users", "preferences", "products", "scans", "swaps"):
    print(t, len(db.table(t).select("*").execute().data))
