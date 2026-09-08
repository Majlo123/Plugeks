"""
Sastavlja fotografije proizvoda za sajt iz Rollandovih ORIGINALA i upisuje
`src/data/images.json`.

    python scripts/build_product_images.py [--dry] [--report]
    (ili: npm run slike:build)

ZAŠTO POSTOJI: PlugekS ima dogovor sa Rollandom da koristi njihove originalne
fotografije 1:1, sa njihovim žigom. Slike koje su ranije bile na sajtu su bile
obrađene — PlugekS logo prekrečen preko Rollandovog žiga (dva puta, jer je i
sredina slike imala žig), plus ljubičasti odsjaj preko celog kadra. Ova skripta
vraća čiste originale i više ništa ne crta preko njih.

ŠTA RADI:
  1. za svaki proizvod bira NAJBOLJI dostupan original:
       a) data/rolland-originals/{id}.jpg  — 599×800, skinuto sa rolland.pl
          (`npm run originali`), najveća verzija koju drže
       b) data/rolland-pages/**/{id}-*.jpg — 472×630, ranije snimljene stranice
     obe su neobrađeni Rollandovi fajlovi; (a) je samo veća,
  2. odbacuje Rollandov „photo coming soon" — to nije fotografija, pa katalog
     za takav deo prikazuje naš brendiran vizual (vidi ProductThumb),
  3. prekodira u JPEG bez ijedne druge promene — bez opsecanja, bez skaliranja,
     bez logotipa, bez korekcije boje. Original je ~190 KB pri kvalitetu koji
     se ne vidi; na q86 je ~36 KB i isti na ekranu,
  4. upisuje `src/data/images.json`, ali ČUVA postojeće `/images/plugovi/`
     unose: to su tehnički crteži (skice) sa agritechnicom.co.rs i oni imaju
     prednost nad fotografijom — jasnije pokazuju oblik dela,
  5. briše iz `public/images/rolland/` fajlove proizvoda koji više nemaju
     fotografiju, da u repou ne ostanu siročići.

Bezbedno je pokretati više puta. `--dry` ništa ne upisuje.
"""

from __future__ import annotations

import hashlib
import io
import json
import os
import re
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:  # pragma: no cover
    sys.exit("Nema Pillow. Instaliraj: python -m pip install Pillow")

# Windows konzola je podrazumevano cp1252 i puca na „č" i „→" iz izveštaja.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent
ORIGINALS = ROOT / "data" / "rolland-originals"
PAGES = ROOT / "data" / "rolland-pages"
OUT_DIR = ROOT / "public" / "images" / "rolland"
MAP_FILE = ROOT / "src" / "data" / "images.json"
WEB_DIR = "/images/rolland"

DRY = "--dry" in sys.argv
REPORT = "--report" in sys.argv

# Kvalitet prekodiranja. q86 + progressive: ~36 KB na 599×800, bez vidljive
# razlike od originala (proveravano na žigu i ivicama dela, gde se prvo vidi).
# Ostajemo na JPEG-u, ne WebP-u: slike se serviraju `unoptimized` (vidi
# next.config.mjs), pa isti fajl vide i Viber/WhatsApp/Facebook u pregledu
# linka, a tamo WebP ume da ne prođe.
JPEG_QUALITY = 86

# Rollandov „photo coming soon" — isti fajl za svaki proizvod bez fotografije.
PLACEHOLDER_HASHES = {
    "a1c72d51193d505b696702e746bff878",  # 472×630, 100.186 b
    "514b824e63633bfd4dd58e339cc93f6b",  # 599×800, 154.783 b
}

# -------------------------------- Katalog ---------------------------------

machines = json.loads((ROOT / "src" / "data" / "machines.json").read_text("utf-8"))
packed = json.loads((ROOT / "src" / "data" / "parts.json").read_text("utf-8"))
catalog_ids = [str(m["id"]) for m in machines] + [str(row[0]) for row in packed["items"]]
catalog = set(catalog_ids)

# --------------------------------- Izvori ----------------------------------


def md5(path: Path) -> str:
    return hashlib.md5(path.read_bytes()).hexdigest()


def collect_sources() -> dict[str, Path]:
    """id → putanja do najboljeg originala. Veći original pobeđuje manji."""
    best: dict[str, Path] = {}

    def offer(pid: str, path: Path, rank: int) -> None:
        if pid not in catalog:
            return
        prev = best.get(pid)
        if prev is None or rank > ranks[prev]:
            best[pid] = path
            ranks[path] = rank

    ranks: dict[Path, int] = {}

    # Rang 1: ranije snimljene stranice (472×630).
    if PAGES.exists():
        for sub in sorted(PAGES.iterdir()):
            if not sub.is_dir():
                continue
            for f in sorted(sub.iterdir()):
                m = re.match(r"^(\d+)-.+?-0-4(?:\(\d+\))?\.jpe?g$", f.name, re.I)
                if m:
                    offer(m.group(1), f, 1)

    # Rang 2: puna rezolucija sa rolland.pl (599×800) — gazi rang 1.
    if ORIGINALS.exists():
        for f in sorted(ORIGINALS.iterdir()):
            m = re.match(r"^(\d+)\.jpe?g$", f.name, re.I)
            if m:
                offer(m.group(1), f, 2)

    return best


