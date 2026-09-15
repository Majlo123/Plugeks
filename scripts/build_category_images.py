"""
Sklapa tri ulazne slike za kartice kategorija u heroju.

    python scripts/build_category_images.py [--dry]

ZAŠTO POSTOJI: kartica kategorije na početnoj strani nije kartica proizvoda.
Ranije je nosila JEDNU fotografiju iz kataloga — tanjiraču, jednu plužnu dasku,
jednu prikolicu — pa je „Delovi" sa 4.644 stavke izgledalo kao da se prodaje
tačno jedan komad. Sad svaka kartica nosi VIŠE proizvoda u jednom kadru, da se
sa dva metra razdaljine vidi da je iza klika katalog, a ne artikal.

ZAŠTO JE KADAR ŠIROK (14:5) I ZAŠTO NOSI SVOJU PODLOGU: kartica u heroju više
nema obojen panel sa fotografijom umetnutom u ugao — CELA kartica je ova slika.
Zato kadar mora da sadrži i mesto za tekst: leva polovina se namerno ostavlja
prazna (vidi `TEKST_DO`), a proizvodi stoje desno. Podloga zato više nije samo
bela: to je svetla METALNA PLOČA — gradijent od skoro bele gore do kosti dole,
tamniji pojas „stola" pri dnu, dijagonalni odsjaj preko sredine i vinjeta po
ivicama. Ista ploča za sve tri kartice: tri kartice su tako jedan materijal, a
razlikuje ih samo ono što na njima stoji.

ZAŠTO JEDAN VELIKI PROIZVOD, A DVA MANJA: kartica je na desktopu široka oko
385px, a tekst zauzima levu polovinu — na proizvode otpada jedva 200px. Tri
jednaka proizvoda tu ispadnu po 65px i opet su sličice. Jedan nosi kadar (oko
135px, prepoznaje se), a dva manja uz njega kažu da iza klika stoji više od
jednog komada.

Slike se ne crtaju ručno nego se sklapaju od postojećih fotografija proizvoda,
pa uvek prikazuju ono što je stvarno u ponudi:

  - `public/images/masine/hofman/`  Hofman (zelene) mašine,
  - `public/images/plugovi/`        tehnički crteži delova za plugove,
  - `public/images/prikolice/`      Vesta auto-prikolice.

Pored tri kadra za hero (`public/images/ulaz/`) sklapa i MREŽU 2x2 za karticu
„Poljoprivredne mašine" (`public/images/kategorije/poljoprivredne.jpg`) — na
goloj beloj, bez senke, u istom stilu kao ručno pripremljene kartice šumskih i
građevinskih mašina pored nje.

Delovi idu kao CRTEŽI, a ne kao Rolland fotografije: fotografije nose preko
sebe poluprovidan ROLLAND žig, koji na ovoj veličini ostaje čitljiv i izgleda
kao greška u pripremi. Crtež uz to pokazuje i oblik i mere, što je kod potrošnog
dela ono po čemu se bira (vidi i `redosled.ts`, gde crtež ide ispred fotografije).

KAKO: svi izvori stoje na beloj podlozi, pa se belina izdvaja u alfa kanal
(`izrezi`) i proizvod se „položi" na ploču umesto na golu belinu. Ispod
fotografija ide meka senka po njihovoj SOPSTVENOJ silueti — bez nje proizvodi
lebde i kolaž se raspada na nalepnice; crteži je nemaju (vidi `Kadar.senke`).
"""

from __future__ import annotations

import sys
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

KOREN = Path(__file__).resolve().parent.parent
IZLAZ = KOREN / "public" / "images" / "ulaz"
IZLAZ_KATEGORIJE = KOREN / "public" / "images" / "kategorije"

#: Odnos stranica kartice u heroju (vidi `Ulaz` u `Hero.tsx` → `aspect-[14/5]`).
#: Kadar i kartica MORAJU biti istog odnosa: kartica je slika, pa bi svako
#: neslaganje značilo da `object-cover` opseca ili proizvod ili prazninu za
#: tekst.
PLATNO = (1400, 500)

KVALITET = 90

