"""
Pipeline sanity test — notebook'un core mantığını küçük subset ile CPU'da çalıştırır.

Amacı: kullanıcı GPU'da training'e başlamadan önce dimension/loss/ONNX
sorunlarını yakalamak.

NOT: MiniLM indirilmediği için bag text embeddings sahte 384-d random vector ile
simüle edilir. Notebook'un asıl çalıştırılışında gerçek MiniLM kullanılır.
"""
import os, sys, json, time, random
from pathlib import Path
from collections import defaultdict

import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from dotenv import load_dotenv
load_dotenv(ROOT / ".env.local", override=False)

import psycopg2

SEED = 42
random.seed(SEED); np.random.seed(SEED); torch.manual_seed(SEED)

DEVICE = torch.device("cpu")
print(f"Device: {DEVICE}, PyTorch: {torch.__version__}")

DB_CONFIG = {
    "host": os.environ["DB_HOST"], "port": int(os.environ["DB_PORT"]),
    "user": os.environ["DB_USERNAME"], "password": os.environ["DB_PASSWORD"],
    "database": os.environ["DB_NAME"],
    "sslmode": os.environ.get("DB_SSLMODE", "prefer"),
}

# ─── 1. Data load (subset) ────────────────────────────────────────────────
print("\n[1] Cloud SQL'den subset yükleniyor...")
def fetch_df(q):
    conn = psycopg2.connect(**DB_CONFIG)
    try:
        cur = conn.cursor(); cur.execute(q)
        cols = [d[0] for d in cur.description]; rows = cur.fetchall()
    finally:
        conn.close()
    return pd.DataFrame(rows, columns=cols)

# Subset for speed
users_df = fetch_df("SELECT uid, location, addresses, created_at FROM users WHERE uid LIKE 'synth_%' LIMIT 100")
stores_df = fetch_df("SELECT id, name, category, location, rating, created_at FROM stores WHERE id LIKE 'synth_%'")
bags_df = fetch_df("""
    SELECT id, restaurant_id, restaurant_name, category, merchant_type,
           description, price, original_price, dietary_type, calories,
           coordinates, rating, tags, created_at
    FROM bags WHERE id LIKE 'synth_%'
""")
orders_df = fetch_df(f"""
    SELECT id, user_id, restaurant_id, bag_id, status, total, created_at, delivered_at
    FROM orders
    WHERE id LIKE 'synth_%' AND status='delivered'
      AND user_id IN ({",".join(repr(u) for u in users_df['uid'].tolist())})
    ORDER BY created_at
""")
orders_df['created_at'] = pd.to_datetime(orders_df['created_at'])
print(f"  users={len(users_df)}, stores={len(stores_df)}, bags={len(bags_df)}, orders={len(orders_df)}")

# ─── 2. Vocab ─────────────────────────────────────────────────────────────
print("\n[2] Vocabulary build...")
user2idx = {u: i for i, u in enumerate(users_df['uid'].tolist())}
bag2idx = {b: i for i, b in enumerate(bags_df['id'].tolist())}
store2idx = {s: i for i, s in enumerate(stores_df['id'].tolist())}
all_cats = sorted(bags_df['category'].unique().tolist())
cat2idx = {c: i for i, c in enumerate(all_cats)}
all_merchants = sorted(bags_df['merchant_type'].unique().tolist())
merchant2idx = {m: i for i, m in enumerate(all_merchants)}
all_dietary = sorted(bags_df['dietary_type'].unique().tolist())
dietary2idx = {d: i for i, d in enumerate(all_dietary)}
print(f"  cats={len(cat2idx)}, merchants={len(merchant2idx)}, dietary={len(dietary2idx)}")

# ─── 3. Bag features ──────────────────────────────────────────────────────
print("\n[3] Bag features (text emb sahte, numeric+categorical real)...")
# Sahte 384-d MiniLM-style embedding (gerçek notebook'ta MiniLM kullanır)
TEXT_DIM = 384
bag_text_embs = torch.randn(len(bags_df), TEXT_DIM)

bag_numeric_raw = bags_df[['price', 'original_price', 'calories', 'rating']].values.astype(np.float32)
bag_num_mean = bag_numeric_raw.mean(axis=0); bag_num_std = bag_numeric_raw.std(axis=0) + 1e-6
bag_numeric = (bag_numeric_raw - bag_num_mean) / bag_num_std
discount = (1 - bags_df['price'].values / bags_df['original_price'].values).astype(np.float32)
discount_norm = ((discount - discount.mean()) / (discount.std() + 1e-6)).astype(np.float32)
bag_numeric = np.column_stack([bag_numeric, discount_norm.reshape(-1, 1)])

