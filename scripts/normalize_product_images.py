"""
Svodi fotografije proizvoda na jedan kadar — isti odnos stranica kao kartica.

    python scripts/normalize_product_images.py [prikolice|masine|delovi|crtezi] [--dry] [--ponovo]
    (ili: npm run slike:kadar)

ZAŠTO POSTOJI: kartica proizvoda prikazuje sliku sa `object-cover`, dakle
opseca sve što ne staje u njen odnos stranica. Izvorne fotografije to ne
poštuju:

  - Rolland delovi su 472x630 i 599x800, dakle USPRAVNI, a kartica dela je
    bila položena — pola dela je odlazilo van kadra („daska ispresecana"),
  - prikolice sa vesta-trailers dolaze u 50 različitih formata, od 157x73 do
    2560x1696, sa 25-100% praznine u kadru.

Rešenje nije opsecanje nego suprotno: proizvod se iseče iz bele pozadine,
skalira na uvek isti udeo kadra i centrira na belom platnu tačnog odnosa. Tada
`object-cover` nema šta da opseče, a sve kartice u mreži izgledaju kao jedan set.

Rolland fotografije usput gube i ROLLAND ZAGLAVLJE — traku sa logom iznad
samog dela, koja je uzimala oko četvrtine kadra i gurala deo nadole. Poluprovidni
ROLLAND žig PREKO dela ostaje (vidi `bez_zaglavlja`).

ŠTA NE RADI: ne dira boje i ne dira `public/images/masine/*.jpg` — dvanaest
Rolland mašina je ručno pripremljeno i već je tačno 900x563. Hofman mašine
(`npm run masine`) idu u podfolder `masine/hofman/` i njih ovaj posao sređuje.

Slika koja je već u ciljnom formatu se preskače, pa ponovljeno pokretanje ne
gubi kvalitet na ponovnom JPEG kodiranju; `--ponovo` tu proveru zaobilazi (treba
samo kad se promeni sam recept). `--dry` ništa ne upisuje.
"""

from __future__ import annotations

import sys
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageChops

KOREN = Path(__file__).resolve().parent.parent

BELA = (255, 255, 255)

# Granica „ovo je još uvek bela pozadina". Namerno blaga: senka ispod proizvoda
# je deo fotografije i ne sme da se odseče.
PRAG_BELE = 12

KVALITET = 88


@dataclass(frozen=True)
class Posao:
    naziv: str
    ulaz: Path
    izlaz: Path
    #: Platno = odnos stranica kartice na kojoj se slika prikazuje.
    platno: tuple[int, int]
    #: Koliki deo platna sme da zauzme proizvod (širina, visina).
    udeo: tuple[float, float]
    #: Koliko se sitan original sme uvećati pre nego što postane mutan.
    max_uvecanje: float
    #: Odseca ROLLAND zaglavlje iznad proizvoda — vidi `bez_zaglavlja()`.
    iseci_zaglavlje: bool = False


POSLOVI = {
    # Kartica prikolice je 16:10 (MachineCard / TrailerCard).
    "prikolice": Posao(
        naziv="auto-prikolice i oprema",
        ulaz=KOREN / "data" / "vesta-originals",
        izlaz=KOREN / "public" / "images" / "prikolice",
        platno=(1200, 750),
        udeo=(0.90, 0.82),
        max_uvecanje=2.6,
    ),
    # Kartica dela je kvadratna: sadržaj Rolland fotografija je posle opsecanja
    # bele u proseku kvadratan (medijana odnosa 0.97), pa je to najmanje praznine.
    "delovi": Posao(
        naziv="delovi (Rolland fotografije)",
        ulaz=KOREN / "public" / "images" / "rolland",
        izlaz=KOREN / "public" / "images" / "rolland",
        platno=(600, 600),
        udeo=(0.88, 0.88),
        max_uvecanje=1.4,
        iseci_zaglavlje=True,
    ),
    # Kartica mašine je 16:10, kao i kod prikolica; ciljne dimenzije su iste
    # kao kod dvanaest ručno pripremljenih Rolland mašina (900x563), da se u
    # istoj mreži ne razlikuju po oštrini.
    "masine": Posao(
        naziv="mašine (Hofman fotografije)",
        ulaz=KOREN / "data" / "hofman-originals",
        izlaz=KOREN / "public" / "images" / "masine" / "hofman",
        platno=(900, 563),
        udeo=(0.92, 0.86),
        # Originali su 750x500, dakle tek nešto manji od platna — veće uvećanje
        # bi ih samo omekšalo.
        max_uvecanje=1.5,
    ),
    "crtezi": Posao(
        naziv="delovi za plugove (tehnički crteži)",
        ulaz=KOREN / "public" / "images" / "plugovi",
        izlaz=KOREN / "public" / "images" / "plugovi",
        platno=(600, 600),
        udeo=(0.88, 0.88),
        max_uvecanje=1.4,
    ),
}


