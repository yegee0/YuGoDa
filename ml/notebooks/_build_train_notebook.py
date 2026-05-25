"""
Two-Tower training notebook'unu (.ipynb) inşa eder.

Çalıştırma:
    python3 ml/notebooks/_build_train_notebook.py

Bu script bir kez çalıştırılır ve `train_two_tower.ipynb`'i üretir. Notebook
hücrelerinin Python kaynak kodu burada gerçek Python olarak tutulur (JSON
escape derdi olmadan); script çalışınca standart .ipynb formatına çevrilir.
"""
import json
from pathlib import Path

OUT = Path(__file__).parent / "train_two_tower.ipynb"


def md(src: str) -> dict:
    return {"cell_type": "markdown", "metadata": {}, "source": src}


def code(src: str) -> dict:
    return {"cell_type": "code", "execution_count": None, "metadata": {}, "outputs": [], "source": src}


cells = []

# ─── Section 1: Title ─────────────────────────────────────────────────────
cells.append(md("""# Two-Tower Recommendation Model — YuGoDa

Bu notebook, YuGoDa'nın synthetic verisini kullanarak bir **Two-Tower** öneri modeli eğitir ve **ONNX**'e export eder. Spring backend bu ONNX modellerini doğrudan yükler.

**Mimari:**
- **User Tower:** user_id embedding + sipariş geçmişi (son 10 bag, mean-pool of MiniLM text embeddings) → 128-d L2 normalized
- **Item Tower:** bag text emb (frozen MiniLM) + categorical (category/merchant/dietary/store embeddings) + numeric (price, rating, calories, discount) → 128-d L2 normalized
- **Loss:** In-batch contrastive (sampled softmax)
- **Eval:** Recall@10 + NDCG@10 (time-based 14 günlük validation split)

**Donanım:** RTX 5070 Ti tavsiye edilir (BF16 mixed precision desteği). CPU üzerinde de çalışır ama yavaş (~30 dk/epoch yerine ~3 sn).

**Önkoşullar:**
- `python3 ml/scripts/seed_data.py` çalıştırılmış olmalı (synthetic data Cloud SQL'de)
- `pip install -r ml/requirements.txt` yapılmış olmalı
- RTX 5070 Ti için: `pip install torch --index-url https://download.pytorch.org/whl/cu124` (CUDA 12.4+) ya da nightly
"""))

# ─── Section 2: Setup ─────────────────────────────────────────────────────
cells.append(md("## 1. Setup"))

cells.append(code("""import os
import sys
import json
import math
import time
import random
import datetime as dt
from pathlib import Path
from collections import defaultdict, Counter

import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
from tqdm.auto import tqdm

SEED = 42
random.seed(SEED); np.random.seed(SEED); torch.manual_seed(SEED)
if torch.cuda.is_available():
    torch.cuda.manual_seed_all(SEED)

DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f'PyTorch: {torch.__version__}')
print(f'Device: {DEVICE}')
if DEVICE.type == 'cuda':
    print(f'GPU: {torch.cuda.get_device_name(0)}')
    print(f'VRAM: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB')
    print(f'BF16 supported: {torch.cuda.is_bf16_supported()}')
"""))

cells.append(code("""# Paths — notebook'un nerede çalıştığına bakmaksızın proje root'unu bulur
def find_project_root():
    p = Path.cwd().resolve()
    for _ in range(10):
        if (p / 'ml' / 'data').exists():
            return p
        if p == p.parent:
            break
        p = p.parent
    raise RuntimeError('Project root not found — manuel olarak ROOT path verin')

ROOT = find_project_root()
ML_DIR = ROOT / 'ml'
DATA_DIR = ML_DIR / 'data'
MODELS_DIR = ML_DIR / 'models'
MODELS_DIR.mkdir(exist_ok=True, parents=True)
print(f'ROOT: {ROOT}')
print(f'MODELS_DIR: {MODELS_DIR}')
"""))

cells.append(code("""# DB credentials .env.local'dan okunur
from dotenv import load_dotenv
load_dotenv(ROOT / '.env.local', override=False)
load_dotenv(ROOT / '.env', override=False)

DB_CONFIG = {
    'host': os.environ.get('DB_HOST', 'localhost'),
    'port': int(os.environ.get('DB_PORT', '5432')),
    'user': os.environ.get('DB_USERNAME', 'postgres'),
    'password': os.environ.get('DB_PASSWORD', 'postgres'),
    'database': os.environ.get('DB_NAME', 'postgres'),
    'sslmode': os.environ.get('DB_SSLMODE', 'prefer'),
}
print(f\"DB: {DB_CONFIG['host']}:{DB_CONFIG['port']} / {DB_CONFIG['database']} (sslmode={DB_CONFIG['sslmode']})\")
"""))

# ─── Section 3: Data Load ─────────────────────────────────────────────────
cells.append(md("## 2. Cloud SQL'den Veri Yükle"))

