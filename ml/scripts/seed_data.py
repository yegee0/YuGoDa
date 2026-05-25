"""
seed_data.py — YuGoDa için synthetic veri üretici.

Üretir:
- 1000 user (5 segment'e dağıtılmış: loyal, explorer, budget, premium, healthy)
- 50 store (8 İstanbul mahallesi + Ankara/İzmir, coğrafi kümelenmiş)
- 500 bag (mevcut 12 demo bag'e EKLENIR — demo silinmez)
- 15000 order (segment + popularity + distance + time aware, son 6 ay)
- ~5000 review (delivered orderların ~%40'ı, rating-bazlı Türkçe template'ler)

Çıktılar:
- PostgreSQL'e yazılır (synth_* prefix'li ID'lerle, idempotent)
- ml/data/user_segments.csv (ML training için ground-truth)

Çalıştırma:
    python3 ml/scripts/seed_data.py

DB credentials için (sırasıyla):
    1. environment variables: DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME
    2. .env.local veya .env dosyası
    3. application.properties defaults (postgres@localhost:5432/yugoda)
"""
import os
import sys
import json
import math
import random
import uuid
import datetime as dt
from pathlib import Path
from collections import defaultdict, Counter

import numpy as np
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
from faker import Faker

try:
    from dotenv import load_dotenv
    _HAS_DOTENV = True
except ImportError:
    _HAS_DOTENV = False

# ─── Paths ────────────────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parents[2]
ML_DIR = ROOT / "ml"
DATA_DIR = ML_DIR / "data"
TEMPLATES_PATH = DATA_DIR / "review_templates.json"
SEGMENTS_CSV = DATA_DIR / "user_segments.csv"

if _HAS_DOTENV:
    load_dotenv(ROOT / ".env.local", override=False)
    load_dotenv(ROOT / ".env", override=False)

# ─── Konfigürasyon ────────────────────────────────────────────────────────
SEED = 42
np.random.seed(SEED)
random.seed(SEED)

N_USERS = 1000
N_STORES = 50
N_BAGS = 500
N_ORDERS = 15000
TIME_RANGE_MONTHS = 6

DB_CONFIG = {
    "host":     os.environ.get("DB_HOST", "localhost"),
    "port":     int(os.environ.get("DB_PORT", "5432")),
    "user":     os.environ.get("DB_USERNAME", "postgres"),
    "password": os.environ.get("DB_PASSWORD", "postgres"),
    "database": os.environ.get("DB_NAME", "yugoda"),
    "sslmode":  os.environ.get("DB_SSLMODE", "prefer"),
}

fake = Faker("tr_TR")
Faker.seed(SEED)

# ─── Coğrafi Merkezler ────────────────────────────────────────────────────
NEIGHBORHOODS = [
    {"name": "Kadıköy",  "city": "İstanbul", "lat": 40.9908, "lng": 29.0277, "weight": 0.18},
    {"name": "Beşiktaş", "city": "İstanbul", "lat": 41.0428, "lng": 29.0094, "weight": 0.15},
    {"name": "Şişli",    "city": "İstanbul", "lat": 41.0593, "lng": 28.9871, "weight": 0.13},
    {"name": "Beyoğlu",  "city": "İstanbul", "lat": 41.0359, "lng": 28.9772, "weight": 0.12},
    {"name": "Üsküdar",  "city": "İstanbul", "lat": 41.0227, "lng": 29.0153, "weight": 0.10},
    {"name": "Bakırköy", "city": "İstanbul", "lat": 40.9774, "lng": 28.8718, "weight": 0.08},
    {"name": "Maltepe",  "city": "İstanbul", "lat": 40.9359, "lng": 29.1303, "weight": 0.07},
    {"name": "Sarıyer",  "city": "İstanbul", "lat": 41.1668, "lng": 29.0468, "weight": 0.05},
    {"name": "Çankaya",  "city": "Ankara",   "lat": 39.9034, "lng": 32.8628, "weight": 0.07},
    {"name": "Konak",    "city": "İzmir",    "lat": 38.4192, "lng": 27.1287, "weight": 0.05},
]