bag_cat_idx = bags_df['category'].map(cat2idx).values.astype(np.int64)
bag_merchant_idx = bags_df['merchant_type'].map(merchant2idx).values.astype(np.int64)
bag_dietary_idx = bags_df['dietary_type'].map(dietary2idx).values.astype(np.int64)
bag_store_idx = bags_df['restaurant_id'].map(store2idx).values.astype(np.int64)
print(f"  bag_numeric shape: {bag_numeric.shape}")
print(f"  text emb (FAKE) shape: {bag_text_embs.shape}")

# ─── 4. User history ──────────────────────────────────────────────────────
print("\n[4] User history...")
orders_df = orders_df.sort_values('created_at').reset_index(drop=True)
user_history = defaultdict(list)
for _, r in orders_df.iterrows():
    if r['user_id'] in user2idx and r['bag_id'] in bag2idx:
        user_history[r['user_id']].append({'bag_idx': bag2idx[r['bag_id']], 'created_at': r['created_at']})
print(f"  users with history: {len(user_history)}")

# ─── 5. Split ─────────────────────────────────────────────────────────────
print("\n[5] Train/val split...")
val_cutoff = orders_df['created_at'].max() - pd.Timedelta(days=14)
train_orders = orders_df[orders_df['created_at'] < val_cutoff].reset_index(drop=True)
val_orders = orders_df[orders_df['created_at'] >= val_cutoff].reset_index(drop=True)
known_users = set(train_orders['user_id'].unique())
val_orders_known = val_orders[val_orders['user_id'].isin(known_users)].reset_index(drop=True)
print(f"  train={len(train_orders)}, val={len(val_orders_known)}")

if len(train_orders) == 0 or len(val_orders_known) == 0:
    print("  ⚠ subset çok küçük — eğitim yapılamaz; sadece dimension testi")

# ─── 6. Dataset ───────────────────────────────────────────────────────────
print("\n[6] Dataset build...")
HISTORY_LEN = 10

class TwoTowerDataset(Dataset):
    def __init__(self, df, max_history=HISTORY_LEN):
        self.df = df.reset_index(drop=True); self.max_history = max_history
        self.histories = []
        for _, row in self.df.iterrows():
            uid = row['user_id']; cutoff = row['created_at']
            past = [h['bag_idx'] for h in user_history.get(uid, []) if h['created_at'] < cutoff]
            self.histories.append(past[-max_history:])
    def __len__(self): return len(self.df)
    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        u = user2idx[row['user_id']]; b = bag2idx[row['bag_id']]
        h = self.histories[idx]; n = len(h)
        padded = h + [0]*(self.max_history - n)
        mask = [1.0]*n + [0.0]*(self.max_history - n)
        return {
            'user_idx': u, 'bag_idx': b,
            'history': torch.tensor(padded, dtype=torch.long),
            'history_mask': torch.tensor(mask, dtype=torch.float),
            'n_history': n,
        }

def collate(batch):
    return {
        'user_idx': torch.tensor([b['user_idx'] for b in batch], dtype=torch.long),
        'bag_idx': torch.tensor([b['bag_idx'] for b in batch], dtype=torch.long),
        'history': torch.stack([b['history'] for b in batch]),
        'history_mask': torch.stack([b['history_mask'] for b in batch]),
        'n_history': torch.tensor([b['n_history'] for b in batch], dtype=torch.long),
    }

train_ds = TwoTowerDataset(train_orders)
val_ds = TwoTowerDataset(val_orders_known)
train_loader = DataLoader(train_ds, batch_size=32, shuffle=True, collate_fn=collate)
val_loader = DataLoader(val_ds, batch_size=32, shuffle=False, collate_fn=collate)
print(f"  train_ds={len(train_ds)}, val_ds={len(val_ds)}")

# ─── 7. Model ─────────────────────────────────────────────────────────────
print("\n[7] Model init...")
EMBED_DIM = 128

