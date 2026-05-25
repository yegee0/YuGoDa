"""
Notebook'u doğrudan exec() ile çalıştırır — nbconvert/jupyter gerekmez.
Output stdout'a, hata olursa traceback yazar.

Kullanım:
    NB_EPOCHS=2 NB_BATCH_SIZE=128 python3 ml/scripts/_execute_notebook.py
"""
import json
import os
import sys
import traceback
from pathlib import Path

# Repo koku script konumundan turetilir (ml/scripts/_execute_notebook.py -> parents[2]),
# boylece farkli makinelerde / Windows-native Python'da da calisir.
ROOT = Path(__file__).resolve().parents[2]
NB = ROOT / "ml" / "notebooks" / "train_two_tower.ipynb"

os.chdir(ROOT)

nb = json.loads(NB.read_text(encoding="utf-8"))
ns = {"__name__": "__main__"}

code_cells = [(i, c) for i, c in enumerate(nb["cells"]) if c["cell_type"] == "code"]
print(f"Notebook: {NB.name}  ({len(code_cells)} code cells)")
print(f"NB_EPOCHS={os.environ.get('NB_EPOCHS', '30')}  NB_BATCH_SIZE={os.environ.get('NB_BATCH_SIZE', '256')}")
print("=" * 60)

for cell_no, (orig_idx, cell) in enumerate(code_cells, 1):
    src = cell["source"]
    if isinstance(src, list):
        src = "".join(src)
    if not src.strip():
        continue
    print(f"\n──── Code cell {cell_no}/{len(code_cells)} ────", flush=True)
    try:
        exec(src, ns)
    except SystemExit:
        raise
    except Exception:
        print(f"\n✗ Cell {cell_no} FAILED:", flush=True)
        traceback.print_exc()
        sys.exit(1)

print("\n" + "=" * 60)
print("✓ All cells completed.")