# ─── Kategori-spesifik konfigürasyon ──────────────────────────────────────
# Kanonik kategoriler — apps/frontend/src/lib/constants.ts BAG_CATEGORIES ile AYNI
# (food-type). Vegan bir kategori DEĞİL; vegan-luk dietary_type ile gelir.
CATEGORIES = {
    "Bakery":    {"merchant": "Bakery",     "orig_price": (60, 150),  "dietary": [("Vegan", 0.2), ("Vegetarian", 0.5), ("Non-Vegan", 0.3)],   "calories": (180, 400)},
    "Cafe":      {"merchant": "Cafe",       "orig_price": (70, 160),  "dietary": [("Vegan", 0.15), ("Vegetarian", 0.5), ("Non-Vegan", 0.35)], "calories": (200, 450)},
    "Desserts":  {"merchant": "Bakery",     "orig_price": (70, 160),  "dietary": [("Vegetarian", 0.8), ("Vegan", 0.2)],                       "calories": (350, 700)},
    "Groceries": {"merchant": "Grocery",    "orig_price": (90, 200),  "dietary": [("Vegan", 0.3), ("Vegetarian", 0.4), ("Non-Vegan", 0.3)],   "calories": (200, 500)},
    "Hot Meals": {"merchant": "Restaurant", "orig_price": (140, 300), "dietary": [("Vegetarian", 0.2), ("Non-Vegan", 0.8)],                   "calories": (500, 850)},
    "Salad":     {"merchant": "Restaurant", "orig_price": (80, 170),  "dietary": [("Vegan", 0.4), ("Vegetarian", 0.4), ("Non-Vegan", 0.2)],   "calories": (180, 380)},
    "Pizza":     {"merchant": "Restaurant", "orig_price": (120, 250), "dietary": [("Vegetarian", 0.4), ("Non-Vegan", 0.6)],                   "calories": (500, 850)},
    "Burger":    {"merchant": "Restaurant", "orig_price": (110, 230), "dietary": [("Vegetarian", 0.2), ("Non-Vegan", 0.8)],                   "calories": (550, 900)},
    "Sushi":     {"merchant": "Restaurant", "orig_price": (150, 320), "dietary": [("Vegetarian", 0.1), ("Non-Vegan", 0.9)],                   "calories": (350, 600)},
    "Deli":      {"merchant": "Deli",       "orig_price": (110, 240), "dietary": [("Vegetarian", 0.3), ("Non-Vegan", 0.7)],                   "calories": (250, 550)},
    "Pasta":     {"merchant": "Restaurant", "orig_price": (80, 180),  "dietary": [("Vegetarian", 0.7), ("Non-Vegan", 0.3)],                   "calories": (300, 600)},
    "Kebab":     {"merchant": "Restaurant", "orig_price": (130, 280), "dietary": [("Non-Vegan", 1.0)],                                        "calories": (550, 900)},
    "Chinese":   {"merchant": "Restaurant", "orig_price": (110, 250), "dietary": [("Vegan", 0.15), ("Vegetarian", 0.25), ("Non-Vegan", 0.6)], "calories": (400, 750)},
    "Indian":    {"merchant": "Restaurant", "orig_price": (110, 250), "dietary": [("Vegan", 0.25), ("Vegetarian", 0.4), ("Non-Vegan", 0.35)], "calories": (400, 750)},
    "Mexican":   {"merchant": "Restaurant", "orig_price": (100, 220), "dietary": [("Vegetarian", 0.3), ("Non-Vegan", 0.7)],                   "calories": (450, 800)},
    "Bowls":     {"merchant": "Restaurant", "orig_price": (90, 190),  "dietary": [("Vegan", 0.4), ("Vegetarian", 0.4), ("Non-Vegan", 0.2)],   "calories": (300, 550)},
}

CATEGORY_TAGS = {
    "Bakery": ["Taze", "Sıcak", "Klasik"],
    "Cafe": ["Atıştırmalık", "Kahve", "Eşlik Eden"],
    "Desserts": ["Tatlı", "Şerbetli", "İkram"],
    "Groceries": ["Karışık", "Günlük", "Mevsim"],
    "Hot Meals": ["Etli", "Doyurucu", "Protein"],
    "Salad": ["Hafif", "Taze", "Sağlıklı"],
    "Pizza": ["İtalyan", "Sıcak", "Konfor"],
    "Burger": ["Amerikan", "Konfor", "Etli"],
    "Sushi": ["Japon", "Deniz Ürünü", "Premium"],
    "Deli": ["Şarküteri", "Peynir", "Premium"],
    "Pasta": ["İtalyan", "Kremalı", "Doyurucu"],
    "Kebab": ["Türk", "Etli", "Baharatlı"],
    "Chinese": ["Asya", "Wok", "Baharatlı"],
    "Indian": ["Asya", "Köri", "Baharatlı"],
    "Mexican": ["Acılı", "Tortilla", "Baharatlı"],
    "Bowls": ["Sağlıklı", "Tahıl", "Dengeli"],
}

PREMIUM_CATEGORIES = ["Sushi", "Hot Meals", "Deli"]
HEALTHY_CATEGORIES = ["Salad", "Bowls"]