class UserTower(nn.Module):
    def __init__(self, n_users, bag_text_table):
        super().__init__()
        self.user_id_emb = nn.Embedding(n_users + 1, EMBED_DIM, padding_idx=0)
        self.register_buffer('bag_text_table', bag_text_table.float())
        self.history_proj = nn.Linear(TEXT_DIM, EMBED_DIM)
        self.mlp = nn.Sequential(
            nn.Linear(EMBED_DIM*2 + 1, EMBED_DIM*2), nn.ReLU(), nn.Dropout(0.2),
            nn.Linear(EMBED_DIM*2, EMBED_DIM),
        )
    def forward(self, user_idx, history, history_mask, n_history):
        u = self.user_id_emb(user_idx + 1)
        h_text = self.bag_text_table[history]
        h_proj = self.history_proj(h_text)
        m = history_mask.unsqueeze(-1)
        h_pool = (h_proj * m).sum(dim=1) / m.sum(dim=1).clamp(min=1.0)
        n_feat = torch.log1p(n_history.float()).unsqueeze(-1)
        out = self.mlp(torch.cat([u, h_pool, n_feat], dim=-1))
        return F.normalize(out, dim=-1)

class ItemTower(nn.Module):
    def __init__(self, n_cats, n_merch, n_diet, n_stores, bag_text, bag_num, bc, bm, bd, bs):
        super().__init__()
        self.register_buffer('bag_text_table', bag_text.float())
        self.register_buffer('bag_numeric_table', torch.tensor(bag_num, dtype=torch.float32))
        self.register_buffer('bag_cat_table', torch.tensor(bc, dtype=torch.long))
        self.register_buffer('bag_merchant_table', torch.tensor(bm, dtype=torch.long))
        self.register_buffer('bag_dietary_table', torch.tensor(bd, dtype=torch.long))
        self.register_buffer('bag_store_table', torch.tensor(bs, dtype=torch.long))
        self.cat_emb = nn.Embedding(n_cats, 16)
        self.merchant_emb = nn.Embedding(n_merch, 8)
        self.dietary_emb = nn.Embedding(n_diet, 8)
        self.store_emb = nn.Embedding(n_stores, 16)
        self.text_proj = nn.Linear(TEXT_DIM, EMBED_DIM)
        in_dim = EMBED_DIM + 16 + 8 + 8 + 16 + bag_num.shape[1]
        self.mlp = nn.Sequential(
            nn.Linear(in_dim, EMBED_DIM*2), nn.ReLU(), nn.Dropout(0.2),
            nn.Linear(EMBED_DIM*2, EMBED_DIM),
        )
    def forward(self, bag_idx):
        t = self.text_proj(self.bag_text_table[bag_idx])
        c = self.cat_emb(self.bag_cat_table[bag_idx])
        m = self.merchant_emb(self.bag_merchant_table[bag_idx])
        d = self.dietary_emb(self.bag_dietary_table[bag_idx])
        s = self.store_emb(self.bag_store_table[bag_idx])
        n = self.bag_numeric_table[bag_idx]
        return F.normalize(self.mlp(torch.cat([t, c, m, d, s, n], dim=-1)), dim=-1)

class TwoTower(nn.Module):
    def __init__(self, ut, it):
        super().__init__()
        self.user_tower = ut; self.item_tower = it
    def forward(self, user_idx, history, history_mask, n_history, bag_idx):
        return self.user_tower(user_idx, history, history_mask, n_history), self.item_tower(bag_idx)

ut = UserTower(len(user2idx), bag_text_embs)
it = ItemTower(len(cat2idx), len(merchant2idx), len(dietary2idx), len(store2idx),
               bag_text_embs, bag_numeric, bag_cat_idx, bag_merchant_idx,
               bag_dietary_idx, bag_store_idx)
model = TwoTower(ut, it)
print(f"  params: {sum(p.numel() for p in model.parameters() if p.requires_grad):,}")

# ─── 8. Forward + loss ────────────────────────────────────────────────────
print("\n[8] Forward pass + loss...")
batch = next(iter(train_loader))
u, i = model(batch['user_idx'], batch['history'], batch['history_mask'],
             batch['n_history'], batch['bag_idx'])
print(f"  user_emb shape: {u.shape}  (expected: [B, 128])")
print(f"  item_emb shape: {i.shape}  (expected: [B, 128])")
print(f"  user_emb norm range: [{u.norm(dim=-1).min():.4f}, {u.norm(dim=-1).max():.4f}]  (expected: ~1.0)")

logits = u @ i.t() / 0.07
labels = torch.arange(u.size(0))
loss = F.cross_entropy(logits, labels)
print(f"  loss (random init): {loss.item():.4f}  (expected: ~log({u.size(0)})={np.log(u.size(0)):.2f})")
assert not torch.isnan(loss), "Loss is NaN!"