def na_belo(im: Image.Image) -> Image.Image:
    """PNG sa prozirnošću → RGB na beloj podlozi (inače alfa pocrni u JPEG-u)."""
    if im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info):
        im = im.convert("RGBA")
        podloga = Image.new("RGBA", im.size, BELA + (255,))
        return Image.alpha_composite(podloga, im).convert("RGB")
    return im.convert("RGB")


def okvir_proizvoda(im: Image.Image) -> tuple[int, int, int, int] | None:
    """Pravougaonik u kojem je sve što nije bela pozadina."""
    razlika = ImageChops.difference(im, Image.new("RGB", im.size, BELA))
    maska = razlika.convert("L").point(lambda p: 255 if p > PRAG_BELE else 0)
    return maska.getbbox()


def bez_zaglavlja(im: Image.Image) -> Image.Image:
    """
    Odseca ROLLAND zaglavlje (logo + „Technika Rolnicza") iznad samog dela.

    Rolland fotografije su listovi iz njihovog kataloga: gore logo, ispod njega
    pojas čiste bele, pa tek onda proizvod. Zaglavlje je uzimalo oko četvrtine
    kadra i guralo deo nadole, pa je deo na kartici izgledao sitno.

    Gleda se u dve dimenzije, a ne red po red: zaglavlje je od dela često
    odvojeno samo levo-desno (žig preko dela ume da dosegne do njegove visine),
    pa podela po belim redovima promaši svaku četvrtu sliku, a kod višerednog
    loga odseče samo prvi red teksta.

    Zato se traže povezane celine na slici. Najveća je proizvod. Odbacuju se
    SAMO one koje su cele IZNAD proizvoda i u gornjoj trećini kadra — dakle
    zaglavlje. Ako je proizvod iz više komada, oni su ili u visini glavnog ili
    ispod njega, pa ostaju.

    Poluprovidni ROLLAND žig PREKO samog dela ostaje netaknut.
    """
    import numpy as np
    from scipy import ndimage

    piksure = np.asarray(im, dtype=np.int16)
    maska = (255 - piksure.min(axis=2)) > PRAG_BELE
    if not maska.any():
        return im

    # Blago širenje spaja slova loga u jednu celinu; inače bi svako slovo bilo
    # zasebna sitna celina.
    spojena = ndimage.binary_dilation(maska, np.ones((3, 3), bool), iterations=2)
    oznake, koliko = ndimage.label(spojena)
    if koliko < 2:
        return im

    okviri = ndimage.find_objects(oznake)
    povrsine = ndimage.sum(maska, oznake, index=range(1, koliko + 1))
    glavni = int(np.argmax(povrsine))
    glavni_y = okviri[glavni][0]

    visina = maska.shape[0]
    zaglavlje = [
        i
        for i, okvir in enumerate(okviri)
        if i != glavni
        and okvir[0].stop <= glavni_y.start  # cela celina je iznad proizvoda
        and okvir[0].start < visina * 0.33  # i to u gornjoj trećini kadra
    ]
    if not zaglavlje:
        return im

    # Ako bi „zaglavlje" bilo veće od pola proizvoda, verovatno nije zaglavlje.
    if povrsine[zaglavlje].sum() > povrsine[glavni] * 0.5:
        return im

    ostaje = [i for i in range(koliko) if i not in zaglavlje]
    gore = min(okviri[i][0].start for i in ostaje)
    dole = max(okviri[i][0].stop for i in ostaje)
    return im.crop((0, gore, im.size[0], dole))


