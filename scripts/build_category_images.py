"""
Sklapa tri ulazne slike za kartice kategorija u heroju.

    python scripts/build_category_images.py [--dry]

ZAŠTO POSTOJI: kartica kategorije na početnoj strani nije kartica proizvoda.
Ranije je nosila JEDNU fotografiju iz kataloga — tanjiraču, jednu plužnu dasku,
jednu prikolicu — pa je „Delovi" sa 4.644 stavke izgledalo kao da se prodaje
tačno jedan komad. Sad svaka kartica nosi VIŠE proizvoda u jednom kadru, da se
sa dva metra razdaljine vidi da je iza klika katalog, a ne artikal.

Slike se ne crtaju ručno nego se sklapaju od postojećih fotografija proizvoda,
pa uvek prikazuju ono što je stvarno u ponudi:

  - `public/images/masine/`     Rolland (plavo) i Hofman (zeleno) mašine,
  - `public/images/plugovi/`    tehnički crteži delova za plugove,
  - `public/images/prikolice/`  Vesta auto-prikolice.

Delovi idu kao CRTEŽI, a ne kao Rolland fotografije: fotografije nose preko
sebe poluprovidan ROLLAND žig, koji na ovoj veličini ostaje čitljiv i izgleda
kao greška u pripremi. Crtež uz to pokazuje i oblik i mere, što je kod potrošnog
dela ono po čemu se bira (vidi i `redosled.ts`, gde crtež ide ispred fotografije).

KAKO: svi izvori stoje na beloj podlozi, pa se belina izdvaja u alfa kanal
(`izrezi`) i proizvod se „položi" na blagi studijski gradijent umesto na golu
belinu. Ispod fotografija ide meka senka po njihovoj SOPSTVENOJ silueti — bez
nje proizvodi lebde i kolaž se raspada na nalepnice; crteži je nemaju (vidi
`Kadar.senke`).

Broj proizvoda po kadru je namerno mali (tri do četiri). Kadar se na kartici
prikazuje širok oko 140-200px; na šest komada bi svaki bio ispod 50px i ništa
se ne bi prepoznalo, a poenta je baš da se prepozna.
"""

from __future__ import annotations

import sys
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

KOREN = Path(__file__).resolve().parent.parent
IZLAZ = KOREN / "public" / "images" / "ulaz"

#: Odnos stranica kadra na kartici (vidi `Ulaz` u `Hero.tsx`).
PLATNO = (1000, 800)

KVALITET = 90

#: Studijska podloga: od bele gore do `bone` (#EFF0EA) dole — ista prljavo bela
#: kojom su podložene i kartice proizvoda, pa se kadar ne vidi kao beli
#: pravougaonik ubačen u krem karticu.
PODLOGA_GORE = (255, 255, 255)
PODLOGA_DOLE = (233, 235, 227)

#: Ispod ove razlike od bele piksel je podloga, a ne proizvod. Blago, da meka
#: senka ispod proizvoda ne bude odsečena kao stepenica.
PRAG_BELE = 10

#: Koliko brzo alfa raste od praga do pune neprozirnosti. Pocinkovane prikolice
#: su svetlo sive, pa nagla rampa proguta njihove najsvetlije površine.
NAGIB_ALFE = 6.0


@dataclass(frozen=True)
class Mesto:
    """Pravougaonik u kojem stoji jedan proizvod, u udelima platna."""

    x: float
    y: float
    w: float
    h: float


@dataclass(frozen=True)
class Kadar:
    naziv: str
    izlaz: str
    #: (putanja do fotografije, mesto u kadru) — redom kojim se crtaju.
    stavke: tuple[tuple[str, Mesto], ...]
    #: Senka ispod proizvoda. Fotografija je snimak predmeta koji negde stoji,
    #: pa mu senka pripada; tehnički crtež je crtež i senka bi mu bila laž.
    senke: bool = True