# ─── User segmentleri ─────────────────────────────────────────────────────
SEGMENTS = ["loyal", "explorer", "budget", "premium", "healthy"]
SEGMENT_PROBS = [0.35, 0.25, 0.20, 0.10, 0.10]

SEGMENT_ORDER_RANGE = {
    "loyal":    (10, 30),
    "explorer": (5, 18),
    "budget":   (12, 25),
    "premium":  (3, 10),
    "healthy":  (6, 16),
}

SEGMENT_STORE_SCOPE = {
    "loyal":    (1, 3),
    "explorer": (8, 20),
    "budget":   (3, 10),
    "premium":  (3, 8),
    "healthy":  (3, 8),
}

# ─── Türkçe isim havuzları ────────────────────────────────────────────────
STORE_NAME_PREFIXES = ["Lezzet", "Sıcak", "Mevsim", "Doyumlu", "Taze", "Sefa", "Hayat",
                       "Anadolu", "Pasaport", "Köşe", "Sokak", "Bahçe", "Pırıl"]
STORE_NAME_SUFFIXES = ["Mutfağı", "Lokanta", "Köşesi", "Durağı", "Yeri", "Evi", "Ocağı",
                       "Atölyesi", "Sofrası", "Dükkânı", "Köftecisi", "Pidecisi"]
BAKERY_NAMES = ["Yufka", "Mayalı", "Köyün", "Kurabiye", "Hamur", "Buğday", "Tahıl"]
CAFE_NAMES = ["Espresso", "Latte", "Aroma", "Çekirdek", "Demlik", "Filtre", "Bohem"]
SUSHI_NAMES = ["Sakura", "Tokyo", "Wasabi", "Niji", "Hana", "Ume", "Sora"]
THAI_NAMES = ["Bangkok", "Ko Samui", "Patpong", "Lemongrass", "Chiang Mai"]

BAG_NAME_TEMPLATES = [
    "{cat} Sürpriz Paketi",
    "{cat} Karışık Sepet",
    "Akşam {cat} Paketi",
    "Mevsim {cat} Sürprizi",
    "{cat} Kalemleri",
    "Günün {cat} Seçkisi",
    "Doyumluk {cat}",
]

BAG_DESCRIPTIONS = {
    "Bakery":    "Günün taze ekmek, simit, poğaça ve hamur işlerinden oluşan sürpriz paket.",
    "Cafe":      "Sandviç, atıştırmalık ve sıcak içecek eşliği için hazırlanmış sürpriz paket.",
    "Desserts":  "Şerbetli ve sütlü tatlılardan oluşan günün şenliği.",
    "Groceries": "Mevsim sebze, meyve ve günlük temel ürünlerden oluşan karma paket.",
    "Hot Meals": "Izgara, sote veya fırın et/tavuk ürünlerinden oluşan doyurucu seçki.",
    "Salad":     "Mevsim sebzeleri ve sağlıklı içeriklerden oluşan taze salata paketi.",
    "Pizza":     "Akşam fırınından kalan pizza dilimleri ve kalzone karışımı.",
    "Burger":    "Burger, patates ve eşlik eden atıştırmalıklardan günün karışımı.",
    "Sushi":     "Günün hazır kalan suşi çeşitleri, taze ve özenle paketlenmiş.",
    "Deli":      "Şarküteri ürünleri, peynir ve charcuterie atıştırmalıklarından oluşan paket.",
    "Pasta":     "Makarna ve İtalyan lezzetlerinden oluşan günün doyurucu seçkisi.",
    "Kebab":     "Günün döner, kebap ve mezelerinden oluşan doyurucu paket.",
    "Chinese":   "Wok soteleri, noodle ve Çin mutfağından günün karışık sürprizi.",
    "Indian":    "Köri, baharatlı sebze ve Hint mutfağından günün sürprizi.",
    "Mexican":   "Burrito, taco ve Meksika mutfağından baharatlı günün karışımı.",
    "Bowls":     "Tahıl, sebze ve protein dengeli sağlıklı bowl çeşitleri.",
}

PICKUP_TIME_SLOTS = [
    "15:00-18:00", "16:00-19:00", "17:00-20:00", "18:00-21:00",
    "19:00-22:00", "20:00-23:00", "20:30-23:30", "16:30-19:30",
]

ORDER_STATUS_DIST = [
    ("delivered", 0.85),
    ("cancelled", 0.05),
    ("picked_up", 0.04),
    ("ready",     0.03),
    ("preparing", 0.02),
    ("confirmed", 0.01),
]

# ─── Helpers ──────────────────────────────────────────────────────────────
def gen_id(prefix):
    return f"synth_{prefix}_{uuid.uuid4().hex[:8]}"

def haversine_km(lat1, lng1, lat2, lng2):
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng/2)**2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1-a))