cells.append(code("""import psycopg2

def fetch_df(query):
    conn = psycopg2.connect(**DB_CONFIG)
    try:
        cur = conn.cursor()
        cur.execute(query)
        cols = [d[0] for d in cur.description]
        rows = cur.fetchall()
    finally:
        conn.close()
    return pd.DataFrame(rows, columns=cols)

# Tum katalog: synthetic + gercek/demo paketler dahil edilir, ki model
# uygulamanin gercekten satigi bag'leri tanisin (yoksa gercek kullanici hep
# cold-start fallback'e duser). Eskiden sadece synth_ cekiliyordu.
users_df = fetch_df(\"\"\"
    SELECT uid, location, addresses, created_at
    FROM users
\"\"\")
print(f'Users: {len(users_df)}')

stores_df = fetch_df(\"\"\"
    SELECT id, name, category, location, rating, created_at
    FROM stores
\"\"\")
print(f'Stores: {len(stores_df)}')

bags_df = fetch_df(\"\"\"
    SELECT id, restaurant_id, restaurant_name, category, merchant_type,
           description, price, original_price, dietary_type, calories,
           coordinates, rating, tags, created_at
    FROM bags
\"\"\")
print(f'Bags: {len(bags_df)}')

# Gercek/demo paketlerde, synth'te hep dolu olan alanlar bos (NaN) olabilir.
# Vocab kurma ve feature hesabi NaN'da patlamasin diye doldur:
for _c, _d in [('category', 'Unknown'), ('merchant_type', 'Unknown'),
               ('dietary_type', 'Unknown'), ('restaurant_name', 'Unknown'),
               ('description', '')]:
    if _c in bags_df.columns:
        bags_df[_c] = bags_df[_c].fillna(_d)
for _c in ['price', 'original_price', 'calories', 'rating']:
    bags_df[_c] = pd.to_numeric(bags_df[_c], errors='coerce')

orders_df = fetch_df(\"\"\"
    SELECT id, user_id, restaurant_id, bag_id, status, total,
           created_at, delivered_at
    FROM orders
    WHERE status = 'delivered'
    ORDER BY created_at
\"\"\")
orders_df['created_at'] = pd.to_datetime(orders_df['created_at'])
print(f'Delivered orders: {len(orders_df)}')
print(f'Date range: {orders_df[\"created_at\"].min()}  →  {orders_df[\"created_at\"].max()}')
"""))

# ─── Section 4: Feature Engineering ───────────────────────────────────────
cells.append(md("## 3. Feature Engineering"))

cells.append(code("""# ID indexing — vocabulary'leri kur
user2idx = {uid: i for i, uid in enumerate(users_df['uid'].tolist())}
bag2idx  = {bid: i for i, bid in enumerate(bags_df['id'].tolist())}
store2idx = {sid: i for i, sid in enumerate(stores_df['id'].tolist())}

# Categorical features
all_cats = sorted(bags_df['category'].unique().tolist())
cat2idx = {c: i for i, c in enumerate(all_cats)}

all_merchants = sorted(bags_df['merchant_type'].unique().tolist())
merchant2idx = {m: i for i, m in enumerate(all_merchants)}

all_dietary = sorted(bags_df['dietary_type'].unique().tolist())
dietary2idx = {d: i for i, d in enumerate(all_dietary)}

print(f'#users={len(user2idx)}  #bags={len(bag2idx)}  #stores={len(store2idx)}')
print(f'#categories={len(cat2idx)}  #merchant={len(merchant2idx)}  #dietary={len(dietary2idx)}')
"""))

cells.append(md("### 3.1 Bag Text Embeddings (Frozen MiniLM)\\n\\nHer bag'in metnini (`restaurant_name + category + description`) çok dilli MiniLM ile 384-d vektöre encode ederiz. Bu vektörler **frozen** — hem item tower'da hem user tower'ın history pool'unda kullanılır."))

cells.append(code("""# İlk çalıştırmada model indirilir (~470 MB), sonra cache'lenir
from sentence_transformers import SentenceTransformer

EMB_CACHE = MODELS_DIR / 'bag_text_embeddings.pt'

# Cache yalnizca satir sayisi mevcut bag sayisiyla eslesirse kullanilir.
# Aksi halde (katalog buyudu / synth filtresi kaldirildi) bayat cache item
# tower'da index-out-of-bounds verir -> yeniden hesapla.
bag_text_embs = None
if EMB_CACHE.exists():
    cached = torch.load(EMB_CACHE, map_location='cpu')
    if cached.shape[0] == len(bags_df):
        bag_text_embs = cached
        print(f'Loaded cached bag embeddings: {bag_text_embs.shape}')
    else:
        print(f'Cache stale ({cached.shape[0]} satir != {len(bags_df)} bag) -- yeniden hesaplaniyor')

if bag_text_embs is None:
    print('Loading multilingual MiniLM (first time may take a minute)...')
    text_encoder = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2', device=DEVICE)
    text_encoder.eval()

    bag_texts = bags_df.apply(
        lambda r: f\"{r['restaurant_name']} - {r['category']} - {r['description'] or ''}\",
        axis=1
    ).tolist()

    print(f'Encoding {len(bag_texts)} bag texts...')
    with torch.no_grad():
        bag_text_embs = text_encoder.encode(
            bag_texts, batch_size=64, show_progress_bar=True,
            convert_to_tensor=True, normalize_embeddings=False,
        ).cpu()
    # ST.encode returns an inference tensor (inference_mode internally) -> clone to a
    # normal tensor, else model.load_state_dict copy_ fails on torch>=2.x.
    bag_text_embs = bag_text_embs.clone()
    torch.save(bag_text_embs, EMB_CACHE)
    print(f'Saved to {EMB_CACHE}')
    del text_encoder

print(f'Bag text embeddings: {bag_text_embs.shape}')  # (n_bags, 384)
"""))