# Raspored „jedan širok gore, dva ispod" nose mašine i prikolice: i jedne i
# druge su na fotografiji ŠIROKE (oko 1,6:1), pa im širok gornji pojas leži
# prirodno, a dva manja ispod daju množinu bez sitnjenja.
#
# Isti raspored nose i delovi, da sve tri kartice imaju istu građu. Izabrana su
# tri RAZLIČITA tipa — daska, grudi daske i raonik — jer se katalog delova i
# pretražuje po tipu; tri daske bi na kadru izgledale kao jedna. Plaz je ispao
# iako je četvrti po traženosti: dugačak je i tanak (odnos 2,8), pa se u polje
# sa ostalima uklapa kao šibica i na kartici se izgubi.
KADROVI = (
    Kadar(
        naziv="mašine",
        izlaz="masine.jpg",
        stavke=(
            ("masine/4394.jpg", Mesto(0.03, 0.03, 0.94, 0.49)),
            ("masine/hofman/plug-nero.jpg", Mesto(0.03, 0.54, 0.455, 0.42)),
            ("masine/hofman/malcer-pro-line.jpg", Mesto(0.515, 0.54, 0.455, 0.42)),
        ),
    ),
    Kadar(
        naziv="delovi",
        izlaz="delovi.jpg",
        stavke=(
            ("plugovi/1970.jpg", Mesto(0.03, 0.03, 0.94, 0.49)),
            ("plugovi/1957.jpg", Mesto(0.03, 0.54, 0.455, 0.42)),
            ("plugovi/3802.jpg", Mesto(0.515, 0.54, 0.455, 0.42)),
        ),
        senke=False,
    ),
    Kadar(
        naziv="auto-prikolice",
        izlaz="prikolice.jpg",
        stavke=(
            ("prikolice/light-23.jpg", Mesto(0.03, 0.03, 0.94, 0.49)),
            ("prikolice/light-20-box.jpg", Mesto(0.03, 0.54, 0.455, 0.42)),
            ("prikolice/cargo-4120-3-5-14c.jpg", Mesto(0.515, 0.54, 0.455, 0.42)),
        ),
    ),
)


def podloga(velicina: tuple[int, int]) -> Image.Image:
    """Blagi vertikalni gradijent + svetlo teme u gornjoj trećini."""
    sirina, visina = velicina
    t = np.linspace(0.0, 1.0, visina, dtype=np.float32)[:, None]
    gore = np.array(PODLOGA_GORE, dtype=np.float32)
    dole = np.array(PODLOGA_DOLE, dtype=np.float32)
    trake = gore + (dole - gore) * t  # (visina, 3)

    piksure = np.repeat(trake[:, None, :], sirina, axis=1)

    # Meko svetlo iznad sredine — kadar dobija dubinu studijskog snimka umesto
    # ravne trake. Namerno slabo (do 6 nivoa): jače počne da se vidi kao mrlja.
    yy, xx = np.mgrid[0:visina, 0:sirina].astype(np.float32)
    r = np.hypot((xx - sirina * 0.5) / (sirina * 0.75), (yy - visina * 0.28) / (visina * 0.7))
    piksure += (6.0 * np.clip(1.0 - r, 0.0, 1.0) ** 2)[:, :, None]

    return Image.fromarray(np.clip(piksure, 0, 255).astype(np.uint8), "RGB")