def vec_sredjena(im: Image.Image, posao: Posao) -> bool:
    """
    Slika je već u ciljnom formatu ako joj se poklapaju i dimenzije i udeo koji
    proizvod zauzima. Bez ove provere bi svako pokretanje ponovo kodiralo 3.200
    JPEG-ova i polako ih kvarilo.
    """
    if im.size != posao.platno:
        return False
    okvir = okvir_proizvoda(im)
    if not okvir:
        return False

    sirina = (okvir[2] - okvir[0]) / posao.platno[0]
    visina = (okvir[3] - okvir[1]) / posao.platno[1]
    if sirina > posao.udeo[0] + 0.02 or visina > posao.udeo[1] + 0.02:
        return False

    # Centriranost je pouzdaniji znak nego sam udeo: slike kojima je uvećanje
    # ograničeno (`max_uvecanje`) nikad ne dostignu ciljni udeo, a ipak su
    # gotove — bez ovoga bi se prekodirale pri svakom pokretanju.
    levo, gore = okvir[0], okvir[1]
    desno = posao.platno[0] - okvir[2]
    dole = posao.platno[1] - okvir[3]
    # Tolerancija je 4px, a ne 1: posle JPEG kodiranja piksel uz ivicu ume da
    # padne tik iznad/ispod praga bele, pa se okvir pomeri za koji piksel.
    return abs(levo - desno) <= 4 and abs(gore - dole) <= 4


def obradi(putanja: Path, posao: Posao) -> str:
    """Vraća „preskočeno", „mekše" ili „ok"."""
    with Image.open(putanja) as sirova:
        im = na_belo(sirova)

    isecena = bez_zaglavlja(im) if posao.iseci_zaglavlje else im

    # Preskače se samo ako je slika i u ciljnom formatu i bez zaglavlja — inače
    # bi promena recepta zahtevala `--ponovo` nad svih 3.200 fajlova.
    if (
        "--ponovo" not in sys.argv
        and isecena.size == im.size
        and vec_sredjena(im, posao)
    ):
        return "preskočeno"

    im = isecena
    okvir = okvir_proizvoda(im)
    if okvir:
        im = im.crop(okvir)

    faktor = min(
        posao.platno[0] * posao.udeo[0] / im.width,
        posao.platno[1] * posao.udeo[1] / im.height,
    )
    meko = faktor > posao.max_uvecanje
    faktor = min(faktor, posao.max_uvecanje)

    nova = (max(1, round(im.width * faktor)), max(1, round(im.height * faktor)))
    im = im.resize(nova, Image.LANCZOS)

    platno = Image.new("RGB", posao.platno, BELA)
    platno.paste(
        im,
        ((posao.platno[0] - nova[0]) // 2, (posao.platno[1] - nova[1]) // 2),
    )

    if "--dry" not in sys.argv:
        posao.izlaz.mkdir(parents=True, exist_ok=True)
        platno.save(
            posao.izlaz / f"{putanja.stem}.jpg",
            "JPEG",
            quality=KVALITET,
            optimize=True,
            progressive=True,
        )
    return "mekše" if meko else "ok"


def uradi(posao: Posao) -> int:
    if not posao.ulaz.is_dir():
        print(f"[{posao.naziv}] nema foldera {posao.ulaz} — preskačem.")
        return 0

    slike = sorted(
        p
        for p in posao.ulaz.iterdir()
        # `.webp` je zbog Hofmana — on portrete servira isključivo u tom formatu.
        if p.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp")
    )
    if not slike:
        print(f"[{posao.naziv}] nema slika u {posao.ulaz} — preskačem.")
        return 0

    broj = {"ok": 0, "preskočeno": 0, "mekše": 0}
    mekse: list[str] = []
    for putanja in slike:
        try:
            ishod = obradi(putanja, posao)
        except Exception as greska:  # noqa: BLE001 — jedna loša slika ne ruši posao
            print(f"  GREŠKA {putanja.name}: {greska}")
            continue
        broj[ishod] += 1
        if ishod == "mekše":
            mekse.append(putanja.name)

    kb = sum(p.stat().st_size for p in posao.izlaz.glob("*.jpg")) // 1024
    print(
        f"[{posao.naziv}] {len(slike)} slika → {posao.platno[0]}x{posao.platno[1]}"
        f"  (sređeno {broj['ok'] + broj['mekše']}, već bilo {broj['preskočeno']})"
        f"  {kb / 1024:.1f} MB"
    )
    if mekse:
        print(f"    original presitan, ostaju mekše ({len(mekse)}): {', '.join(mekse[:6])}")
        if len(mekse) > 6:
            print(f"    …i još {len(mekse) - 6}")
    return len(slike)


def main() -> int:
    trazeni = [a for a in sys.argv[1:] if not a.startswith("--")]
    nepoznati = [a for a in trazeni if a not in POSLOVI]
    if nepoznati:
        print(f"Nepoznat posao: {', '.join(nepoznati)}")
        print(f"Dostupno: {', '.join(POSLOVI)}")
        return 1

    for kljuc in trazeni or list(POSLOVI):
        uradi(POSLOVI[kljuc])

    if "--dry" in sys.argv:
        print("\n(--dry: ništa nije upisano)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