cells.append(md("### 3.2 Bag Numeric & Categorical Features"))

cells.append(code("""# Numeric features
bag_numeric_raw = bags_df[['price', 'original_price', 'calories', 'rating']].values.astype(np.float32)
# Eksik (NaN) sayisal degerleri kolon ortalamasiyla doldur (gercek/demo paketler):
_cm = np.nanmean(bag_numeric_raw, axis=0)
_cm = np.where(np.isnan(_cm), 0.0, _cm)
_nanmask = np.isnan(bag_numeric_raw)
bag_numeric_raw[_nanmask] = np.take(_cm, np.where(_nanmask)[1])
bag_num_mean = bag_numeric_raw.mean(axis=0)
bag_num_std = bag_numeric_raw.std(axis=0) + 1e-6
bag_numeric = (bag_numeric_raw - bag_num_mean) / bag_num_std

# Discount ratio (engineered feature)
_op = pd.to_numeric(bags_df['original_price'], errors='coerce').values.astype(np.float32)
_pr = pd.to_numeric(bags_df['price'], errors='coerce').values.astype(np.float32)
discount = np.where(_op > 0, 1.0 - _pr / np.where(_op > 0, _op, 1.0), 0.0).astype(np.float32)
discount = np.nan_to_num(discount, nan=0.0)
discount_norm = ((discount - discount.mean()) / (discount.std() + 1e-6)).astype(np.float32)
bag_numeric = np.column_stack([bag_numeric, discount_norm.reshape(-1, 1)])

# Categorical → indices (preserve order from bags_df)
bag_cat_idx = bags_df['category'].map(cat2idx).values.astype(np.int64)
bag_merchant_idx = bags_df['merchant_type'].map(merchant2idx).values.astype(np.int64)
bag_dietary_idx = bags_df['dietary_type'].map(dietary2idx).values.astype(np.int64)
bag_store_idx = bags_df['restaurant_id'].map(store2idx).fillna(0).astype(np.int64).values

print(f'bag_numeric shape: {bag_numeric.shape}')
print(f'bag_cat range: [{bag_cat_idx.min()}, {bag_cat_idx.max()}]')
"""))

# ─── Section 5: User History ──────────────────────────────────────────────
cells.append(md("## 4. User History (Sequential Features)"))

cells.append(code("""# Her user'ın bag history'sini zaman sırasına göre topla
# Orphan temizligi: silinmis bag/user'a referans veren delivered order'lari at.
# (Gercek veride birkac order silinmis bag_id'ye isaret ediyor; Dataset
#  __getitem__ guard'siz bag2idx[bag_id] yaptigi icin KeyError verirdi.)
_before = len(orders_df)
orders_df = orders_df[orders_df['bag_id'].isin(bag2idx) & orders_df['user_id'].isin(user2idx)].copy()
if len(orders_df) < _before:
    print(f'Dropped {_before - len(orders_df)} orphan order(s) referencing missing bag/user')

orders_df = orders_df.sort_values('created_at').reset_index(drop=True)

user_history = defaultdict(list)
for _, row in orders_df.iterrows():
    if row['user_id'] in user2idx and row['bag_id'] in bag2idx:
        user_history[row['user_id']].append({
            'bag_idx': bag2idx[row['bag_id']],
            'created_at': row['created_at'],
        })

hist_lens = [len(h) for h in user_history.values()]
print(f'Users with history: {len(user_history)}')
print(f'Order/user: avg={np.mean(hist_lens):.1f}, median={int(np.median(hist_lens))}, max={max(hist_lens)}')
"""))

# ─── Section 6: Train/Val Split ───────────────────────────────────────────
cells.append(md("## 5. Train / Val Split (Time-Based)"))

cells.append(code("""# Son 14 gün → validation, gerisi → training
val_cutoff = orders_df['created_at'].max() - pd.Timedelta(days=14)
train_orders = orders_df[orders_df['created_at'] < val_cutoff].copy().reset_index(drop=True)
val_orders   = orders_df[orders_df['created_at'] >= val_cutoff].copy().reset_index(drop=True)

# Cold-start hariç tut: val user'ı train'de görülmüş olmalı
known_users = set(train_orders['user_id'].unique())
val_orders_known = val_orders[val_orders['user_id'].isin(known_users)].reset_index(drop=True)

print(f'Train: {len(train_orders)} orders  ({train_orders[\"user_id\"].nunique()} users)')
print(f'Val:   {len(val_orders)} orders  ({len(val_orders_known)} for known users)')
print(f'Cutoff: {val_cutoff}')
"""))

# ─── Section 7: PyTorch Dataset ───────────────────────────────────────────
cells.append(md("## 6. PyTorch Dataset"))