sources = collect_sources()

# ------------------------------- Prekodiranje -------------------------------


def encode(src: Path) -> tuple[bytes, tuple[int, int]]:
    """
    Original → JPEG, bez ijedne promene sadržaja.

    Nema `resize`, nema `crop`, nema `convert` u drugi profil osim RGB (JPEG ne
    ume CMYK/paletu). Piksel u piksel isti kadar, samo drugačije kompresovan.
    """
    with Image.open(src) as im:
        if im.mode != "RGB":
            im = im.convert("RGB")
        buf = io.BytesIO()
        im.save(buf, "JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True, subsampling=1)
        return buf.getvalue(), im.size


# --------------------------------- Izlaz -----------------------------------

existing_map: dict[str, str] = (
    json.loads(MAP_FILE.read_text("utf-8")) if MAP_FILE.exists() else {}
)

# Crteži delova za plugove imaju prednost nad fotografijom — jasnije pokazuju
# oblik dela. Puni ih scripts/import-plow-parts.mjs i ovde se samo prepisuju.
sketches = {pid: p for pid, p in existing_map.items() if "/plugovi/" in p}

if not DRY:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

new_map: dict[str, str] = {}
written = 0
placeholders: list[str] = []
failed: list[str] = []
bytes_in = 0
bytes_out = 0
dims: dict[str, int] = {}

for pid in catalog_ids:
    src = sources.get(pid)
    if src is None:
        continue
    if md5(src) in PLACEHOLDER_HASHES:
        placeholders.append(pid)
        continue
    try:
        data, size = encode(src)
    except Exception as err:  # noqa: BLE001 — jedan loš fajl ne sme da obori posao
        failed.append(f"{pid}: {err}")
        continue

    bytes_in += src.stat().st_size
    bytes_out += len(data)
    dims[f"{size[0]}x{size[1]}"] = dims.get(f"{size[0]}x{size[1]}", 0) + 1

    target = OUT_DIR / f"{pid}.jpg"
    if not DRY:
        target.write_bytes(data)
    new_map[pid] = f"{WEB_DIR}/{pid}.jpg"
    written += 1

# Skica pobeđuje fotografiju.
new_map.update(sketches)

# Redosled kao u katalogu — čitljiv diff kad se mapa ponovo generiše.
ordered = {pid: new_map[pid] for pid in catalog_ids if pid in new_map}
# Unos koji nije u katalogu (npr. stara mašina) se ne izgubi.
ordered.update({k: v for k, v in new_map.items() if k not in ordered})

removed = [
    pid for pid in existing_map if pid not in ordered
]

# Fajlovi proizvoda koji više nemaju fotografiju — u repou nemaju šta da traže.
orphans = []
if OUT_DIR.exists():
    keep = {f"{pid}.jpg" for pid, p in ordered.items() if p.startswith(WEB_DIR)}
    for f in sorted(OUT_DIR.iterdir()):
        if f.is_file() and f.name not in keep:
            orphans.append(f.name)
            if not DRY:
                f.unlink()

if not DRY:
    MAP_FILE.write_text(json.dumps(ordered, ensure_ascii=False, indent=2) + "\n", "utf-8")

# -------------------------------- Izveštaj ---------------------------------

mb = lambda n: f"{n / 1048576:.1f} MB"  # noqa: E731

print(f"""{'DRY-RUN — ništa nije upisano' if DRY else 'Gotovo'}

Proizvoda u katalogu:      {len(catalog_ids)}
Originala na disku:        {len(sources)}
  → fotografija upisano:   {written}   ({mb(bytes_in)} → {mb(bytes_out)})
  → „photo coming soon":   {len(placeholders)}   (bez slike, prikazuje se naš vizual)
  → greška pri obradi:     {len(failed)}
Crteža (plugovi, skice):   {len(sketches)}
Ukupno u images.json:      {len(ordered)}
Bez fotografije:           {len(catalog_ids) - len(ordered)}
Obrisano siročića:         {len(orphans)}
Uklonjeno iz mape:         {len(removed)}""")

if dims:
    top = sorted(dims.items(), key=lambda kv: -kv[1])[:5]
    print("Dimenzije:                 " + ", ".join(f"{k}×{v}" for k, v in top))
if failed:
    print("\nGreške:")
    for f in failed[:10]:
        print(f"  {f}")

if REPORT:
    (ROOT / "data" / "product-images-report.json").write_text(
        json.dumps(
            {
                "written": written,
                "placeholders": placeholders,
                "failed": failed,
                "removedFromMap": removed,
                "orphansDeleted": orphans,
                "withoutPhoto": [p for p in catalog_ids if p not in ordered],
            },
            indent=1,
        )
        + "\n",
        "utf-8",
    )
    print("\nIzveštaj: data/product-images-report.json")