def jitter(lat, lng, max_km=2.0):
    dlat = (random.random() - 0.5) * (max_km / 111.0) * 2
    dlng = (random.random() - 0.5) * (max_km / (111.0 * math.cos(math.radians(lat)))) * 2
    return lat + dlat, lng + dlng

def pick_neighborhood():
    weights = [n["weight"] for n in NEIGHBORHOODS]
    return random.choices(NEIGHBORHOODS, weights=weights, k=1)[0]

# ─── DB ───────────────────────────────────────────────────────────────────
def connect_db():
    print(f"[DB] Bağlanılıyor: {DB_CONFIG['host']}:{DB_CONFIG['port']} / {DB_CONFIG['database']}")
    conn = psycopg2.connect(**DB_CONFIG)
    conn.autocommit = False
    return conn

def truncate_synthetic(conn):
    """Sadece synth_ prefix'li satırları siler. Demo bag'ler ve elle eklenmiş veriler korunur."""
    print("[CLEAN] Eski synthetic veri temizleniyor (demo bag'ler korunur)...")
    counts = {}
    with conn.cursor() as cur:
        for tbl, col in [("reviews", "id"), ("orders", "id"), ("bags", "id"),
                         ("stores", "id"), ("users", "uid")]:
            cur.execute(f"DELETE FROM {tbl} WHERE {col} LIKE 'synth_%'")
            counts[tbl] = cur.rowcount
    conn.commit()
    print(f"   silinen: " + ", ".join(f"{k}={v}" for k, v in counts.items()))

# ─── Generators ───────────────────────────────────────────────────────────
def gen_users():
    print(f"[USERS] {N_USERS} user üretiliyor...")
    users = []
    segments = np.random.choice(SEGMENTS, size=N_USERS, p=SEGMENT_PROBS)
    end = dt.datetime.now()

    for i in range(N_USERS):
        seg = segments[i]
        nbh = pick_neighborhood()
        u_lat, u_lng = jitter(nbh["lat"], nbh["lng"], max_km=3.0)
        first = fake.first_name()
        last = fake.last_name()
        uid = gen_id("u")
        days_ago = int(np.random.beta(2, 5) * 30 * TIME_RANGE_MONTHS)
        created = end - dt.timedelta(days=days_ago, hours=random.randint(0, 23))
        addresses = [{
            "label": "Ev", "city": nbh["city"], "district": nbh["name"],
            "address": fake.street_address(), "lat": u_lat, "lng": u_lng,
        }]
        users.append({
            "uid": uid,
            "email": f"{uid.replace('_', '.')}@yugoda.test",
            "displayName": f"{first} {last}",
            "firstName": first, "lastName": last,
            "role": "customer",
            "language": "tr", "preferredLanguage": "tr",
            "favorites": "[]",
            "location": json.dumps({"lat": u_lat, "lng": u_lng,
                                    "city": nbh["city"], "district": nbh["name"]}, ensure_ascii=False),
            "addresses": json.dumps(addresses, ensure_ascii=False),
            "walletBalance": round(random.uniform(0, 200), 2),
            "countryCode": "+90",
            "mobileNumber": fake.msisdn()[:11],
            "notificationsEnabled": 1,
            "createdAt": created,
            "_segment": seg, "_lat": u_lat, "_lng": u_lng,
            "_neighborhood": nbh["name"], "_city": nbh["city"],
        })
    return users

def gen_stores():
    print(f"[STORES] {N_STORES} store üretiliyor...")
    stores = []
    cat_keys = list(CATEGORIES.keys())
    end = dt.datetime.now()

    for i in range(N_STORES):
        cat = random.choice(cat_keys)
        nbh = pick_neighborhood()
        s_lat, s_lng = jitter(nbh["lat"], nbh["lng"], max_km=1.5)
        merchant = CATEGORIES[cat]["merchant"]

        if cat in ("Bakery", "Desserts"):
            name = f"{random.choice(BAKERY_NAMES)} {random.choice(STORE_NAME_SUFFIXES)}"
        elif cat == "Cafe":
            name = f"{random.choice(CAFE_NAMES)} Cafe"
        elif cat == "Sushi":
            name = f"{random.choice(SUSHI_NAMES)} Sushi"
        else:
            name = f"{random.choice(STORE_NAME_PREFIXES)} {random.choice(STORE_NAME_SUFFIXES)}"

        sid = gen_id("s")
        rating = round(float(np.clip(np.random.normal(4.4, 0.4), 3.0, 5.0)), 1)

        stores.append({
            "id": sid,
            "name": name,
            "category": cat,
            "description": f"{nbh['name']} bölgesinde {cat.lower()} kategorisinde hizmet veren mağaza.",
            "address": f"{fake.street_address()}, {nbh['name']}, {nbh['city']}",
            "location": json.dumps({"lat": s_lat, "lng": s_lng,
                                    "city": nbh["city"], "district": nbh["name"]}, ensure_ascii=False),
            "operatingHours": json.dumps({
                "mon": "09:00-22:00", "tue": "09:00-22:00", "wed": "09:00-22:00",
                "thu": "09:00-22:00", "fri": "09:00-23:00",
                "sat": "10:00-23:00", "sun": "10:00-22:00"
            }),
            "isApproved": 1,
            "status": "active",
            "rating": rating,
            "phone": "+90" + fake.msisdn()[2:12],
            "email": f"{sid}@yugoda.test",
            "commissionRate": 15.0,
            "createdAt": end - dt.timedelta(days=random.randint(60, 30 * TIME_RANGE_MONTHS + 60)),
            "_lat": s_lat, "_lng": s_lng, "_merchant": merchant,
            "_neighborhood": nbh["name"], "_city": nbh["city"],
        })
    return stores