cells.append(code("""HISTORY_LEN = 10  # max past bags per user

class TwoTowerDataset(Dataset):
    \"\"\"Her order için (user_features, bag_idx) çifti üretir.

    User feature'ları sadece BU order'dan ÖNCEKI history'i kullanır (data leakage yok).
    \"\"\"
    def __init__(self, orders_df, user2idx, bag2idx, user_history_dict, max_history=HISTORY_LEN):
        self.orders = orders_df.reset_index(drop=True)
        self.user2idx = user2idx
        self.bag2idx = bag2idx
        self.user_history = user_history_dict
        self.max_history = max_history
        self._build_history_lookup()

    def _build_history_lookup(self):
        self.histories = []
        for _, row in self.orders.iterrows():
            uid = row['user_id']
            cutoff = row['created_at']
            past = [h['bag_idx'] for h in self.user_history.get(uid, []) if h['created_at'] < cutoff]
            past = past[-self.max_history:]
            self.histories.append(past)

    def __len__(self):
        return len(self.orders)

    def __getitem__(self, idx):
        row = self.orders.iloc[idx]
        user_idx = self.user2idx[row['user_id']]
        bag_idx = self.bag2idx[row['bag_id']]
        hist = self.histories[idx]
        n_h = len(hist)
        padded = hist + [0] * (self.max_history - n_h)  # 0 dummy bag, mask'le sıfırlanacak
        mask = [1.0] * n_h + [0.0] * (self.max_history - n_h)
        return {
            'user_idx': user_idx,
            'bag_idx': bag_idx,
            'history': torch.tensor(padded, dtype=torch.long),
            'history_mask': torch.tensor(mask, dtype=torch.float),
            'n_history': n_h,
        }

train_ds = TwoTowerDataset(train_orders, user2idx, bag2idx, user_history)
val_ds   = TwoTowerDataset(val_orders_known, user2idx, bag2idx, user_history)
print(f'Train ds: {len(train_ds)}  Val ds: {len(val_ds)}')
"""))

# ─── Section 8: Model ─────────────────────────────────────────────────────
cells.append(md("## 7. Two-Tower Model"))

cells.append(code("""EMBED_DIM = int(os.environ.get('NB_EMBED_DIM', '128'))
TEXT_EMB_DIM = bag_text_embs.shape[1]  # 384 for MiniLM

class UserTower(nn.Module):
    \"\"\"User: id_emb + history_pool (mean of bag text emb) + log(n_history) → MLP → 128-d L2-norm\"\"\"
    def __init__(self, n_users, bag_text_table, embed_dim=EMBED_DIM):
        super().__init__()
        # +1 for unknown/cold-start (handled by embedding index 0)
        self.user_id_emb = nn.Embedding(n_users + 1, embed_dim, padding_idx=0)
        self.register_buffer('bag_text_table', bag_text_table.float())
        self.history_proj = nn.Linear(TEXT_EMB_DIM, embed_dim)
        self.mlp = nn.Sequential(
            nn.Linear(embed_dim * 2 + 1, embed_dim * 2),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(embed_dim * 2, embed_dim),
        )

    def forward(self, user_idx, history, history_mask, n_history):
        # +1: index 0 reserved for unknown user
        u = self.user_id_emb(user_idx + 1)

        h_text = self.bag_text_table[history]  # (B, H, 384)
        h_proj = self.history_proj(h_text)     # (B, H, embed_dim)
        mask = history_mask.unsqueeze(-1)      # (B, H, 1)
        h_sum = (h_proj * mask).sum(dim=1)
        h_count = mask.sum(dim=1).clamp(min=1.0)
        h_pool = h_sum / h_count               # (B, embed_dim)

        n_feat = torch.log1p(n_history.float()).unsqueeze(-1)
        combined = torch.cat([u, h_pool, n_feat], dim=-1)
        out = self.mlp(combined)
        return F.normalize(out, dim=-1)


class ItemTower(nn.Module):
    \"\"\"Item: text_proj + cat/merchant/dietary/store embs + numeric → MLP → 128-d L2-norm\"\"\"
    def __init__(self, n_categories, n_merchants, n_dietary, n_stores,
                 bag_text_table, bag_numeric_arr, bag_cat_arr, bag_merchant_arr,
                 bag_dietary_arr, bag_store_arr, embed_dim=EMBED_DIM):
        super().__init__()
        self.register_buffer('bag_text_table', bag_text_table.float())
        self.register_buffer('bag_numeric_table', torch.tensor(bag_numeric_arr, dtype=torch.float32))
        self.register_buffer('bag_cat_table', torch.tensor(bag_cat_arr, dtype=torch.long))
        self.register_buffer('bag_merchant_table', torch.tensor(bag_merchant_arr, dtype=torch.long))
        self.register_buffer('bag_dietary_table', torch.tensor(bag_dietary_arr, dtype=torch.long))
        self.register_buffer('bag_store_table', torch.tensor(bag_store_arr, dtype=torch.long))

        self.cat_emb = nn.Embedding(n_categories, 16)
        self.merchant_emb = nn.Embedding(n_merchants, 8)
        self.dietary_emb = nn.Embedding(n_dietary, 8)
        self.store_emb = nn.Embedding(n_stores, 16)
        self.text_proj = nn.Linear(TEXT_EMB_DIM, embed_dim)

        n_numeric = bag_numeric_arr.shape[1]
        in_dim = embed_dim + 16 + 8 + 8 + 16 + n_numeric
        self.mlp = nn.Sequential(
            nn.Linear(in_dim, embed_dim * 2),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(embed_dim * 2, embed_dim),
        )

    def forward(self, bag_idx):
        text_p = self.text_proj(self.bag_text_table[bag_idx])
        c = self.cat_emb(self.bag_cat_table[bag_idx])
        m = self.merchant_emb(self.bag_merchant_table[bag_idx])
        d = self.dietary_emb(self.bag_dietary_table[bag_idx])
        s = self.store_emb(self.bag_store_table[bag_idx])
        n = self.bag_numeric_table[bag_idx]
        x = torch.cat([text_p, c, m, d, s, n], dim=-1)
        return F.normalize(self.mlp(x), dim=-1)


class TwoTowerModel(nn.Module):
    def __init__(self, user_tower, item_tower):
        super().__init__()
        self.user_tower = user_tower
        self.item_tower = item_tower

    def forward(self, user_idx, history, history_mask, n_history, bag_idx):
        u = self.user_tower(user_idx, history, history_mask, n_history)
        i = self.item_tower(bag_idx)
        return u, i


n_users = len(user2idx)
n_bags = len(bag2idx)
n_stores = len(store2idx)

user_tower = UserTower(n_users, bag_text_embs).to(DEVICE)
item_tower = ItemTower(
    len(cat2idx), len(merchant2idx), len(dietary2idx), n_stores,
    bag_text_embs, bag_numeric, bag_cat_idx, bag_merchant_idx,
    bag_dietary_idx, bag_store_idx,
).to(DEVICE)
model = TwoTowerModel(user_tower, item_tower).to(DEVICE)

n_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
print(f'Trainable params: {n_params:,}')
"""))

