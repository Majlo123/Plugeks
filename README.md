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
│   │                               # Akcije, Galerija, Reference, KontaktCTA, TrustStats
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

Pre objave: u `src/app/layout.tsx` i `sitemap.ts`/`robots.ts` proveri da je domen `https://plugeks.rs` tačan.

---

## ☁️ Objava (kasnije)

Najlakše preko [Vercel](https://vercel.com) (kreator Next.js-a): povežeš repozitorijum
i sajt je online. Radi i na svakom hostingu koji podržava Node.js (`npm run build` + `npm run start`).

---

© PlugekS — Napredna poljoprivreda.