def gen_bags(stores):
    print(f"[BAGS] {N_BAGS} bag üretiliyor...")
    bags = []
    end = dt.datetime.now()

    counts = np.random.poisson(N_BAGS / N_STORES, size=N_STORES)
    counts = np.clip(counts, 3, 18)
    diff = N_BAGS - counts.sum()
    while diff != 0:
        i = random.randint(0, N_STORES - 1)
        if diff > 0 and counts[i] < 18:
            counts[i] += 1; diff -= 1
        elif diff < 0 and counts[i] > 3:
            counts[i] -= 1; diff += 1
        else:
            continue

    for s_idx, store in enumerate(stores):
        cat = store["category"]
        cat_cfg = CATEGORIES[cat]
        for _ in range(int(counts[s_idx])):
            bid = gen_id("b")
            orig = round(random.uniform(*cat_cfg["orig_price"]), 1)
            discount = random.uniform(0.40, 0.65)
            price = round(orig * (1 - discount), 1)
            diet_choices = cat_cfg["dietary"]
            diet = random.choices([d[0] for d in diet_choices],
                                  weights=[d[1] for d in diet_choices])[0]
            cal = random.randint(*cat_cfg["calories"])
            tags = random.sample(CATEGORY_TAGS[cat], k=min(2, len(CATEGORY_TAGS[cat])))
            name = random.choice(BAG_NAME_TEMPLATES).format(cat=cat)
            bag_rating = round(float(np.clip(np.random.normal(store["rating"], 0.2), 3.0, 5.0)), 1)

            bags.append({
                "id": bid,
                "restaurantId": store["id"],
                "restaurantName": store["name"],
                "category": cat,
                "merchantType": cat_cfg["merchant"],
                "description": BAG_DESCRIPTIONS[cat],
                "price": price,
                "originalPrice": orig,
                "available": random.randint(1, 8),
                "pickupTime": random.choice(PICKUP_TIME_SLOTS),
                "image": None,
                "tags": json.dumps(tags, ensure_ascii=False),
                "calories": cal,
                "dietaryType": diet,
                "distance": None,
                "coordinates": json.dumps({"lat": store["_lat"], "lng": store["_lng"]}),
                "isLastChance": 1 if random.random() < 0.15 else 0,
                "countdown": None,
                "rating": bag_rating,
                "createdAt": end - dt.timedelta(days=random.randint(1, 90)),
                "_store_idx": s_idx,
                "_store_lat": store["_lat"],
                "_store_lng": store["_lng"],
                "_orig_price": orig,
                "_price": price,
                "_name": name,
            })

    pareto = np.random.pareto(1.16, size=len(bags)) + 1.0
    pareto = pareto / pareto.sum()
    for i, b in enumerate(bags):
        b["_popularity"] = float(pareto[i])

    print(f"   bag/store: avg={N_BAGS/N_STORES:.1f}, min={int(counts.min())}, max={int(counts.max())}")
    return bags