# ─── Section 9: Training Setup ────────────────────────────────────────────
cells.append(md("## 8. Training Setup"))

cells.append(code("""def collate(batch):
    return {
        'user_idx': torch.tensor([b['user_idx'] for b in batch], dtype=torch.long),
        'bag_idx': torch.tensor([b['bag_idx'] for b in batch], dtype=torch.long),
        'history': torch.stack([b['history'] for b in batch]),
        'history_mask': torch.stack([b['history_mask'] for b in batch]),
        'n_history': torch.tensor([b['n_history'] for b in batch], dtype=torch.long),
    }

BATCH_SIZE = int(os.environ.get('NB_BATCH_SIZE', '256'))
LR = 2e-4
EPOCHS = int(os.environ.get('NB_EPOCHS', '30'))
WEIGHT_DECAY = 1e-5
TEMPERATURE = float(os.environ.get('NB_TEMPERATURE', '0.07'))

train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True,
                          num_workers=0, collate_fn=collate)
val_loader = DataLoader(val_ds, batch_size=BATCH_SIZE, shuffle=False,
                        num_workers=0, collate_fn=collate)

optimizer = torch.optim.AdamW(model.parameters(), lr=LR, weight_decay=WEIGHT_DECAY)
scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=EPOCHS)

USE_BF16 = (DEVICE.type == 'cuda' and torch.cuda.is_bf16_supported())
print(f'BF16 mixed precision: {USE_BF16}')

def in_batch_contrastive_loss(u, i, temperature=TEMPERATURE):
    \"\"\"Logits = u @ i.T / temperature; cross-entropy with diagonal targets.\"\"\"
    logits = u @ i.t() / temperature
    labels = torch.arange(u.size(0), device=u.device)
    return F.cross_entropy(logits, labels)
"""))

# ─── Section 10: Training Loop ────────────────────────────────────────────
cells.append(md("## 9. Training Loop"))