def izrezi(putanja: Path) -> Image.Image:
    """
    Fotografija sa bele podloge → RGBA isečen na sam proizvod.

    Alfa je rampa, a ne prag: ivice proizvoda su na originalu izglađene prema
    beloj, pa bi tvrd prag ostavio nazubljen obod. Rampa usput čuva i mekanu
    senku ispod proizvoda — ona na podlozi izgleda kao da je tu i snimljena.
    """
    with Image.open(putanja) as sirova:
        im = sirova.convert("RGB")

    piksure = np.asarray(im, dtype=np.float32)
    # Razlika od bele = koliko je najtamniji kanal pao ispod 255.
    razlika = 255.0 - piksure.min(axis=2)
    alfa = np.clip((razlika - PRAG_BELE) * NAGIB_ALFE, 0.0, 255.0)

    rgba = np.dstack([piksure, alfa]).astype(np.uint8)
    isecak = Image.fromarray(rgba, "RGBA")

    okvir = isecak.getchannel("A").point(lambda p: 255 if p > 8 else 0).getbbox()
    return isecak.crop(okvir) if okvir else isecak


def senka(proizvod: Image.Image, platno: tuple[int, int], mesto: tuple[int, int]) -> Image.Image:
    """
    Maska senke ispod proizvoda — njegova SOPSTVENA silueta, spljoštena.

    Elipsa je bila pogrešna za mašine: tanjirača dodiruje pod samo vrhovima
    radnih tela, a elipsa preko cele njene širine se čitala kao odvojena siva
    mrlja ispod mašine. Spljoštena silueta prati stvarni oslonac — široka je
    tamo gde je i mašina, a nema je tamo gde mašine nema.
    """
    sirina, visina = proizvod.size
    vis_senke = max(6, round(visina * 0.16))

    spljostena = proizvod.getchannel("A").resize((sirina, vis_senke), Image.LANCZOS)
    # Senka je uvek slabija od predmeta; 0,42 je granica na kojoj se još vidi
    # da proizvod stoji, a da podloga ne posivi.
    spljostena = spljostena.point(lambda p: int(p * 0.42))

    maska = Image.new("L", platno, 0)
    maska.paste(spljostena, (mesto[0], mesto[1] + visina - round(vis_senke * 0.55)))
    return maska.filter(ImageFilter.GaussianBlur(vis_senke * 0.42))


def sklopi(kadar: Kadar) -> Image.Image:
    platno = podloga(PLATNO)
    crno = Image.new("RGB", PLATNO, (24, 30, 24))

    for rel, mesto in kadar.stavke:
        izvor = KOREN / "public" / "images" / rel
        if not izvor.exists():
            raise SystemExit(f"nedostaje: {izvor}")

        proizvod = izrezi(izvor)

        # `contain`, ne `cover`: proizvod se nikad ne opseca. Kadrovi su
        # izabrani tako da im odnos odgovara mestu, pa praznine ostaje malo.
        polje = (round(mesto.w * PLATNO[0]), round(mesto.h * PLATNO[1]))
        faktor = min(polje[0] / proizvod.width, polje[1] / proizvod.height)
        nova = (max(1, round(proizvod.width * faktor)), max(1, round(proizvod.height * faktor)))
        proizvod = proizvod.resize(nova, Image.LANCZOS)

        # Vodoravno u sredinu polja, uspravno na DNO — tako svi proizvodi u
        # jednom redu stoje na istoj liniji, kao na polici.
        x = round(mesto.x * PLATNO[0]) + (polje[0] - nova[0]) // 2
        y = round(mesto.y * PLATNO[1]) + (polje[1] - nova[1])

        if kadar.senke:
            platno.paste(crno, (0, 0), senka(proizvod, PLATNO, (x, y)))
        platno.paste(proizvod, (x, y), proizvod)

    return platno


def main() -> None:
    for kadar in KADROVI:
        slika = sklopi(kadar)
        if "--dry" in sys.argv:
            print(f"{kadar.naziv:16} (dry)")
            continue
        IZLAZ.mkdir(parents=True, exist_ok=True)
        putanja = IZLAZ / kadar.izlaz
        slika.save(putanja, "JPEG", quality=KVALITET, optimize=True, progressive=True)
        print(f"{kadar.naziv:16} → {putanja.relative_to(KOREN)}  ({putanja.stat().st_size // 1024} kB)")


if __name__ == "__main__":
    main()