def gen_orders(users, stores, bags):
    print(f"[ORDERS] {N_ORDERS} order hedef (segment + popularity + distance + time aware)...")
    end = dt.datetime.now()

    user_orders = []
    for u in users:
        lo, hi = SEGMENT_ORDER_RANGE[u["_segment"]]
        user_orders.append(random.randint(lo, hi))
    total = sum(user_orders)
    scale = N_ORDERS / total
    user_orders = [max(1, int(round(n * scale))) for n in user_orders]

    user_pref_stores = {}
    for u in users:
        seg = u["_segment"]
        lo, hi = SEGMENT_STORE_SCOPE[seg]
        n_pref = random.randint(lo, hi)
        store_dists = [haversine_km(u["_lat"], u["_lng"], s["_lat"], s["_lng"]) for s in stores]
        weights = []
        for s_idx, s in enumerate(stores):
            d = store_dists[s_idx]
            base = 1.0 / (1.0 + (d / 5.0)**2)
            cat_aff = 1.0
            if seg == "premium" and s["category"] in PREMIUM_CATEGORIES:
                cat_aff = 3.0
            elif seg == "healthy":
                cat_aff = 4.0 if s["category"] in HEALTHY_CATEGORIES else 0.3
            weights.append(base * cat_aff)
        weights = np.array(weights)
        if weights.sum() == 0:
            weights = np.ones(len(stores))
        weights = weights / weights.sum()
        chosen = np.random.choice(len(stores), size=min(n_pref, len(stores)),
                                  replace=False, p=weights)
        user_pref_stores[u["uid"]] = list(chosen)

    bag_by_store = defaultdict(list)
    for b in bags:
        bag_by_store[b["_store_idx"]].append(b)

    status_keys = [s[0] for s in ORDER_STATUS_DIST]
    status_weights = [s[1] for s in ORDER_STATUS_DIST]

    orders = []
    for u_idx, u in enumerate(users):
        n = user_orders[u_idx]
        seg = u["_segment"]
        pref_stores = user_pref_stores[u["uid"]]
        if not pref_stores:
            continue

        for _ in range(n):
            store_idx = random.choice(pref_stores)
            cands = bag_by_store[store_idx]
            if not cands:
                continue

            bag_w = []
            for b in cands:
                w = b["_popularity"] * 100.0
                if seg == "budget":
                    w *= max(0.1, 200.0 / (b["_price"] + 50))
                elif seg == "premium":
                    w *= (b["_orig_price"] / 100.0)
                bag_w.append(w)
            bag_w = np.array(bag_w)
            if bag_w.sum() == 0:
                bag_w = np.ones(len(cands))
            bag_w = bag_w / bag_w.sum()
            ci = int(np.random.choice(len(cands), p=bag_w))
            cb = cands[ci]

            days_ago = int(np.random.beta(1.5, 4) * 30 * TIME_RANGE_MONTHS)
            created = end - dt.timedelta(days=days_ago,
                                         hours=random.randint(0, 23),
                                         minutes=random.randint(0, 59))
            if created < u["createdAt"]:
                created = u["createdAt"] + dt.timedelta(hours=random.randint(1, 48))

            age_days = (end - created).days
            if age_days < 1:
                status = random.choices(["pending", "confirmed", "preparing", "ready"],
                                        weights=[0.4, 0.3, 0.2, 0.1])[0]
            else:
                status = random.choices(status_keys, weights=status_weights)[0]

            delivered_at = None
            if status == "delivered":
                delivered_at = created + dt.timedelta(hours=random.uniform(1, 4))

            store = stores[store_idx]
            qty = 1 if random.random() < 0.85 else 2
            items = [{"bagId": cb["id"], "name": cb["_name"],
                      "quantity": qty, "price": cb["_price"]}]
            subtotal = round(cb["_price"] * qty, 2)
            booking_fee = round(subtotal * 0.05, 2)
            total_amt = round(subtotal + booking_fee, 2)
            delivery_type = "pickup" if random.random() < 0.7 else "delivery"

            orders.append({
                "id": gen_id("o"),
                "userId": u["uid"],
                "restaurantId": store["id"],
                "bagId": cb["id"],
                "restaurantName": store["name"],
                "items": json.dumps(items, ensure_ascii=False),
                "price": subtotal,
                "tipAmount": 0.0,
                "tax": 0.0,
                "bookingFee": booking_fee,
                "deliveryFee": 0.0,
                "total": total_amt,
                "status": status,
                "deliveryType": delivery_type,
                "paymentMethod": random.choices(["card", "wallet"], weights=[0.85, 0.15])[0],
                "leaveAtDoor": 0,
                "createdAt": created,
                "deliveredAt": delivered_at,
                "deliveryLat": u["_lat"] if delivery_type == "delivery" else None,
                "deliveryLng": u["_lng"] if delivery_type == "delivery" else None,
                "deliveryCode": ''.join(random.choices('0123456789', k=4)),
            })

    print(f"   üretilen: {len(orders)} order")
    return orders