cells.append(code("""def move_batch(b):
    return {k: v.to(DEVICE, non_blocking=True) for k, v in b.items()}


def train_epoch(model, loader, optimizer):
    model.train()
    total = 0.0
    n = 0
    for batch in tqdm(loader, desc='train', leave=False):
        b = move_batch(batch)
        optimizer.zero_grad()
        if USE_BF16:
            with torch.amp.autocast('cuda', dtype=torch.bfloat16):
                u, i = model(b['user_idx'], b['history'], b['history_mask'],
                             b['n_history'], b['bag_idx'])
                loss = in_batch_contrastive_loss(u, i)
        else:
            u, i = model(b['user_idx'], b['history'], b['history_mask'],
                         b['n_history'], b['bag_idx'])
            loss = in_batch_contrastive_loss(u, i)
        loss.backward()
        optimizer.step()
        total += loss.item()
        n += 1
    return total / max(n, 1)


@torch.no_grad()
def eval_model(model, loader, n_bags, K=10):
    model.eval()
    # Tüm bag embedding'lerini bir kez hesapla
    all_bag_idx = torch.arange(n_bags, device=DEVICE)
    all_bag_embs = model.item_tower(all_bag_idx)  # (N, D)
    log2_pos = torch.log2(torch.arange(K, device=DEVICE).float() + 2)  # for NDCG

    recalls, ndcgs = [], []
    for batch in tqdm(loader, desc='eval', leave=False):
        b = move_batch(batch)
        u = model.user_tower(b['user_idx'], b['history'], b['history_mask'], b['n_history'])
        scores = u @ all_bag_embs.t()  # (B, N)
        topk = scores.topk(K, dim=-1).indices  # (B, K)
        target = b['bag_idx'].unsqueeze(-1)
        hits = (topk == target).float()  # (B, K)
        recalls.append(hits.any(dim=-1).cpu().numpy())
        # NDCG@K (bir tane relevant item, IDCG=1/log2(2)=1)
        dcg = (hits / log2_pos).sum(dim=-1)
        ndcgs.append(dcg.cpu().numpy())
    return float(np.concatenate(recalls).mean()), float(np.concatenate(ndcgs).mean())


# Initial eval (before training)
init_r, init_n = eval_model(model, val_loader, n_bags)
print(f'Init (random init):  R@10={init_r:.4f}  NDCG@10={init_n:.4f}')

best_r = -1.0
log_rows = []
print(f'\\nTraining {EPOCHS} epochs...')
for ep in range(1, EPOCHS + 1):
    t0 = time.time()
    loss = train_epoch(model, train_loader, optimizer)
    scheduler.step()
    r, ng = eval_model(model, val_loader, n_bags)
    el = time.time() - t0
    log_rows.append({'epoch': ep, 'loss': loss, 'recall@10': r, 'ndcg@10': ng,
                     'lr': optimizer.param_groups[0]['lr'], 'sec': el})
    star = ''
    if r > best_r:
        best_r = r
        star = ' *'
        torch.save({
            'model_state_dict': model.state_dict(),
            'epoch': ep, 'recall@10': r, 'ndcg@10': ng,
            'config': {
                'embed_dim': EMBED_DIM, 'history_len': HISTORY_LEN,
                'n_users': n_users, 'n_bags': n_bags,
                'n_categories': len(cat2idx), 'n_merchants': len(merchant2idx),
                'n_dietary': len(dietary2idx), 'n_stores': n_stores,
                'text_emb_dim': TEXT_EMB_DIM,
            }
        }, MODELS_DIR / 'two_tower_best.pt')
    print(f'[{ep:3d}/{EPOCHS}]  loss={loss:.4f}  R@10={r:.4f}  NDCG@10={ng:.4f}  ({el:.1f}s){star}')

print(f'\\nBest Val Recall@10: {best_r:.4f}')
"""))

# ─── Section 11: Curves ───────────────────────────────────────────────────
cells.append(md("## 10. Training Curves"))

cells.append(code("""log_df = pd.DataFrame(log_rows)
display_cols = ['epoch', 'loss', 'recall@10', 'ndcg@10', 'sec']
print(log_df[display_cols].tail(10).to_string(index=False))

try:
    import matplotlib.pyplot as plt
    fig, axes = plt.subplots(1, 3, figsize=(14, 3.5))
    axes[0].plot(log_df['epoch'], log_df['loss']); axes[0].set_title('Train Loss'); axes[0].set_xlabel('epoch')
    axes[1].plot(log_df['epoch'], log_df['recall@10'], color='C2'); axes[1].set_title('Val Recall@10'); axes[1].set_xlabel('epoch')
    axes[2].plot(log_df['epoch'], log_df['ndcg@10'], color='C3'); axes[2].set_title('Val NDCG@10'); axes[2].set_xlabel('epoch')
    for a in axes: a.grid(alpha=0.3)
    plt.tight_layout(); plt.show()
except ImportError:
    print('(matplotlib yok — grafik atlandı)')
"""))

# ─── Section 12: ONNX Export ──────────────────────────────────────────────
cells.append(md("## 10b. Final Eval @ Multiple K (Recall@K, NDCG@K)"))

cells.append(code("""# Best checkpoint'i yükle, K=5/10/20/50 için recall+ndcg hesapla
ckpt_tmp = torch.load(MODELS_DIR / 'two_tower_best.pt', map_location=DEVICE)
model.load_state_dict(ckpt_tmp['model_state_dict'])

print('Final eval @ multiple K (best checkpoint, full val set):')
print(f'{\"K\":>4s}  {\"R@K\":>8s}  {\"NDCG@K\":>8s}')
for K in [5, 10, 20, 50, 100]:
    r, ng = eval_model(model, val_loader, n_bags, K=K)
    print(f'{K:>4d}  {r:>8.4f}  {ng:>8.4f}')

print('\\nNot: candidate-generation gerçek dünya benchmark\\'ları:')
print('  YouTube: R@500 ~0.30-0.50')
print('  Amazon Beauty: R@10 ~0.10-0.20, R@50 ~0.30-0.50')
print('  Synthetic data (bizim): explorer segmenti random olduğu için R@10 cap\\'li.')
print('  Loyal user\\'ların R@10\\'u real data\\'daki tipik kullanıcılar gibi davranır.')
"""))

cells.append(md("## 11. ONNX Export (Spring Backend için)"))

