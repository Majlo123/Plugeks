"""
Pravi `og:image` kompozit 1200x630 za svaki proizvod koji ima fotografiju.

    python scripts/build_og_images.py [--dry] [--ponovo] [--samo 2719,4020]
    (ili: npm run og)

ZAŠTO POSTOJI: `og:image` je slika koju Facebook, Viber, WhatsApp i LinkedIn
prikazuju kad se link podeli, i koju Google koristi za širi pregled. Svi oni
traže 1200x630 (odnos 1.91:1) za „veliku" karticu. Crteži delova su 600x600
kvadrati, pa su umesto velike kartice davali sitnu kvadratnu sličicu pored
teksta — a baš je ta razlika u veličini razlog zbog kog je logo (koji JESTE
1200x630, vidi `public/og.jpg`) izgledao kao ozbiljnija slika od samog proizvoda.

ŠTA NE MENJA: sliku na samoj stranici. Strana proizvoda i dalje prikazuje
original iz `public/images/…`, i taj original ostaje u `ImageObject` structured
data i u `image-sitemap.xml` — to je ono što Google Images indeksira i to je
slika koju kupac treba da vidi. Kompozit je ISKLJUČIVO za `og:image` i
`twitter:image` (vidi `ogSlikaProizvoda` u `src/lib/products.ts`).

RECEPT: proizvod se uklapa u platno 1200x630 sa zadatim udelom i centrira na
podlozi u boji sajta (`--cream`), sa diskretnom trakom i logom u donjem uglu —
isti brendirani okvir koji ima i kartica na sajtu. Bela pozadina studijskog
snimka se pomnoži podlogom (isto što `mix-blend-multiply` radi u pretraživaču),
pa se ne vidi kao beo pravougaonik zalepljen na krem.

Slika koja je već napravljena i nije starija od originala se preskače, pa
ponovljeno pokretanje ne troši vreme; `--ponovo` tu proveru zaobilazi.
`--dry` ništa ne upisuje. `--samo` radi zadate kataloške brojeve (za proveru).
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image

# Windows konzola je podrazumevano cp1252, pa bi „→" i „š" u izveštaju obarali
# skriptu na samom kraju — posle celog posla.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

KOREN = Path(__file__).resolve().parent.parent
JAVNO = KOREN / "public"
IZLAZ = JAVNO / "images" / "og"

#: Traženi format velike kartice za deljenje (Facebook / Twitter / LinkedIn).
PLATNO = (1200, 630)

#: Koliki deo platna sme da zauzme sam proizvod. Uže od kadra kartice: ovde je
#: cilj da se oko proizvoda vidi brendirana podloga, a ne da se popuni ivica.
UDEO = (0.62, 0.84)

#: `--cream` iz `tailwind.config.ts` — podloga sajta.
KREM = (250, 247, 240)

#: `--brand` (tamnozelena) — traka uz donju ivicu.
ZELENA = (27, 94, 32)

#: Koliko se sitan original sme uvećati pre nego što postane mutan. Crteži su
#: 600x600, a visina za proizvod je ~529px, pa uvećanja praktično i nema.
MAX_UVECANJE = 1.25

#: 80 uz 4:2:0 hromatsko poduzorkovanje. Kartica se gleda kao pregled u ćaskanju
#: (najčešće ~500px široka), pa se razlika u odnosu na 86/4:4:4 ne vidi, a ceo
#: set je za trećinu lakši — a to su megabajti koji stoje u repozitorijumu.
KVALITET = 80
PODUZORKOVANJE = 2

LOGO = JAVNO / "images" / "logo-mark.png"

#: Spisak kataloških brojeva koji IMAJU og karticu. Čita ga `ogSlikaProizvoda`
#: (`src/lib/products.ts`) — bez njega bi sajt morao da nagađa da li fajl postoji,
#: a proizvod bez kartice bi dobio og:image koji vraća 404.
MANIFEST = KOREN / "src" / "data" / "og-images.json"

#: Mape kataloški broj → putanja slike; iste koje čita i sajt (`lib/products.ts`).
IZVORI_MAPE = [
    KOREN / "src" / "data" / "images.json",
    KOREN / "src" / "data" / "machine-images.json",
]

#: Prikolice i njihova oprema NISU u mapama iznad — sliku nose u svom redu
#: (`lib/catalog.ts` → `trailerRows`), pa se čitaju posebno.
IZVOR_PRIKOLICA = KOREN / "src" / "data" / "trailers.json"


def slike_proizvoda() -> dict[str, Path]:
    """Kataloški broj → fajl na disku, samo za slike koje stvarno postoje."""
    mapa: dict[str, str] = {}
    for putanja in IZVORI_MAPE:
        if putanja.exists():
            mapa.update(json.loads(putanja.read_text(encoding="utf-8")))

    if IZVOR_PRIKOLICA.exists():
        for red in json.loads(IZVOR_PRIKOLICA.read_text(encoding="utf-8")):
            if red.get("image"):
                mapa[red["id"]] = red["image"]

    nadjeno: dict[str, Path] = {}
    nedostaje: list[str] = []
    for broj, veb_putanja in mapa.items():
        fajl = JAVNO / veb_putanja.lstrip("/")
        if fajl.exists():
            nadjeno[broj] = fajl
        else:
            nedostaje.append(veb_putanja)

    if nedostaje:
        print(f"  upozorenje: {len(nedostaje)} putanja iz mape nema fajl na disku")
        print(f"    npr. {', '.join(nedostaje[:4])}")
    return nadjeno


def na_krem(slika: Image.Image) -> Image.Image:
    """
    Bela pozadina JPEG-a se stapa sa podlogom, kao `mix-blend-multiply` na sajtu.

    Množenje belu (255) pomnoži podlogom i dobije tačno podlogu, dok sam
    proizvod — siv, plav, crn — ostaje nepromenjen.
    """
    rgb = slika.convert("RGB")
    podloga = Image.new("RGB", rgb.size, KREM)
    from PIL import ImageChops

    return ImageChops.multiply(rgb, podloga)


def kompozit(izvor: Path) -> Image.Image:
    platno = Image.new("RGB", PLATNO, KREM)
    sirina, visina = PLATNO

    with Image.open(izvor) as original:
        slika = na_krem(original)

    najveca = (int(sirina * UDEO[0]), int(visina * UDEO[1]))
    razmera = min(
        najveca[0] / slika.width,
        najveca[1] / slika.height,
        MAX_UVECANJE,
    )
    nova = (max(1, round(slika.width * razmera)), max(1, round(slika.height * razmera)))
    slika = slika.resize(nova, Image.LANCZOS)

    platno.paste(slika, ((sirina - nova[0]) // 2, (visina - nova[1]) // 2))

    # Zelena traka uz donju ivicu — isti potez kao dugme na sajtu, da kartica
    # bude prepoznatljiva kao PlugekS i kad se deli bez teksta.
    traka = Image.new("RGB", (sirina, 10), ZELENA)
    platno.paste(traka, (0, visina - 10))

    if LOGO.exists():
        with Image.open(LOGO) as logo:
            logo = logo.convert("RGBA")
            visina_logoa = 46
            sirina_logoa = max(1, round(logo.width * visina_logoa / logo.height))
            logo = logo.resize((sirina_logoa, visina_logoa), Image.LANCZOS)
            platno.paste(logo, (44, visina - visina_logoa - 42), logo)

    return platno


def sveza(izlaz: Path, izvor: Path) -> bool:
    """Kompozit postoji i nije stariji od originala."""
    return izlaz.exists() and izlaz.stat().st_mtime >= izvor.stat().st_mtime


def main() -> int:
    dry = "--dry" in sys.argv
    ponovo = "--ponovo" in sys.argv

    samo: set[str] = set()
    if "--samo" in sys.argv:
        samo = set(sys.argv[sys.argv.index("--samo") + 1].split(","))

    slike = slike_proizvoda()
    if samo:
        slike = {b: p for b, p in slike.items() if b in samo}
    if not slike:
        print("Nema nijedne slike proizvoda — proveri src/data/images.json.")
        return 1

    if not dry:
        IZLAZ.mkdir(parents=True, exist_ok=True)

    broj = {"napravljeno": 0, "preskočeno": 0, "greška": 0}
    for katbroj, izvor in sorted(slike.items()):
        izlaz = IZLAZ / f"{katbroj}.jpg"
        if not ponovo and sveza(izlaz, izvor):
            broj["preskočeno"] += 1
            continue
        try:
            slika = kompozit(izvor)
            if not dry:
                slika.save(
                    izlaz,
                    "JPEG",
                    quality=KVALITET,
                    subsampling=PODUZORKOVANJE,
                    optimize=True,
                    progressive=True,
                )
            broj["napravljeno"] += 1
        except Exception as greska:  # noqa: BLE001 — jedna loša slika ne ruši posao
            print(f"  GREŠKA {katbroj} ({izvor.name}): {greska}")
            broj["greška"] += 1

    if not dry and not samo:
        # Manifest se prepisuje samo posle PUNOG prolaza; `--samo` radi nekoliko
        # brojeva radi provere i ne sme da proglasi da ostali nemaju karticu.
        napravljeni = sorted(p.stem for p in IZLAZ.glob("*.jpg"))
        MANIFEST.write_text(
            json.dumps(napravljeni, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )
        print(f"  manifest: {len(napravljeni)} brojeva → {MANIFEST.relative_to(KOREN)}")

    mb = (
        sum(p.stat().st_size for p in IZLAZ.glob("*.jpg")) / 1024 / 1024
        if IZLAZ.exists()
        else 0
    )
    print(
        f"[og kartice] {len(slike)} proizvoda → {PLATNO[0]}x{PLATNO[1]}"
        f"  (napravljeno {broj['napravljeno']}, već bilo {broj['preskočeno']},"
        f" grešaka {broj['greška']})  {mb:.1f} MB u public/images/og/"
    )
    if dry:
        print("\n(--dry: ništa nije upisano)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