#: Do ovog udela širine kadar ostaje prazan — tu, preko slike, stoji tekst
#: kartice. Proizvodi počinju odmah iza.
TEKST_DO = 0.47

#: Metalna ploča: skoro bela gore, kost dole, pa tamniji pojas „stola".
PLOCA_GORE = (253, 253, 251)
PLOCA_DOLE = (228, 231, 222)
PLOCA_POD = (211, 215, 205)

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
    #: Platno i podloga: hero kadrovi su 14:5 na metalnoj ploči, mreže za
    #: kategorijske kartice 16:10 na goloj beloj (kao susedne ručne kartice).
    platno: tuple[int, int] = PLATNO
    bela_podloga: bool = False
    #: Vodoravno centriranje i po visini (mreža), umesto „na dno police" (hero).
    centriraj: bool = False


# Raspored „dva manja levo, jedan veliki desno" nose sve tri kartice — ista
# građa, pa se red čita kao jedna stvar, a ne kao tri različita plakata.
#
# Veliki je uvek onaj proizvod po kojem se vrsta prepoznaje iz hoda: malčer
# (najšira i najprepoznatljivija zelena mašina), plužna daska (deo koji se
# najviše i troši i traži) i otvorena prikolica Light 23. Dva manja uz njega su
# namerno DRUGOG tipa — tanjirača i plug, trougao i raonik, box i platforma —
# jer se katalog i pretražuje po tipu; tri iste stvari bi izgledale kao jedna.
#
# Plave Rolland mašine su skinute sa sajta, pa ih ovde nema.
KADROVI = (
    Kadar(
        naziv="mašine",
        izlaz="masine.jpg",
        stavke=(
            ("masine/hofman/tanjiraca-bronca.jpg", Mesto(0.47, 0.09, 0.175, 0.33)),
            ("masine/hofman/plug-nero.jpg", Mesto(0.47, 0.57, 0.175, 0.33)),
            ("masine/hofman/malcer-g-line.jpg", Mesto(0.625, 0.17, 0.34, 0.66)),
        ),
    ),
    Kadar(
        naziv="delovi",
        izlaz="delovi.jpg",
        stavke=(
            ("plugovi/1957.jpg", Mesto(0.475, 0.10, 0.13, 0.34)),
            ("plugovi/3802.jpg", Mesto(0.47, 0.58, 0.155, 0.32)),
            ("plugovi/1970.jpg", Mesto(0.635, 0.11, 0.335, 0.78)),
        ),
        senke=False,
    ),
    Kadar(
        naziv="auto-prikolice",
        izlaz="prikolice.jpg",
        stavke=(
            ("prikolice/light-20-box.jpg", Mesto(0.47, 0.09, 0.175, 0.33)),
            ("prikolice/cargo-4120-3-5-14c.jpg", Mesto(0.47, 0.57, 0.175, 0.33)),
            ("prikolice/light-23.jpg", Mesto(0.625, 0.17, 0.34, 0.66)),
        ),
    ),
)

# Mreža 2x2 za karticu „Poljoprivredne mašine" na početnoj i na /masine: četiri
# RAZLIČITA posla — tanjirača, malčer, kosačica, plug — svaki u svom polju, sa
# jasnim razmakom, da se nijedna dva ne stope u jednu mašinu.
MREZE = (
    Kadar(
        naziv="kategorija: poljoprivredne",
        izlaz="poljoprivredne.jpg",
        stavke=(
            ("masine/hofman/tanjiraca-bronca.jpg", Mesto(0.02, 0.03, 0.46, 0.44)),
            ("masine/hofman/malcer-g-line.jpg", Mesto(0.52, 0.03, 0.46, 0.44)),
            ("masine/hofman/kosacica-jasa.jpg", Mesto(0.02, 0.53, 0.46, 0.44)),
            ("masine/hofman/plug-nero.jpg", Mesto(0.52, 0.53, 0.46, 0.44)),
        ),
        senke=False,
        platno=(900, 563),
        bela_podloga=True,
        centriraj=True,
    ),
)