cells.append(code("""# En iyi checkpoint'i yükle
ckpt = torch.load(MODELS_DIR / 'two_tower_best.pt', map_location=DEVICE)
model.load_state_dict(ckpt['model_state_dict'])
model.eval()
print(f\"Loaded best (epoch {ckpt['epoch']}, R@10={ckpt['recall@10']:.4f})\")

# User Tower ONNX export — dynamic batch size
dummy_user_idx = torch.tensor([0], dtype=torch.long, device=DEVICE)
dummy_history = torch.zeros(1, HISTORY_LEN, dtype=torch.long, device=DEVICE)
dummy_mask = torch.ones(1, HISTORY_LEN, dtype=torch.float, device=DEVICE)
dummy_n_hist = torch.tensor([5], dtype=torch.long, device=DEVICE)

torch.onnx.export(
    model.user_tower,
    (dummy_user_idx, dummy_history, dummy_mask, dummy_n_hist),
    str(MODELS_DIR / 'user_tower.onnx'),
    input_names=['user_idx', 'history', 'history_mask', 'n_history'],
    output_names=['user_emb'],
    dynamic_axes={
        'user_idx': {0: 'batch'},
        'history': {0: 'batch'},
        'history_mask': {0: 'batch'},
        'n_history': {0: 'batch'},
        'user_emb': {0: 'batch'},
    },
    opset_version=14,
    dynamo=False,  # legacy TorchScript exporter -> IR7/opset14 (backend onnxruntime 1.18 uyumlu); torch>=2.9 varsayilani dynamo+onnxscript
    do_constant_folding=True,
)
sz = (MODELS_DIR / 'user_tower.onnx').stat().st_size / 1e6
print(f'✓ user_tower.onnx ({sz:.1f} MB)')

# Item Tower ONNX
dummy_bag_idx = torch.tensor([0], dtype=torch.long, device=DEVICE)
torch.onnx.export(
    model.item_tower,
    (dummy_bag_idx,),
    str(MODELS_DIR / 'item_tower.onnx'),
    input_names=['bag_idx'],
    output_names=['bag_emb'],
    dynamic_axes={'bag_idx': {0: 'batch'}, 'bag_emb': {0: 'batch'}},
    opset_version=14,
    dynamo=False,  # legacy TorchScript exporter -> IR7/opset14 (backend onnxruntime 1.18 uyumlu); torch>=2.9 varsayilani dynamo+onnxscript
    do_constant_folding=True,
)
sz = (MODELS_DIR / 'item_tower.onnx').stat().st_size / 1e6
print(f'✓ item_tower.onnx ({sz:.1f} MB)')
"""))

# ─── Section 13: Bag embeddings + vocab ───────────────────────────────────
cells.append(md("## 12. Bag Embedding Cache + Vocab Export\\n\\nSpring backend bag embedding'lerini her seferinde hesaplamasın diye precompute edip JSON olarak kaydederiz. Item tower'ı yeniden çalıştırmak yerine direkt cosine similarity yapar."))

cells.append(code("""model.eval()
with torch.no_grad():
    all_bag_idx = torch.arange(n_bags, device=DEVICE)
    all_bag_embs = model.item_tower(all_bag_idx).cpu().numpy()

bag_ids = list(bag2idx.keys())

with open(MODELS_DIR / 'bag_embeddings.json', 'w', encoding='utf-8') as f:
    json.dump({
        'bag_ids': bag_ids,
        'dim': int(all_bag_embs.shape[1]),
        'embeddings': all_bag_embs.astype('float32').round(6).tolist(),
        'normalized': True,
    }, f)
sz = (MODELS_DIR / 'bag_embeddings.json').stat().st_size / 1e6
print(f'✓ bag_embeddings.json ({sz:.1f} MB)  shape={all_bag_embs.shape}')

with open(MODELS_DIR / 'vocab.json', 'w', encoding='utf-8') as f:
    json.dump({
        'user2idx': user2idx,
        'bag2idx': bag2idx,
        'store2idx': store2idx,
        'cat2idx': cat2idx,
        'merchant2idx': merchant2idx,
        'dietary2idx': dietary2idx,
        'config': ckpt['config'],
        'norm_stats': {
            'bag_num_mean': bag_num_mean.tolist(),
            'bag_num_std': bag_num_std.tolist(),
        },
    }, f, ensure_ascii=False)
print(f'✓ vocab.json')
"""))

# ─── Section 14: Sample Recommendations ───────────────────────────────────
cells.append(md("## 13. Örnek Öneriler (Sanity Check)"))

cells.append(code("""@torch.no_grad()
def recommend(uid, top_k=10, exclude_history=True):
    user_idx = user2idx[uid]
    history = [h['bag_idx'] for h in user_history.get(uid, [])][-HISTORY_LEN:]
    n_h = len(history)
    padded = history + [0] * (HISTORY_LEN - n_h)
    mask = [1.0] * n_h + [0.0] * (HISTORY_LEN - n_h)

    u_t = torch.tensor([user_idx], device=DEVICE)
    h_t = torch.tensor([padded], dtype=torch.long, device=DEVICE)
    m_t = torch.tensor([mask], dtype=torch.float, device=DEVICE)
    n_t = torch.tensor([n_h], dtype=torch.long, device=DEVICE)

    u_emb = model.user_tower(u_t, h_t, m_t, n_t)
    bag_embs_t = torch.tensor(all_bag_embs, device=DEVICE)
    scores = (u_emb @ bag_embs_t.t()).cpu().numpy()[0]

    history_set = set(history) if exclude_history else set()
    order = scores.argsort()[::-1]
    recs = []
    for idx in order:
        if idx not in history_set:
            recs.append((bag_ids[idx], float(scores[idx])))
        if len(recs) >= top_k:
            break
    return recs


# Birkaç sample user için öneri yazdır
sample_users = [u for u in user2idx if len(user_history.get(u, [])) >= 5][:3]

bag_lookup = bags_df.set_index('id')

for uid in sample_users:
    print(f'\\n══ User: {uid}  (n_history={len(user_history[uid])}) ══')
    print('  Son 3 sipariş:')
    for h in user_history[uid][-3:]:
        bid = bag_ids[h['bag_idx']]
        b = bag_lookup.loc[bid]
        print(f\"    {b['restaurant_name']:30s}  {b['category']:10s}  ₺{b['price']:.0f}\")

    print('  Top 5 öneri:')
    for bid, sc in recommend(uid, top_k=5):
        b = bag_lookup.loc[bid]
        print(f\"    {b['restaurant_name']:30s}  {b['category']:10s}  ₺{b['price']:.0f}  score={sc:.3f}\")
"""))

