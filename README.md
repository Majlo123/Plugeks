# PlugekS — premium vebsajt

Marketinški vebsajt za **PlugekS** (uvoz i prodaja poljoprivredne mehanizacije, Žabalj).
Napravljen za maksimalnu konverziju: brz, mobile-first, sa jasnim pozivima na akciju
(poziv, WhatsApp/Viber, „Zatraži ponudu"), optimizovan za lokalni SEO.

> Slogan: **„Napredna poljoprivreda"**

---

## 🚀 Pokretanje (lokalno)

Potreban je **Node.js 18.18+** (preporuka: Node 20+).

```bash
npm install
npm run dev
```

Otvori **http://localhost:3000** u pregledaču.

Ostale komande:

```bash
npm run build   # produkcijski build
npm run start   # pokretanje produkcijskog builda (posle build-a)
npm run lint    # provera koda
```

---

## 🧱 Tehnologija

- **Next.js 14** (App Router) + **TypeScript** — statički render za SEO + moderne interakcije
- **Tailwind CSS** — dizajn sistem i stilizovanje
- **Framer Motion** — suptilne animacije i reveal-on-scroll
- **lucide-react** — ikonice
- shadcn-stil UI komponente (ručno pisane u `src/components/ui` — bez eksternih zavisnosti/ključeva)

Sajt radi **100% lokalno**, bez ikakvih API ključeva.

---

## 📁 Struktura projekta

```
src/
├── app/
│   ├── layout.tsx                  # fontovi, SEO meta, LocalBusiness JSON-LD, Header/Footer
│   ├── page.tsx                    # POČETNA (svi glavni blokovi)
│   ├── globals.css                 # dizajn tokeni + Tailwind
│   ├── proizvodi/                  # filtrabilni katalog
│   ├── subvencije-i-finansiranje/  # edukativna stranica (visoka kupovna namera)
│   ├── o-nama/                     # priča o firmi
│   ├── kontakt/                    # forma + mapa + click-to-chat
│   ├── icon.svg, robots.ts, sitemap.ts, not-found.tsx
├── components/
│   ├── ui/                         # Button, Card, Badge, Input, MediaPlaceholder, SectionHeading
│   ├── layout/                     # Header (sticky), Footer
│   ├── sections/                   # Hero, ZastoMi, Kategorije, ProizvodiPreview,
│   │                               # DeloviPreview, Akcije, Galerija, Reference,
│   │                               # KontaktCTA, TrustStats
│   ├── ProductCard.tsx, QuoteForm.tsx, PageHeader.tsx, FloatingContact.tsx, Reveal.tsx, Logo.tsx
└── lib/
    ├── site.ts                     # ⭐ KONTAKT/NAP podaci — jedan izvor istine
    ├── data.ts                     # ⭐ proizvodi, kategorije, utisci, prednosti, FAQ
    └── utils.ts                    # cn() helper
```

---

## ✏️ Gde ubaciti prave podatke

Sve što klijent najčešće menja je na **dva mesta**:

### 1) Kontakt podaci, adresa, mreže → `src/lib/site.ts`
Telefon, email, adresa, radno vreme, linkovi ka Facebook/Instagram, koordinate za mapu.
Promena ovde se odražava na **celom sajtu** (header, footer, dugmad, JSON-LD).

### 2) Proizvodi, kategorije, utisci, prednosti, FAQ → `src/lib/data.ts`
- `products` — nazivi, specifikacije, opisi, oznake („Akcija", „Najprodavanije")
- `categories` — kategorije asortimana
- `testimonials` — utisci kupaca (preporuka: iskoristi fotografije isporuka)
- `stats` — brojke poverenja (godine iskustva, broj mašina…)
- `advantages` — „Zašto PlugekS"
- `subvencijeFaq` — pitanja i odgovori o subvencijama/ratama

> Sva mesta koja treba proveriti/zameniti označena su komentarom `// ZAMENI: ...`

### 3) Katalog sa rolland.pl → `npm run catalog`

Katalog na `/proizvodi` ima tri dela:

| Deo | Izvor | Fajl |
| --- | --- | --- |
| Mašine (87) | Rolland (12) + Hofman, `npm run masine` (odeljak 8) | `src/data/machines.json` |
| Auto-prikolice (65) + oprema (116) | Vesta, `npm run prikolice` (odeljak 6) | `src/data/trailers.json` |
| Rezervni delovi (4.644) | Rolland | `src/data/parts.json` |

Rolland deo se generiše iz njihovog `sitemap.xml` — jedine stranice koja nije iza
anti-bot zaštite. Osvežavanje:

```bash
curl -o data/rolland-sitemap.xml https://www.rolland.pl/sitemap.xml
npm run catalog
```

Skripta iz URL-ova izvlači tip dela, brend mašine, kataloški broj i stranu
ugradnje, i sve prevodi na srpski. **Prevode, brendove i nazive mašina menjaš u
`scripts/rolland-dictionary.mjs`** — ako skripta prijavi „neprepoznati tipovi
delova", dodaj ih u `PART_TYPES` i pokreni ponovo.

Delovi se u pretraživač učitavaju tek kad korisnik izabere „Rezervni delovi",
pa `parts.json` ne opterećuje početno učitavanje stranice.

### 4) Fotografije proizvoda → `npm run slike`

rolland.pl blokira automatski pristup HTML stranicama (403 „bot challenge"), ali
putanja `/uploads/...` nije zaštićena — slike se skidaju normalno. Fali samo
spisak adresa, koji postoji jedino u HTML-u kategorija. Zato:

1. Otvori kategoriju na rolland.pl **u svom pretraživaču**
2. `Ctrl+S` → sačuvaj kao „Web stranica, samo HTML" u `data/rolland-pages/`
3. Ponovi za ostale kategorije i strane paginacije
4. `npm run slike`

Skripta iz sačuvanog HTML-a izvlači sve adrese oblika
`/uploads/produkt/{godina}/{mesec}/{id}-{slug}-0-4.jpg`, skida ih u
`public/images/rolland/` i piše mapu `src/data/images.json` (id → putanja).
Katalog automatski koristi pravu sliku kad postoji. Ponovno pokretanje je
bezbedno — već preuzete slike se preskaču.

> **Vodeni žig:** fotografije *delova* na rolland.pl imaju veliki ROLLAND žig
> preko samog proizvoda, pa ga nije moguće ukloniti bez vidnog oštećenja slike.
> Fotografije *mašina* su čiste. Za čiste slike delova traži media paket od
> Rollanda — kao distributer ih dobijaš na zahtev.
>
> Te slike se **od sad indeksiraju u Google Images** (odluka vlasnika sajta):
> `X-Robots-Tag: noindex` je uklonjen iz `next.config.mjs` i sve ulaze u
> `image-sitemap.xml`. Kad stigne media paket, zameni fajlove pod istim imenom —
> ništa drugo ne treba dirati.

### 5) Delovi za plugove + najtraženiji delovi → `npm run plugovi`

Molbro program potrošnih delova za plugove (Kverneland, Lemken, Kuhn, Överum,
Vogel & Noot, Regent, Rabe, Pöttinger) prikazan je na `agritechnicom.co.rs` sa
**čistim tehničkim crtežima bez žiga** i OEM kataloškim brojem u naslovu. Naši
nazivi iz Rolland kataloga nose iste brojeve, samo drugačije formatirane
(`344 4012` ↔ `3444012`), pa se slika i proizvod povezuju automatski:

```bash
npm run plugovi              # skini + poveži + upiši
npm run plugovi -- --dry --report   # samo izveštaj, ništa se ne upisuje
```

Skripta piše dva fajla:

| Fajl | Šta je unutra |
| --- | --- |
| `public/images/plugovi/{id}.jpg` + `src/data/images.json` | 195 crteža; gde je postojala Rolland slika sa žigom, ona je zamenjena |
| `src/data/popular.json` | **najtraženiji delovi** — po jedan komad za svaku kombinaciju brend + tip |

`popular.json` je mali fajl (24 stavke) pa se sme uvesti i u klijentski bundle —
koriste ga sekcija „Najtraženiji delovi" na početnoj (`DeloviPreview`) i katalog
na `/proizvodi` **pre filtriranja** (prvi ekran i početni redosled rezultata).

Ako se njihov spisak promeni, `--report` ispiše koje naslove nismo uspeli da
povežemo (najčešće zato što taj kataloški broj ne postoji u našem katalogu).

### 6) Auto-prikolice → `npm run prikolice`

Treća vrsta u katalogu (uz mašine i delove) su auto-prikolice Vesta — **ceo
program, svih 8 serija**, plus dodatna oprema:

| Serija | Šta je | Modela |
| --- | --- | ---: |
| UNO | osnovna prikolica sa stranicama | 1 |
| LIGHT | otvorena prikolica do 750 kg | 21 |
| PLATO | platforma bez stranica | 15 |
| CARGO | veća prikolica sa kočnicom | 8 |
| TRANSPORTER | za prevoz vozila, sa rampama | 6 |
| CRAFT | za građevinske mašine, sa rampama | 3 |
| MARINE | za plovila | 8 |
| MOTO | za motocikle | 3 |
| **Dodatna oprema** | cerade, stranice, čekrci, točkovi, kip mehanizmi… | **116** |

```bash
npm run prikolice     # 1) podaci + sirovi originali u data/vesta-originals/
npm run slike:kadar   # 2) slike za sajt u public/images/prikolice/
```

Drugi korak je obavezan. Sirove fotografije sa izvora dolaze u **50 različitih
formata** (od 157x73 do 2560x1696) i sa **25–100% praznine u kadru**, pa bi u
mreži kartica jedna prikolica ispunila karticu, a druga plutala kao tačka.
`scripts/normalize_product_images.py` (Pillow) iseca belu marginu, skalira
proizvod na isti udeo kadra i centrira ga na belom platnu **1200x750** (16:10,
isti odnos kao kartica) — vidi odeljak 7. Tri fotografije opreme ostaju mekše
jer im je original sitan; skripta ih prijavi na kraju.

Podaci: spisak se čita iz `product-sitemap`-a, **ne iz liste kategorija** — njihova
paginacija je polomljena (LIGHT strane 3 i 4 vraćaju 404, pa se kroz sajt vidi
12 od 21 modela). Tehnički podaci i fotografije dolaze iz JSON-LD-a svake
stranice proizvoda.

Skripta piše:

| Fajl | Šta je unutra |
| --- | --- |
| `src/data/trailers.json` | 181 stavka — naziv, fasete (tip / program / masa / osovine) i fabrička specifikacija |
| `data/vesta-originals/{slug}.jpg` | sirova fotografija sa izvora (gitignored) |
| `public/images/prikolice/{slug}.jpg` | normalizovana slika za sajt, 1200x750 |

Kataloški brojevi kreću od **9001** za prikolice i **9501** za opremu (Rolland
program staje na 4790), pa se ne sudaraju sa postojećim proizvodima. Fotografije
se imenuju po slug-u sa izvora, a ne po kataloškom broju — tako novi model, koji
pomera id-eve, ne pomeša slike sa proizvodima.

Skripta usput čisti zaostatke sa izvora: `-copy` slugove (WordPress kopije),
dva ručno navedena duplikata i stavke koje su identične po nazivu, opisu i
fotografiji. Ono što i posle toga deli naziv su stvarno različiti komadi, pa
dobijaju sufiks `(varijanta 2)`.

Šta skripta **namerno ne prenosi**:

- **cene** — PlugekS radi po upitu, pa bi tuđi cenovnik bio netačan;
- **marketinški tekst uz prikolice** — opis svakog modela se sastavlja iz njegove
  specifikacije, u `trailerDescription()` (`src/lib/products.ts`);
- **specifikaciju uz opremu** — fabrički atributi tamo opisuju *prikolicu na koju
  komad ide* (nosivost, broj osovina), pa bi tabela zavarala. Oprema zato nosi
  samo svoj tehnički opis (`note`) — marku, nosivost i materijal.

> **Vozačka kategorija:** prikolice idu od 500 do 3500 kg. Tvrdnja „vuče se sa B
> kategorijom" se ispisuje **samo** do 750 kg; preko toga opis traži B+E (ili
> B96) i upućuje na proveru dozvoljene mase skupa. Ako se granica menja, to je
> `B_KATEGORIJA` u `src/lib/products.ts`.

> **Fotografije** su proizvođačeve, čiste i bez žiga, ali su i dalje tuđe.
> Ranije su išle sa `X-Robots-Tag: noindex`; ta zabrana je uklonjena odlukom
> vlasnika sajta, pa `/images/prikolice/` sada ulazi u `image-sitemap.xml` i
> indeksira se u Google Images. Kad dobiješ svoje fotografije, zameni fajlove
> pod istim imenom.

### 7) Kadar fotografija proizvoda → `npm run slike:kadar`

Kartica proizvoda prikazuje sliku sa `object-cover`, dakle **opseca sve što ne
staje u njen odnos stranica**. Izvorne fotografije to ne poštuju:

| Folder | Original | Problem |
| --- | --- | --- |
| `public/images/rolland/` | 472x630 i 599x800, **uspravno** | kartica dela je bila položena — pola dela je odlazilo van kadra |
| `public/images/plugovi/` | kvadrat 440x440, sadržaj od 32% do 95% kadra | crteži različite veličine u istoj mreži |
| `public/images/prikolice/` | 50 formata, od 157x73 do 2560x1696 | jedna prikolica ispuni karticu, druga pluta kao tačka |
| `public/images/masine/hofman/` | 750x500 `.webp` | drugi odnos od kartice mašine (16:10) |

```bash
npm run slike:kadar                  # sve
npm run slike:kadar -- delovi        # samo jedan posao
npm run slike:kadar -- --dry         # samo izveštaj
npm run masine:slike                 # isto, samo posao „masine"
```

Skripta ne opseca nego radi suprotno: iseče proizvod iz bele pozadine, skalira
ga na **uvek isti udeo kadra** i centrira na belom platnu tačnog odnosa
(delovi **600x600**, prikolice **1200x750**). Tada `object-cover` nema šta da
opseče. Kartica dela je zato i prešla sa 4:3 na kvadrat — sadržaj Rolland
fotografija je posle opsecanja bele u proseku kvadratan (medijana odnosa 0,97).

Slika koja je već u ciljnom formatu se **preskoči**, pa ponovljeno pokretanje ne
gubi kvalitet na ponovnom JPEG kodiranju. Pokreće se **posle**
`build_product_images.py`, jer taj upisuje sirove originale.

Rolland fotografije usput gube i **ROLLAND zaglavlje** — traku sa logom iznad
samog dela, koja je uzimala oko četvrtine kadra. Traži se povezana celina koja
je cela iznad proizvoda i u gornjoj trećini kadra; ako je nema, slika se ne
dira. Poluprovidni **žig preko samog dela ostaje**.

> **Šta skripta ne dira:** boje i `public/images/masine/` — te su ručno
> pripremljene i već su tačno 900x563 (16:10). Kad dobiješ media paket bez žiga,
> ubaci fajlove u `data/rolland-originals/` i pokreni `npm run slike:kadar`.

---

### 8) Mašine sa hofman.at → `npm run masine`

Ponuda mašina je podeljena na tri **grane** — poljoprivredne, šumske i
građevinske. `/masine` nudi SAMO te tri kartice; tip mašine se bira unutar grane
(`/masine/grana/[grana]`), model tek onda. Dublje se ne ide.

> Grana mora da bude prvi korak. Kad su svi tipovi stajali na jednoj strani,
> trinaest poljoprivrednih je zauzimalo četiri reda, pa se do šumskih i
> građevinskih dolazilo skrolovanjem — i delovalo je kao da ih nema.

| Grana | Tipova | Mašina |
| --- | --- | --- |
| Poljoprivredne | 13 | tanjirače, agregati, podrivači, valjci (Rolland) + plugovi, malčeri, kosačice, balirke, sejalice, prskalice, prikolice, mešaone, baštenske mašine, tegovi |
| Šumske | 5 | cepači drva, iverači, kružne pile, šumske prikolice, klešta i priključci |
| Građevinske | 3 | mini bageri, mini utovarivači, mini dumperi |

```bash
npm run masine          # 1) podaci + sirovi originali u data/hofman-originals/
npm run masine:slike    # 2) slike za sajt u public/images/masine/hofman/
```

Prvi korak obiđe kategorije na hofman.at (hrvatska verzija — najbliža srpskom),
siđe do stranica pojedinačnih mašina, pa u drugom prolazu pokupi **tabele
tehničkih podataka sa slovenačke verzije** i upiše `src/data/machines.json`,
`src/data/machine-groups.json` i `src/data/machine-images.json`. Stranice i
slike se keširaju u `data/hofman-cache/`, pa je ponovno pokretanje besplatno;
`npm run masine -- --stablo` samo ispiše šta bi uvezao, bez upisa, a
`-- --osvezi` baci keš.

> **Nazivi se NE preuzimaju sa izvora.** Njihov prevod je mašinski i mestimično
> pogrešan („Četkice" za cepače drva, „Kružne stepenice" za tanjirače,
> „Friziraj" za freze) — a to su reči po kojima nas kupac traži. Zato su naše
> imenice upisane u tabelu `IZVOR` u `scripts/import-hofman.mjs`; sa izvora se
> uzima samo fabrička oznaka modela (JASA, ARGA, G LINE). **Nova kategorija na
> izvoru = novi red u toj tabeli**, inače se preskoči.

> **Komunalna mehanizacija se ne uvozi** (nije u ponudi). Baštenske mašine
> (izvorno „GARDEN MACHINES") su tip unutar poljoprivrednih, ne zasebna grana.

> **Tabele tehničkih podataka dolaze sa `/si/`, a sve ostalo sa `/hr/`.** Na
> hrvatskim (i engleskim, i nemačkim) stranicama je `<tbody>` tabele prazan — i
> u serverskom HTML-u i posle izvršavanja JavaScript-a. Popunjena je jedino
> slovenačka verzija. Spona između dve verzije je putanja naslovne fotografije,
> koja je ista na svim jezicima (slug-ovi su prevedeni pa se ne poklapaju).
> Nazivi redova se prevode preko tabele `OSOBINE` u skripti; ono što u njoj ne
> postoji ostaje neprevedeno i skripta ga na kraju ISPIŠE, pa se nova osobina
> odmah vidi. Trenutno 69 od 75 mašina ima tabelu.

> **Jedinice.** Izvor je nedosledan: kod jednih tabela jedinica je u vrednosti
> („535 kg"), kod drugih samo u nazivu reda („Višina (cm)" → „76"). Skripta
> zato jedinicu drži UZ NAZIV i skida je iz vrednosti kad se duplira; kad
> vrednost nosi svoju, drugačiju jedinicu (izvor ume da napiše „Širina (cm)" pa
> vrednosti u metrima), naziv ostaje bez oznake — vrednost je merodavna.
> „KM" (slovenačka konjska moč) se prevodi u „KS", inače bi se na srpskom
> pročitalo kao kilometri.

Tabela stoji na stranici proizvoda **desno od fotografije, na mestu opisa**
(`src/components/TabelaModela.tsx`): na ekranu kao matrica (redovi = osobine,
kolone = izvedbe), **na telefonu kao zaseban blok za svaki model** — šest
kolona u 350px se ne čita, a bočno skrolovanje odnese naziv reda.

Mašina koja ima tabelu NE prikazuje opis: kod tih mašina je opis sastavljen
automatski i kupcu ne kaže ništa što već ne vidi iz naziva. Opis i dalje ide u
`<meta description>` i u structured data. Rolland mašine (ručno pisan opis) i
onih šest Hofman mašina bez tabele zadržavaju opis — kod njih je to jedini
tekst na stranici.

> **Vrednosti se čiste.** Kroz izvorov automatski prevodilac je prošao i sadržaj
> ćelija, pa u njima ima ostataka njihovog CMS-a (`Besedilo:` = slovenački
> „tekst") i grešaka prevoda — „CAT I" (kategorija priključka) je negde postalo
> „MAČKA I", jer je prevodilac pročitao mačku. Lista `POPRAVKE` u skripti to
> ispravlja i ujednačava (CAT/KAT/MAČKA → CAT, `hidravli` → `hidrauli`,
> `zavore` → `kočnice`).

> **Fotografije** su Hofmanove, čiste i na beloj podlozi — isti dogovor kao sa
> Rolland i Vesta slikama. Kad dobiješ svoje, zameni fajl istog imena u
> `public/images/masine/hofman/`.

### 9) Redosled proizvoda u listama → `src/lib/redosled.ts`

Jedno pravilo za **svaku** listu (katalog, kategorijske strane, kataloški
indeks, „slični proizvodi"), po važnosti:

1. **Obični delovi pre predplužnjakovih.** Katalog ima 212 raonika i 185 dasaka
   koji su zapravo delovi predplužnjaka. Kupac koji otvori „Raonik" traži veliki
   raonik, pa sitni ide na dno.
2. **Crteži pre fotografija pre praznog.** Sivi tehnički crtež
   (`/images/plugovi/`) je za deo najkorisniji vizual — vidi se oblik i mere;
   red bez ikakve slike je najslabija kartica u mreži i ne sme da drži vrh.

Sortiranje je stabilno, pa unutar istog ranga ostaje zatečeni redosled — kuracija
najtraženijih delova na prvom ekranu kataloga se ne pomera.

### 10) Nabavne cene prikolica → `/admin`

Interni deo sajta, samo za vlasnika. Podesi promenljivu okruženja:

```
ADMIN_LOZINKA=nekaDugackaLozinka
```

(Vercel → Settings → Environment Variables; lokalno u `.env.local`.) Bez nje je
`/admin` zaključan za sve — nema podrazumevane lozinke.

Cene se unose u `src/data/trailer-prices.json`:

```json
{ "valuta": "EUR", "cene": { "9001": 1180, "9002": 1340 } }
```

Ključ je kataloški broj iz kolone „Šifra" na `/admin/cene`.

> **Zašto cene nisu na stranici proizvoda:** sve stranice proizvoda su unapred
> izgenerisan statični HTML (~4.900 komada). Cena upisana u takvu stranicu bi
> završila u javnom HTML-u, u kešu i u Google-ovom indeksu. `/admin/cene` se
> zato računa pri svakom zahtevu i vraća prazno svakome ko nije prijavljen.


## 🖼️ Slike — mockup je već ubačen

U `public/images/` se **već nalaze mockup fotografije** (traktori, malčeri, freze,
utovarivači, priključci, isporuke) da sajt odmah izgleda kompletno. To su slike sa
**Wikimedia Commons** (slobodna licenca), namenjene kao privremeni vizual.

> ⚠️ Pre objave zameni ih **svojim** fotografijama proizvoda i isporuka radi
> autentičnosti i brenda.

**Najlakša zamena — zadrži isto ime fajla:** samo prepiši npr.
`public/images/malceri.jpg` svojom slikom i to je sve (nigde ne diraš kod).

Mapiranje (koja slika gde ide):

| Fajl | Gde se koristi |
|------|----------------|
| `hero.jpg` | velika slika na vrhu početne |
| `malceri.jpg`, `freze.jpg`, `utovarivaci.jpg`, `traktori.jpg`, `prikljucne.jpg`, `delovi.jpg` | kategorije + kartice proizvoda te kategorije |
| `galerija-1/2/3.jpg` | sekcija „Mašine u radu" + ostala mesta |
| `cta.jpg` | pozadina završne CTA trake |
| `about.jpg` | zaglavlje stranice „O nama" |

Putanje slika za kategorije/proizvode menjaš u [src/lib/data.ts](src/lib/data.ts)
(`image` polje), a po potrebi i direktno u sekcijama (`src="/images/..."`).

Komponenta `MediaPlaceholder` prima `src` i renderuje `next/image` (`fill`, `object-cover`);
ako `src` izostane, prikazuje brendirani gradijent kao fallback.

**Hero video:** u `src/components/sections/Hero.tsx` zameni pozadinski `MediaPlaceholder`
sa `<video autoPlay muted loop playsInline>` ili `next/image`.

**Reels / društvene mreže:** u `src/components/sections/Galerija.tsx` možeš ubaciti
zvanični Instagram/Facebook embed (`<iframe>` sa permalink-a posta) umesto placeholdera.

**OG slika (deljenje na mrežama):** stavi `public/og.jpg` (1200×630).

---

## 📨 Povezivanje forme „Zatraži ponudu" sa email-om / CRM-om

Forma (`src/components/QuoteForm.tsx`) sada **validira** unos i prikazuje poruku o uspehu,
ali **ne šalje** podatke (radi lokalno bez servera). Da je povežeš:

1. Napravi API rutu `src/app/api/upit/route.ts` (POST) koja šalje email
   (npr. [Resend](https://resend.com) ili Nodemailer) ili upisuje u CRM.
2. U `QuoteForm.tsx`, u `handleSubmit`, zameni simulaciju sa stvarnim pozivom:

```ts
await fetch("/api/upit", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ ime, telefon, proizvod, poruka }),
});
```

---

## 🔍 SEO — već podešeno

- Semantički HTML, meta naslovi/opisi na srpskom sa ključnim rečima
- **Open Graph** + Twitter kartice za lepo deljenje na FB/IG
- **JSON-LD**: `Store`/`LocalBusiness`, `WebSite` + `SearchAction` (polje za
  pretragu u Google rezultatu), `Product`, `BreadcrumbList`, `ItemList`, `FAQPage`
- `sitemap.xml` i `robots.txt` (automatski generisani)
- **`image-sitemap.xml`** — sve fotografije proizvoda sa naslovom i natpisom,
  za Google Images (vidi `src/app/image-sitemap.xml/route.ts`)
- Kategorijske strane pisane za stvarne upite:
  - `/delovi/[tip]` — „raonik", „daska"…
  - `/delovi/brend/[marka]` — „delovi za Lemken"
  - `/delovi/[tip]/[marka]` — „raonik za Lemken plug"; generišu se samo
    kombinacije sa ≥ `MIN_ZA_UKRSTENU` delova (`src/lib/products.ts`)
  - `/katalog/[strana]` — interni link za svaki proizvod
- Pretraga u headeru (`HeaderSearch`) radi sa svake strane, po nazivu, marki i
  kataloškom broju
- Optimizovano za mobilne i brzinu (Core Web Vitals)

Pre objave: u `src/app/layout.tsx` i `sitemap.ts`/`robots.ts` proveri da je domen `https://plugeks.com` tačan.

---

## ✉️ Upiti sa forme „Zatraži ponudu"

Forma šalje POST na `/api/upit`, a ruta prosleđuje email preko [Resend](https://resend.com).
Bez podešenog `RESEND_API_KEY` forma korisniku javi grešku i uputi ga na telefon —
namerno, da se upiti nikad ne izgube tiho.

Podesi na Vercel-u (Settings → Environment Variables), pregled u `.env.example`:

| Promenljiva | Obavezno | Čemu služi |
| --- | --- | --- |
| `RESEND_API_KEY` | da | Ključ sa resend.com |
| `UPIT_TO` | ne | Gde stižu upiti (podrazumevano `site.email`) |
| `UPIT_FROM` | ne | Pošiljalac; traži verifikovan domen na Resend-u |

---

## ☁️ Objava (kasnije)

Najlakše preko [Vercel](https://vercel.com) (kreator Next.js-a): povežeš repozitorijum
i sajt je online. Radi i na svakom hostingu koji podržava Node.js (`npm run build` + `npm run start`).

---

© PlugekS — Napredna poljoprivreda.