def gen_reviews(orders, users):
    print("[REVIEWS] Review'lar üretiliyor (delivered orderlardan)...")
    with open(TEMPLATES_PATH, encoding="utf-8") as f:
        templates = json.load(f)

    rating_choices = [5, 4, 3, 2, 1]
    rating_probs = [0.50, 0.25, 0.15, 0.07, 0.03]
    comment_prob = {5: 0.85, 4: 0.65, 3: 0.45, 2: 0.85, 1: 0.95}
    review_prob = {5: 0.45, 4: 0.40, 3: 0.30, 2: 0.50, 1: 0.65}

    user_by_uid = {u["uid"]: u for u in users}
    delivered = [o for o in orders if o["status"] == "delivered"]
    print(f"   delivered orderlar: {len(delivered)}")

    reviews = []
    seen = set()
    for o in delivered:
        rating = int(np.random.choice(rating_choices, p=rating_probs))
        if random.random() > review_prob[rating]:
            continue
        key = (o["userId"], o["id"])
        if key in seen:
            continue
        seen.add(key)

        comment = None
        if random.random() < comment_prob[rating]:
            comment = random.choice(templates[str(rating)])

        u = user_by_uid[o["userId"]]
        if o["deliveredAt"]:
            r_created = o["deliveredAt"] + dt.timedelta(hours=random.randint(2, 24*7))
        else:
            r_created = o["createdAt"] + dt.timedelta(days=1)

        reviews.append({
            "id": gen_id("r"),
            "userId": o["userId"],
            "restaurantId": o["restaurantId"],
            "orderId": o["id"],
            "rating": float(rating),
            "comment": comment,
            "userName": u["displayName"],
            "createdAt": r_created,
        })

    print(f"   üretilen: {len(reviews)} review")
    return reviews

# ─── INSERT ───────────────────────────────────────────────────────────────
USER_COLS = [("uid", "uid"), ("email", "email"), ("display_name", "displayName"),
             ("first_name", "firstName"), ("last_name", "lastName"), ("role", "role"),
             ("language", "language"), ("preferred_language", "preferredLanguage"),
             ("favorites", "favorites"), ("location", "location"), ("addresses", "addresses"),
             ("wallet_balance", "walletBalance"), ("country_code", "countryCode"),
             ("mobile_number", "mobileNumber"),
             ("notifications_enabled", "notificationsEnabled"), ("created_at", "createdAt")]

STORE_COLS = [("id", "id"), ("name", "name"), ("category", "category"),
              ("description", "description"), ("address", "address"),
              ("location", "location"), ("operating_hours", "operatingHours"),
              ("is_approved", "isApproved"), ("status", "status"), ("rating", "rating"),
              ("phone", "phone"), ("email", "email"),
              ("commission_rate", "commissionRate"), ("created_at", "createdAt")]

BAG_COLS = [("id", "id"), ("restaurant_id", "restaurantId"),
            ("restaurant_name", "restaurantName"), ("category", "category"),
            ("merchant_type", "merchantType"), ("description", "description"),
            ("price", "price"), ("original_price", "originalPrice"),
            ("available", "available"), ("pickup_time", "pickupTime"),
            ("image", "image"), ("tags", "tags"), ("calories", "calories"),
            ("dietary_type", "dietaryType"), ("distance", "distance"),
            ("coordinates", "coordinates"), ("is_last_chance", "isLastChance"),
            ("countdown", "countdown"), ("rating", "rating"),
            ("created_at", "createdAt")]

ORDER_COLS = [("id", "id"), ("user_id", "userId"),
              ("restaurant_id", "restaurantId"), ("bag_id", "bagId"),
              ("restaurant_name", "restaurantName"), ("items", "items"),
              ("price", "price"), ("tip_amount", "tipAmount"), ("tax", "tax"),
              ("booking_fee", "bookingFee"), ("delivery_fee", "deliveryFee"),
              ("total", "total"), ("status", "status"),
              ("delivery_type", "deliveryType"), ("payment_method", "paymentMethod"),
              ("leave_at_door", "leaveAtDoor"), ("created_at", "createdAt"),
              ("delivered_at", "deliveredAt"), ("delivery_lat", "deliveryLat"),
              ("delivery_lng", "deliveryLng"), ("delivery_code", "deliveryCode")]

REVIEW_COLS = [("id", "id"), ("user_id", "userId"),
               ("restaurant_id", "restaurantId"), ("order_id", "orderId"),
               ("rating", "rating"), ("comment", "comment"),
               ("user_name", "userName"), ("created_at", "createdAt")]

def bulk_insert(conn, table, rows, col_map):
    if not rows:
        print(f"   {table}: 0 satır (skip)")
        return
    sql_cols = [c[0] for c in col_map]
    py_keys = [c[1] for c in col_map]
    placeholder = "(" + ", ".join(["%s"] * len(sql_cols)) + ")"
    sql = f"INSERT INTO {table} ({', '.join(sql_cols)}) VALUES %s"
    values = [tuple(r[k] for k in py_keys) for r in rows]
    with conn.cursor() as cur:
        execute_values(cur, sql, values, template=placeholder, page_size=500)
    conn.commit()
    print(f"   ✓ {table}: {len(rows)} satır eklendi")