# Backward
loss.backward()
n_grads = sum(1 for p in model.parameters() if p.grad is not None and p.requires_grad)
print(f"  parameters with grad: {n_grads}")

# ─── 9. Eval ──────────────────────────────────────────────────────────────
print("\n[9] Eval (Recall@10, NDCG@10)...")
@torch.no_grad()
def eval_model(model, loader, n_bags, K=10):
    model.eval()
    all_bag = model.item_tower(torch.arange(n_bags))
    log2_pos = torch.log2(torch.arange(K).float() + 2)
    rs, ns = [], []
    for b in loader:
        u = model.user_tower(b['user_idx'], b['history'], b['history_mask'], b['n_history'])
        scores = u @ all_bag.t()
        topk = scores.topk(K, dim=-1).indices
        target = b['bag_idx'].unsqueeze(-1)
        hits = (topk == target).float()
        rs.append(hits.any(dim=-1).numpy())
        ns.append((hits / log2_pos).sum(dim=-1).numpy())
    return float(np.concatenate(rs).mean()), float(np.concatenate(ns).mean())

if len(val_ds) > 0:
    r, n = eval_model(model, val_loader, len(bags_df))
    print(f"  R@10={r:.4f}  NDCG@10={n:.4f}  (random init, expected: ~{10/len(bags_df):.4f})")

# ─── 10. ONNX export ──────────────────────────────────────────────────────
print("\n[10] ONNX export test...")
TMP = ROOT / "ml" / "models" / "test"
TMP.mkdir(exist_ok=True, parents=True)

model.eval()
dummy_user = torch.tensor([0], dtype=torch.long)
dummy_hist = torch.zeros(1, HISTORY_LEN, dtype=torch.long)
dummy_mask = torch.ones(1, HISTORY_LEN, dtype=torch.float)
dummy_n = torch.tensor([5], dtype=torch.long)

torch.onnx.export(
    model.user_tower, (dummy_user, dummy_hist, dummy_mask, dummy_n),
    str(TMP / "user_tower.onnx"),
    input_names=['user_idx', 'history', 'history_mask', 'n_history'],
    output_names=['user_emb'],
    dynamic_axes={'user_idx': {0:'batch'}, 'history': {0:'batch'},
                  'history_mask': {0:'batch'}, 'n_history': {0:'batch'},
                  'user_emb': {0:'batch'}},
    opset_version=14, do_constant_folding=True,
)
sz = (TMP / "user_tower.onnx").stat().st_size / 1024
print(f"  ✓ user_tower.onnx ({sz:.0f} KB)")

dummy_bag = torch.tensor([0], dtype=torch.long)
torch.onnx.export(
    model.item_tower, (dummy_bag,),
    str(TMP / "item_tower.onnx"),
    input_names=['bag_idx'], output_names=['bag_emb'],
    dynamic_axes={'bag_idx': {0:'batch'}, 'bag_emb': {0:'batch'}},
    opset_version=14, do_constant_folding=True,
)
sz = (TMP / "item_tower.onnx").stat().st_size / 1024
print(f"  ✓ item_tower.onnx ({sz:.0f} KB)")

# ─── 11. ONNX inference ───────────────────────────────────────────────────
print("\n[11] ONNX inference test (onnxruntime)...")
import onnxruntime as ort
ort_user = ort.InferenceSession(str(TMP / "user_tower.onnx"))
ort_item = ort.InferenceSession(str(TMP / "item_tower.onnx"))
out_u = ort_user.run(None, {
    'user_idx': np.array([0, 1], dtype=np.int64),
    'history': np.zeros((2, HISTORY_LEN), dtype=np.int64),
    'history_mask': np.ones((2, HISTORY_LEN), dtype=np.float32),
    'n_history': np.array([5, 3], dtype=np.int64),
})[0]
out_i = ort_item.run(None, {'bag_idx': np.array([0, 1, 2], dtype=np.int64)})[0]
print(f"  user_emb (B=2): {out_u.shape}, norm={np.linalg.norm(out_u, axis=1)}")
print(f"  bag_emb (B=3):  {out_i.shape}, norm={np.linalg.norm(out_i, axis=1)}")

# Cleanup
import shutil
shutil.rmtree(TMP)

print("\n══════════════════════════════════")
print("✓ Tüm pipeline aşamaları başarılı.")
print("══════════════════════════════════")
print("\nGerçek training için: jupyter notebook ml/notebooks/train_two_tower.ipynb")
print("RTX 5070 Ti üzerinde tahmini süre: 30 epoch × ~30sn = ~15 dk")
