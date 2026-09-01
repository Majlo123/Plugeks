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

Katalog na `/proizvodi` ima dva dela:

| Deo | Izvor | Fajl |
| --- | --- | --- |
| Mašine (23) | `src/lib/data.ts` (PlugekS) + Rolland | `src/data/machines.json` |
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

---

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
- **JSON-LD `Store`/`LocalBusiness`** šema (naziv, adresa Žabalj, telefon, radno vreme, geo)
- `sitemap.xml` i `robots.txt` (automatski generisani)
- Optimizovano za mobilne i brzinu (Core Web Vitals)

Pre objave: u `src/app/layout.tsx` i `sitemap.ts`/`robots.ts` proveri da je domen `https://www.plugeks.com` tačan.

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