def ploca(velicina: tuple[int, int]) -> Image.Image:
    """
    Svetla metalna ploča na kojoj proizvodi stoje — podloga cele kartice.

    Četiri sloja, svaki rešava jednu stvar:
      * uspravni gradijent — ploča ima gore i dole, nije ravna traka;
      * pojas „stola" pri dnu — proizvodi imaju na čemu da stoje, pa senka
        ispod njih ima smisla;
      * dijagonalni odsjaj — jedina stvar koja svetlu površinu čita kao METAL
        umesto kao papir, i jedina koja radi na svakoj veličini (fino brušenje
        bi na kartici od 330px dalo moare);
      * zrno — bez njega JPEG od ovako mekog gradijenta pravi vidljive trake.
    """
    sirina, visina = velicina
    yy, xx = np.mgrid[0:visina, 0:sirina].astype(np.float32)
    ty = yy / max(1, visina - 1)

    gore = np.array(PLOCA_GORE, dtype=np.float32)
    dole = np.array(PLOCA_DOLE, dtype=np.float32)
    pod = np.array(PLOCA_POD, dtype=np.float32)

    piksure = gore + (dole - gore) * ty[:, :, None]

    prelaz = (np.clip((ty - 0.70) / 0.30, 0.0, 1.0) ** 1.6)[:, :, None]
    piksure = piksure + (pod - piksure) * prelaz

    dijagonala = (xx / sirina) * 0.8 + (yy / visina) * 0.6
    piksure += (np.exp(-((dijagonala - 0.62) ** 2) / (2 * 0.16**2)) * 7.0)[:, :, None]

    r = np.hypot(
        (xx - sirina * 0.5) / (sirina * 0.62),
        (yy - visina * 0.45) / (visina * 0.72),
    )
    piksure -= (np.clip(r - 0.75, 0.0, None) ** 1.5 * 26.0)[:, :, None]

    piksure += np.random.default_rng(7).normal(0.0, 1.1, (visina, sirina, 1))

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
    velicina = kadar.platno
    platno = Image.new("RGB", velicina, (255, 255, 255)) if kadar.bela_podloga else ploca(velicina)
    crno = Image.new("RGB", velicina, (24, 30, 24))

    for rel, mesto in kadar.stavke:
        izvor = KOREN / "public" / "images" / rel
        if not izvor.exists():
            raise SystemExit(f"nedostaje: {izvor}")

        proizvod = izrezi(izvor)

        # `contain`, ne `cover`: proizvod se nikad ne opseca. Kadrovi su
        # izabrani tako da im odnos odgovara mestu, pa praznine ostaje malo.
        polje = (round(mesto.w * velicina[0]), round(mesto.h * velicina[1]))
        faktor = min(polje[0] / proizvod.width, polje[1] / proizvod.height)
        nova = (max(1, round(proizvod.width * faktor)), max(1, round(proizvod.height * faktor)))
        proizvod = proizvod.resize(nova, Image.LANCZOS)

        # Vodoravno u sredinu polja, uspravno na DNO — tako svi proizvodi u
        # jednom redu stoje na istoj liniji, kao na polici. U mreži i po visini
        # u sredinu: tamo polja nisu red police nego četiri zasebna prozora.
        x = round(mesto.x * velicina[0]) + (polje[0] - nova[0]) // 2
        y = round(mesto.y * velicina[1]) + (
            (polje[1] - nova[1]) // 2 if kadar.centriraj else polje[1] - nova[1]
        )

        if kadar.senke:
            platno.paste(crno, (0, 0), senka(proizvod, velicina, (x, y)))
        platno.paste(proizvod, (x, y), proizvod)

    return platno


def main() -> None:
    for izlaz_dir, kadrovi in ((IZLAZ, KADROVI), (IZLAZ_KATEGORIJE, MREZE)):
        for kadar in kadrovi:
            slika = sklopi(kadar)
            if "--dry" in sys.argv:
                print(f"{kadar.naziv:28} (dry)")
                continue
            izlaz_dir.mkdir(parents=True, exist_ok=True)
            putanja = izlaz_dir / kadar.izlaz
            slika.save(putanja, "JPEG", quality=KVALITET, optimize=True, progressive=True)
            print(f"{kadar.naziv:28} → {putanja.relative_to(KOREN)}  ({putanja.stat().st_size // 1024} kB)")


if __name__ == "__main__":
    main()
