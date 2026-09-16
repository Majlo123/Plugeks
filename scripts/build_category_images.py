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
Zato kadar mora da sadrži i mesto za tekst: leva trećina se namerno ostavlja
prazna (vidi `Zid.od`), a proizvodi stoje desno. Podloga zato više nije samo
bela: to je svetla METALNA PLOČA — gradijent od skoro bele gore do kosti dole,
tamniji pojas „stola" pri dnu, dijagonalni odsjaj preko sredine i vinjeta po
ivicama. Ista ploča za sve tri kartice: tri kartice su tako jedan materijal, a
razlikuje ih samo ono što na njima stoji.

ZAŠTO PROIZVODI POPUNJAVAJU KADAR: raniji raspored je imao jedan proizvod preko
pola kadra i dva upola manja pored njega — tri veličine na tri linije, pa je
kartica izgledala kao da su proizvodi nabacani. Prvi popravak ih je postrojio u
jedan red jednakih visina, ali je red u kadru 14:5 nužno nizak: pet komada jedan
do drugog traži pojas odnosa 6,4:1, a raspoloživi je 1,6:1, pa su proizvodi
zauzimali četvrtinu kartice i ostatak je bio prazna ploča.

Zato se sad slažu u ZID (vidi `Zid`) — dva reda koja zajedno popune i širinu i
visinu kadra. Isti broj proizvoda u dva reda je dvostruko krupniji nego u
jednom, a od praznog ostaje samo pojas u kojem stoji tekst. Podela na redove se
ne bira ručno nego se traži pretragom, po pokrivenoj površini (`slozi_zid`).

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
(`izrezi`) i proizvod se „položi" na ploču umesto na golu belinu. Ispod svakog
ide meka senka po njegovoj SOPSTVENOJ silueti — bez nje proizvodi lebde i kolaž
se raspada na nalepnice. Crteži delova dodatno prolaze kroz `ocelici()`: bez
toga su im telo i ploča iste svetline, pa se u donjem redu kartice gube.
"""

from __future__ import annotations

import sys
from dataclasses import dataclass
from itertools import product
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

#: Metalna ploča: skoro bela gore, kost dole, pa tamniji pojas „stola".
PLOCA_GORE = (253, 253, 251)
PLOCA_DOLE = (228, 231, 222)
PLOCA_POD = (211, 215, 205)

#: Odakle naniže ploča prelazi u tamniji pojas „stola". Prati liniju na kojoj
#: stoji donji red zida — pod koji počinje ispod njega čita se kao površina na
#: kojoj proizvodi stoje, a ne kao senka pri dnu slike.
POD_OD = 0.72

#: Ispod ove razlike od bele piksel je podloga, a ne proizvod. Blago, da meka
#: senka ispod proizvoda ne bude odsečena kao stepenica.
PRAG_BELE = 10

#: Koliko brzo alfa raste od praga do pune neprozirnosti. Pocinkovane prikolice
#: su svetlo sive, pa nagla rampa proguta njihove najsvetlije površine.
NAGIB_ALFE = 6.0

#: Tehnički crtež nije fotografija i traži svoje vađenje iz bele.
#:
#: ZAŠTO: telo crteža je ravna siva popuna oko 210, a ploča ispod njega ide od
#: 253 gore do 211 u donjem pojasu — u donjem redu kartice to je ISTA svetlina i
#: crtež se gubi. Uz to ga opšta rampa (`NAGIB_ALFE`) na toj sivoj ostavlja na
#: 82% neprozirnosti, pa ploča prosijava kroz njega i dodatno ga ispira.
#:
#: Zato crtež ide kroz `ocelici()`: strma rampa ga zatvori do pune
#: neprozirnosti (silueta je oštra, nema šta da se čuva kao kod mekane senke na
#: fotografiji), a ton mu se spusti u čelik — svetlo gore, tamnije nadole, kao
#: brušen lim. Linije i kote su već crne i ostaju crne.
CRTEZ_PRAG = 4.0
CRTEZ_NAGIB = 22.0
CRTEZ_TON = 0.80
CRTEZ_PRELAZ = 0.07


@dataclass(frozen=True)
class Mesto:
    """Pravougaonik u kojem stoji jedan proizvod, u udelima platna."""

    x: float
    y: float
    w: float
    h: float


@dataclass(frozen=True)
class Zid:
    """
    Zid proizvoda — proizvodi POPUNJAVAJU kadar, umesto da stoje u njemu.

    ZAŠTO ZID, A NE JEDAN RED: kartica je 14:5, a tekst joj uzima levu trećinu,
    pa je pojas za proizvode odnosa oko 1,6:1. Pet mašina jedna do druge u tom
    pojasu, sve iste visine, traži pojas odnosa 6,4:1 — visina im zato ispadne
    četvrtina kartice i ostatak je prazna ploča. To se ne popravlja izborom
    mašina ni razmakom: jedan red u ovako širokom kadru je uvek nizak.

    Zato se proizvodi slažu u VIŠE REDOVA: svaki red se razvuče preko celog
    pojasa (širina mu je time popunjena do ivice), a redovi jedan preko drugog
    popune i visinu. Isti broj proizvoda u dva reda je dvostruko krupniji nego u
    jednom, a kartica nema praznog hoda — što je i bila poenta.

    Unutar reda su svi proizvodi ISTE VISINE i na istoj liniji, poređani od
    najšireg ka najužem; širine ostaju prirodne, jer plug jeste širi od cepača.
    """

    slike: tuple[str, ...]
    #: Pojas u kojem zid stoji — udeli širine platna. Počinje odmah iza teksta
    #: (`Ulaz` u `Hero.tsx` drži tekst na 42% širine kartice), sa uskim
    #: vazduhom između: tekst i prvi proizvod se ne smeju dodirivati ni kad se
    #: opis prelomi u dva reda. Desno ide do same ivice — kadar se popunjava.
    od: float = 0.425
    do: float = 0.995
    #: Gornja i donja granica zida (udeli visine platna).
    gore: float = 0.045
    dole: float = 0.965
    #: Razmaci: vodoravno između suseda u redu, uspravno između redova.
    razmak_x: float = 0.009
    razmak_y: float = 0.02
    #: Više od tri reda na kartici visokoj 500px daje sličice, ma kako se složile.
    najvise_redova: int = 3
    #: Najmanji dozvoljeni odnos visine najnižeg i najvišeg reda. Bez ovoga
    #: pretraga bira podelu sa dva ogromna komada gore i četiri sitna dole: ona
    #: pokriva NEŠTO veću površinu, ali vraća tačno ono zbog čega je stari
    #: raspored i menjan — proizvode dve različite veličine u istom kadru.
    #: 0,85 je granica na kojoj se razlika između redova još ne primeti.
    ravnoteza: float = 0.85


def slozi_zid(
    zid: Zid, velicina: tuple[int, int], isecci: list[Image.Image]
) -> list[tuple[Image.Image, tuple[int, int]]]:
    """
    Raspoređuje proizvode u redove tako da POKRIJU što veći deo kadra.

    Visina reda je određena njegovim sadržajem: red čiji zbir odnosa stranica
    iznosi `S` popunjava pojas širine `W` tek pri visini `W / S`. Zato podela na
    redove nije ukras nego jedina promenljiva — ista mašina u redu sa tri široka
    komada ispadne upola niža nego u redu sa dva.

    Zbog toga se podela ne bira ručno nego se PROBAJU SVE: za jedan, dva i tri
    reda, svaki raspored proizvoda po redovima, i uzima se onaj sa najvećom
    ukupnom površinom proizvoda. Kombinacija je najviše 3^n (za šest komada 729),
    pa je pretraga trenutna, a mera je tačno ono što se traži — najmanje
    praznine. Uravnoteženu podelu ne treba posebno tražiti: red sa jednim
    ogromnim komadom pokriva manju površinu od dva puna reda, pa sam ispadne.
    """
    sirina, visina = velicina
    W = (zid.do - zid.od) * sirina
    V = (zid.dole - zid.gore) * visina
    rx = zid.razmak_x * sirina
    ry = zid.razmak_y * visina
    odnosi = [i.width / i.height for i in isecci]
    n = len(isecci)

    def izmeri(grupe: list[list[int]]) -> tuple[float, list[float]]:
        """Visine redova i pokrivena površina za jednu podelu."""
        visine = [
            (W - rx * (len(g) - 1)) / sum(odnosi[i] for i in g) for g in grupe
        ]
        prostor = V - ry * (len(grupe) - 1)
        # Kad zbir prirodnih visina prebaci kadar, ceo zid se srazmerno smanji —
        # redovi tada ne dodiruju ivice, ali ništa ne ispada iz kadra.
        umanji = min(1.0, prostor / sum(visine))
        visine = [h * umanji for h in visine]
        povrsina = sum(
            sum(odnosi[i] for i in g) * h * h for g, h in zip(grupe, visine)
        )
        return povrsina, visine

    najbolje: tuple[float, list[list[int]], list[float]] | None = None
    for redova in range(1, min(zid.najvise_redova, n) + 1):
        for raspored in product(range(redova), repeat=n):
            # Prvi proizvod uvek u prvom redu — redovi su međusobno zamenljivi,
            # pa bi se inače svaka podela izbrojala `redova!` puta.
            if raspored[0] != 0 or len(set(raspored)) != redova:
                continue
            grupe = [[i for i, r in enumerate(raspored) if r == red] for red in range(redova)]
            povrsina, visine = izmeri(grupe)
            if min(visine) < zid.ravnoteza * max(visine):
                continue
            if najbolje is None or povrsina > najbolje[0]:
                najbolje = (povrsina, grupe, visine)

    assert najbolje is not None
    _, grupe, visine = najbolje

    # Viši red ide gore: krupniji proizvodi na vrhu drže kompoziciju kao naslov
    # reda, a niži ispod njih deluje kao nastavak, ne kao zasebna kartica.
    poredak = sorted(range(len(grupe)), key=lambda r: -visine[r])
    ukupno_v = sum(visine) + ry * (len(grupe) - 1)
    y = zid.gore * visina + (V - ukupno_v) / 2

    postavljeni: list[tuple[Image.Image, tuple[int, int]]] = []
    for r in poredak:
        h = max(1, round(visine[r]))
        grupa = sorted(grupe[r], key=lambda i: -odnosi[i])
        sirine = [max(1, round(visine[r] * odnosi[i])) for i in grupa]
        x = zid.od * sirina + (W - (sum(sirine) + rx * (len(grupa) - 1))) / 2
        for i, w in zip(grupa, sirine):
            postavljeni.append((isecci[i].resize((w, h), Image.LANCZOS), (round(x), round(y))))
            x += w + rx
        y += visine[r] + ry
    return postavljeni


@dataclass(frozen=True)
class Kadar:
    naziv: str
    izlaz: str
    #: (putanja do fotografije, mesto u kadru) — redom kojim se crtaju.
    stavke: tuple[tuple[str, Mesto], ...] = ()
    #: Zid proizvoda — alternativa `stavke`, vidi `Zid`.
    zid: Zid | None = None
    #: Senka ispod proizvoda — predmet time stoji na ploči umesto da lebdi.
    #: Važi i za crteže: posle `ocelici()` to više nije bleda linija na papiru
    #: nego pun komad lima, pa mu senka pripada kao i fotografiji.
    senke: bool = True
    #: Izvori su tehnički crteži, ne fotografije — vidi `ocelici`.
    crtezi: bool = False
    #: Platno i podloga: hero kadrovi su 14:5 na metalnoj ploči, mreže za
    #: kategorijske kartice 16:10 na goloj beloj (kao susedne ručne kartice).
    platno: tuple[int, int] = PLATNO
    bela_podloga: bool = False
    #: Vodoravno centriranje i po visini (mreža), umesto „na dno police" (hero).
    centriraj: bool = False


# Sve tri kartice nose ISTI zid (vidi `Zid`) — ista građa, pa se red kartica
# čita kao jedna stvar, a ne kao tri različita plakata.
#
# ŠTA ULAZI U ZID: po jedan predstavnik svake PODELE unutar vrste, nikad dva
# ista tipa. Kartica tako sa jednog pogleda kaže koliko je iza klika široka
# ponuda — šest različitih silueta govori „katalog", šest malčera bi govorilo
# „jedan artikal u šest veličina".
#
# KOLIKO IH IDE: toliko da se kadar popuni, ne više. Mašine su uske i staju u
# dva reda po tri; prikolice su skoro tri puta šire nego više, pa ih četiri u
# dva reda po dve popune isti kadar — peta bi sve ostale smanjila za četvrtinu
# i vratila prazninu koju zid i treba da ukloni.
#
# Mašine idu preko sve tri grane, jer to i piše na kartici („za njivu, šumu i
# gradilište"): plug, malčer, freza i rasipač sa njive, cepač iz šume, mini
# bager sa gradilišta.
#
# Delovi su crteži za plugove, svaki drugi tip: raonik, kratki plaz, daska,
# grudi daske i daska predplužnjaka. Fotografije se ovde ne koriste — nose
# poluprovidan ROLLAND žig koji na ovoj veličini ostaje čitljiv.
#
# NISU SVI CRTEŽI ISTE IZRADE: izvorni katalozi se razlikuju po tome kako kotiraju.
# Jedni imaju nekoliko krupnih, podebljanih mera (440, 240, 490), drugi po šest
# sitnih i tankih preko celog komada. Na kartici visokoj 150px sitna kota je
# šum — vidi se da nešto piše, ne šta — pa ovde idu isključivo crteži prve vrste.
#
# Prikolice su četiri različita programa (Cargo, Marine, Light, Craft), a ne
# četiri nosivosti istog sanduka. Iz svakog se bira najuspravniji model: box sa
# stranicama i Craft sa rampama drže zid viši nego ravne platforme.
#
# Plave Rolland mašine su skinute sa sajta, pa ih ovde nema.
KADROVI = (
    Kadar(
        naziv="mašine",
        izlaz="masine.jpg",
        zid=Zid(
            slike=(
                "masine/hofman/plug-nero.jpg",
                "masine/hofman/malcer-g-line.jpg",
                "masine/hofman/freza-viva.jpg",
                "masine/hofman/rasipac-dubriva-fero.jpg",
                "masine/hofman/mini-bager-suki.jpg",
                "masine/hofman/cepac-drva-rex-kardanski-pogon.jpg",
            ),
        ),
    ),
    Kadar(
        naziv="delovi",
        izlaz="delovi.jpg",
        zid=Zid(
            slike=(
                "plugovi/3802.jpg",
                "plugovi/2020.jpg",
                "plugovi/4663.jpg",
                "plugovi/1957.jpg",
                "plugovi/4747.jpg",
            ),
        ),
        crtezi=True,
    ),
    Kadar(
        naziv="auto-prikolice",
        izlaz="prikolice.jpg",
        zid=Zid(
            slike=(
                "prikolice/cargo-2617.jpg",
                "prikolice/marine-750.jpg",
                "prikolice/light-20-box.jpg",
                "prikolice/craft-3016-2-7.jpg",
            ),
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

    prelaz = (np.clip((ty - POD_OD) / (1.0 - POD_OD), 0.0, 1.0) ** 1.6)[:, :, None]
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


def ocelici(crtez: Image.Image) -> Image.Image:
    """
    Tehnički crtež → komad čelika na ploči.

    Tri stvari, svaka rešava jedan razlog zbog kojeg je crtež bio bled:
      * puna neprozirnost — ploča više ne prosijava kroz telo crteža;
      * spuštanje tona — telo sa 210 pada na oko 170, pa ima gde da se vidi
        razlika prema ploči (211–253) i u donjem, tamnijem pojasu kartice;
      * uspravni prelaz — gore svetlije, dole tamnije: ravna siva popuna izgleda
        kao papir, isti taj ton sa prelazom izgleda kao lim.
    """
    piksure = np.asarray(crtez, dtype=np.float32)
    boja = piksure[:, :, :3]

    razlika = 255.0 - boja.min(axis=2)
    alfa = np.clip((razlika - CRTEZ_PRAG) * CRTEZ_NAGIB, 0.0, 255.0)

    visina = boja.shape[0]
    prelaz = np.linspace(-1.0, 1.0, visina, dtype=np.float32)[:, None, None]
    boja = boja * (CRTEZ_TON - CRTEZ_PRELAZ * prelaz)

    return Image.fromarray(
        np.clip(np.dstack([boja, alfa]), 0, 255).astype(np.uint8), "RGBA"
    )


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

    if kadar.zid:
        isecci = []
        for rel in kadar.zid.slike:
            izvor = KOREN / "public" / "images" / rel
            if not izvor.exists():
                raise SystemExit(f"nedostaje: {izvor}")
            isecak = izrezi(izvor)
            isecci.append(ocelici(isecak) if kadar.crtezi else isecak)

        for proizvod, mesto in slozi_zid(kadar.zid, velicina, isecci):
            if kadar.senke:
                platno.paste(crno, (0, 0), senka(proizvod, velicina, mesto))
            platno.paste(proizvod, mesto, proizvod)
        return platno

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