# ─── Validation ───────────────────────────────────────────────────────────
def export_segments_csv(users):
    print(f"[EXPORT] {SEGMENTS_CSV} yazılıyor...")
    df = pd.DataFrame([{
        "user_id": u["uid"], "segment": u["_segment"],
        "city": u["_city"], "neighborhood": u["_neighborhood"],
        "lat": u["_lat"], "lng": u["_lng"],
    } for u in users])
    df.to_csv(SEGMENTS_CSV, index=False, encoding="utf-8")
    print(f"   ✓ {len(df)} satır")

def validate(users, stores, bags, orders, reviews):
    print("\n══════ VALIDATION ══════")
    print(f"Users:   {len(users):>6}")
    print(f"Stores:  {len(stores):>6}")
    print(f"Bags:    {len(bags):>6}")
    print(f"Orders:  {len(orders):>6}")
    print(f"Reviews: {len(reviews):>6}")

    seg_counts = Counter(u["_segment"] for u in users)
    print("\nSegment dağılımı:")
    for s in SEGMENTS:
        c = seg_counts[s]
        print(f"  {s:10s}: {c:4d} ({100*c/len(users):5.1f}%)")

    user_orders = Counter(o["userId"] for o in orders)
    if user_orders:
        vals = list(user_orders.values())
        print(f"\nOrder/user: avg={np.mean(vals):.1f}, "
              f"median={int(np.median(vals))}, max={max(vals)}")

    seg_avg_orders = defaultdict(list)
    user_seg = {u["uid"]: u["_segment"] for u in users}
    for uid, cnt in user_orders.items():
        seg_avg_orders[user_seg[uid]].append(cnt)
    print("\nSegment başına ortalama order:")
    for s in SEGMENTS:
        if seg_avg_orders[s]:
            print(f"  {s:10s}: avg={np.mean(seg_avg_orders[s]):.1f}, "
                  f"n={len(seg_avg_orders[s])}")

    bag_orders = Counter(o["bagId"] for o in orders)
    sorted_pop = sorted(bag_orders.values(), reverse=True)
    if sorted_pop:
        n_top = max(1, int(len(sorted_pop) * 0.2))
        top_share = sum(sorted_pop[:n_top]) / sum(sorted_pop)
        print(f"\nPareto check: top %20 bag → %{top_share*100:.0f} order "
              f"(target: ~%75-85)")

    status_counts = Counter(o["status"] for o in orders)
    print("\nOrder status:")
    for st, cnt in status_counts.most_common():
        print(f"  {st:12s}: {cnt:5d} ({100*cnt/len(orders):5.1f}%)")

    rating_counts = Counter(int(r["rating"]) for r in reviews)
    print("\nReview rating dağılımı:")
    for r in [5, 4, 3, 2, 1]:
        c = rating_counts.get(r, 0)
        pct = 100 * c / len(reviews) if reviews else 0
        print(f"  {r}★: {c:5d} ({pct:5.1f}%)")

    if reviews:
        with_comment = sum(1 for r in reviews if r["comment"])
        print(f"\nComment'li review oranı: %{100*with_comment/len(reviews):.1f}")

# ─── Main ─────────────────────────────────────────────────────────────────
def main():
    if not TEMPLATES_PATH.exists():
        print(f"ERROR: {TEMPLATES_PATH} bulunamadı.")
        sys.exit(1)

    print("═══ YuGoDa Synthetic Data Generator ═══")
    print(f"Hedef: {N_USERS} user, {N_STORES} store, {N_BAGS} bag, {N_ORDERS} order")
    print(f"Time range: son {TIME_RANGE_MONTHS} ay\n")

    conn = connect_db()
    try:
        truncate_synthetic(conn)
        users = gen_users()
        stores = gen_stores()
        bags = gen_bags(stores)
        orders = gen_orders(users, stores, bags)
        reviews = gen_reviews(orders, users)

        print("\n[INSERT] DB'ye yazılıyor...")
        bulk_insert(conn, "users", users, USER_COLS)
        bulk_insert(conn, "stores", stores, STORE_COLS)
        bulk_insert(conn, "bags", bags, BAG_COLS)
        bulk_insert(conn, "orders", orders, ORDER_COLS)
        bulk_insert(conn, "reviews", reviews, REVIEW_COLS)

        export_segments_csv(users)
        validate(users, stores, bags, orders, reviews)
        print("\n✓ Tamamlandı.")
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    main()