# ─── Section 15: Segment Sanity Check ─────────────────────────────────────
cells.append(md("## 14. Segment-Bazlı Recall (Modelin Segment Davranışını Yakaladığı Doğrulama)"))

cells.append(code("""seg_df = pd.read_csv(DATA_DIR / 'user_segments.csv')
print('Segment dağılımı:')
print(seg_df['segment'].value_counts())

@torch.no_grad()
def recall_for_subset(user_ids_set, K=10):
    sub = val_orders_known[val_orders_known['user_id'].isin(user_ids_set)]
    if len(sub) == 0:
        return None, None, 0
    sub_ds = TwoTowerDataset(sub, user2idx, bag2idx, user_history)
    sub_loader = DataLoader(sub_ds, batch_size=256, shuffle=False, collate_fn=collate)
    r, ndcg = eval_model(model, sub_loader, n_bags, K=K)
    return r, ndcg, len(sub_ds)

print('\\nRecall@10 by segment (val set):')
for seg in ['loyal', 'explorer', 'budget', 'premium', 'healthy']:
    seg_users = set(seg_df[seg_df['segment'] == seg]['user_id'].tolist())
    r, ndcg, n = recall_for_subset(seg_users)
    if r is not None:
        print(f'  {seg:10s}: R@10={r:.4f}  NDCG@10={ndcg:.4f}  (n={n} val orders)')

print('\\nBeklenen: loyal segment en yüksek R@10 verir (sadık user, history\\'den tahmin kolay).')
print('Premium ve healthy segmentleri de iyi performans göstermeli (kategori sinyali güçlü).')
"""))

# ─── Next steps ───────────────────────────────────────────────────────────
cells.append(md("""## Sonraki Adımlar

### Backend Entegrasyonu (Spring Boot)
1. `apps/backend/pom.xml`'e ekle:
   ```xml
   <dependency>
     <groupId>com.microsoft.onnxruntime</groupId>
     <artifactId>onnxruntime</artifactId>
     <version>1.18.0</version>
   </dependency>
   ```
2. `ml/models/` klasörünün içindeki dosyaları backend'in resources'una kopyala (veya production'da Cloud Storage'dan indir):
   - `user_tower.onnx`
   - `item_tower.onnx` (bag embeddings precomputed olduğu için runtime'da gerekmez ama bag eklendiğinde useful)
   - `vocab.json`
   - `bag_embeddings.json`
3. `RecommendationService.java` yaz: ONNX session yönet, cosine similarity ile top-K bul.
4. `RecommendationController.java`: `GET /api/recommendations/me` endpoint'i.

### Frontend Entegrasyonu
1. `apps/frontend/src/hooks/useRecommendations.ts` hook'unu ekle.
2. `CustomerApp.tsx`'te "Sana Özel" carousel bölümü göster.

### Model İyileştirmeleri
- **Daha iyi cold-start:** Yeni user için segment-only tower (history yok) — fallback path.
- **MiniLM fine-tune:** Top-1 layer'ları açıp fine-tune et (~2x training time, +%1-2 R@10).
- **Daha büyük embed dim:** 256 (data >50K orders olunca).
- **FAISS index:** Bag sayısı >10K olunca cosine similarity yerine ANN.

### Production Retraining
- Cloud Run Job ile haftalık retrain pipeline'ı.
- Real order data biriktikçe synthetic data ile replace et.
- A/B test: yeni model vs popularity baseline.
"""))

# ─── Build the notebook ───────────────────────────────────────────────────
nb = {
    "cells": cells,
    "metadata": {
        "kernelspec": {
            "display_name": "Python 3",
            "language": "python",
            "name": "python3",
        },
        "language_info": {
            "codemirror_mode": {"name": "ipython", "version": 3},
            "file_extension": ".py",
            "mimetype": "text/x-python",
            "name": "python",
            "pygments_lexer": "ipython3",
        },
    },
    "nbformat": 4,
    "nbformat_minor": 5,
}

OUT.write_text(json.dumps(nb, indent=1, ensure_ascii=False), encoding="utf-8")
print(f"✓ {OUT}")
print(f"  {len(cells)} cells, {OUT.stat().st_size / 1024:.1f} KB")
