import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Phone } from "lucide-react";
import { ListaProizvoda } from "@/components/ListaProizvoda";
import { KontaktCTA } from "@/components/sections/KontaktCTA";
import { Button } from "@/components/ui/button";
import { site } from "@/lib/site";
import {
  partBrands,
  getPartsByBrand,
  partTypes,
  partTypesForBrand,
  ukrstenaHref,
  katBrojeva,
} from "@/lib/products";
import { PutanjaJsonLd } from "@/components/PutanjaJsonLd";
import { SpisakJsonLd, PitanjaJsonLd, Pitanja } from "@/components/SpisakJsonLd";

/**
 * Delovi po marki pluga. „Lemken delovi", „raonik za Kverneland" i slično su
 * pretrage visoke namere — ko ih kuca, traži tačno ono što prodajemo. Statički
 * segment `brend` ima prednost nad `/delovi/[tip]`, pa nema sudara ruta.
 *
 * Stranica namerno nosi i tekst i strukturirane podatke: sam spisak linkova
 * Google čita kao „thin content" i takve strane po pravilu ostavlja u
 * „Discovered – currently not indexed".
 */

const MAX_NA_STRANI = 300;

const nadji = (kljuc: string) => partBrands().find((b) => b.key === kljuc);

/** „Raonik, daska i plaz" — nabrajanje sa „i" pred poslednjim. */
function nabroj(reci: string[]): string {
  if (reci.length <= 1) return reci[0] ?? "";
  return `${reci.slice(0, -1).join(", ")} i ${reci[reci.length - 1]}`;
}

/** Uvodni pasus se sastavlja iz stvarnog sadržaja kataloga za tu marku. */
function uvod(brendLabel: string, ukupno: number, tipovi: { label: string; count: number }[]) {
  const glavni = tipovi.slice(0, 4).map((t) => t.label.toLowerCase());
  // Tipovi se nabrajaju posle dvotačke, u nominativu — tako se izbegava
  // deklinacija naziva koji dolaze iz podataka („za daska" umesto „za dasku").
  return `U katalogu držimo ${katBrojeva(
    ukupno,
  )} potrošnih delova za plugove ${brendLabel}.${
    glavni.length ? ` Najzastupljeniji tipovi: ${nabroj(glavni)}.` : ""
  } Deo se bira po kataloškom broju utisnutom na samom komadu ili po oznaci pluga; ako broj nije čitljiv, dovoljna je fotografija.`;
}

function pitanjaZaBrend(brendLabel: string, ukupno: number) {
  return [
    {
      q: `Kako da znam koji deo za ${brendLabel} mi treba?`,
      a: `Najsigurnije je po kataloškom broju koji je utisnut na samom delu. Ako je izlizan, pošaljite nam oznaku pluga (npr. sa pločice na ramu) i fotografiju dela — po tome ga prepoznajemo i potvrđujemo pre slanja.`,
    },
    {
      q: `Da li su delovi za ${brendLabel} originalni?`,
      a: `Radimo sa proverenim dobavljačima potrošnih delova. Za svaki broj vam pre porudžbine kažemo da li je original ili zamenski deo, i koja je razlika u ceni i veku trajanja — odluka je vaša.`,
    },
    {
      q: "Da li imate deo na stanju i koliko traje isporuka?",
      a: `Deo asortimana je na lageru i šalje se odmah, ostalo ide po porudžbini. Javite kataloški broj i istog dana dobijate cenu, stanje i rok. Isporučujemo širom Srbije i u region.`,
    },
    {
      q: `Koliko delova za ${brendLabel} imate u ponudi?`,
      a: `Trenutno ${katBrojeva(ukupno)} samo za tu marku, a ukupan katalog potrošnih delova za plugove je preko 4.600 stavki. Ako broj koji tražite nije na spisku, pozovite — katalog je širi od onoga što je prikazano.`,
    },
  ];
}

export function generateStaticParams() {
  return partBrands().map((b) => ({ brend: b.key }));
}

export function generateMetadata({ params }: { params: { brend: string } }): Metadata {
  const brend = nadji(params.brend);
  if (!brend) return {};

  const tipovi = partTypesForBrand(brend.key);
  const glavni = tipovi.slice(0, 4).map((t) => t.label.toLowerCase());

  return {
    // Naslov je namerno u obliku u kojem se i pretražuje („delovi za Lemken").
    title: `Delovi za plugove ${brend.label} — ${katBrojeva(brend.count)}`,
    description: `Rezervni delovi za plugove ${brend.label}: ${nabroj(glavni)}. ${katBrojeva(brend.count)} na stanju ili po porudžbini. Pošaljite kataloški broj ili oznaku pluga — cena i rok isporuke isti dan. PlugekS, Žabalj.`,
    alternates: { canonical: `/delovi/brend/${brend.key}` },
    keywords: [
      `delovi za ${brend.label}`,
      `deo za ${brend.label}`,
      `${brend.label} delovi`,
      `rezervni delovi ${brend.label}`,
      `delovi za plug ${brend.label}`,
      ...tipovi.slice(0, 5).map((t) => `${t.label} za ${brend.label}`),
      "rezervni delovi za plugove",
    ],
    openGraph: {
      type: "website",
      url: `https://plugeks.com/delovi/brend/${brend.key}`,
      title: `Delovi za plugove ${brend.label} | PlugekS`,
      description: `${katBrojeva(brend.count)} potrošnih delova za plugove ${brend.label}. Cena i rok isporuke isti dan.`,
    },
  };
}

export default function BrendPage({ params }: { params: { brend: string } }) {
  const brend = nadji(params.brend);
  if (!brend) notFound();

  const svi = getPartsByBrand(brend.key);
  const prikazani = svi.slice(0, MAX_NA_STRANI);
  const ostali = svi.length - prikazani.length;
  const tipovi = partTypesForBrand(brend.key);
  const tekst = uvod(brend.label, brend.count, tipovi);
  const pitanja = pitanjaZaBrend(brend.label, brend.count);

  return (
    <>
      <PutanjaJsonLd
        stavke={[
          { naziv: "Proizvodi", href: "/proizvodi" },
          { naziv: `Delovi za plugove ${brend.label}`, href: `/delovi/brend/${brend.key}` },
        ]}
      />
      <SpisakJsonLd
        naziv={`Rezervni delovi za plugove ${brend.label}`}
        opis={tekst}
        stavke={prikazani}
        ukupno={svi.length}
      />
      <PitanjaJsonLd pitanja={pitanja} />

      <section className="section bg-cream pt-28 md:pt-32">
        <div className="container">
          <h1 className="font-display text-2xl font-bold text-charcoal md:text-3xl">
            Delovi za plugove {brend.label}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
            {tekst}
          </p>

          {/* Tipovi delova baš za ovu marku — i orijentir kupcu i unutrašnji
              linkovi ka stranicama tipa, koje nose druge pretrage. */}
          {tipovi.length > 0 ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {tipovi.slice(0, 12).map((t) => (
                <Link
                  key={t.key}
                  // Ukrštena strana kad postoji — „Raonik" na strani Lemken-a vodi
                  // na „Raonik za plugove Lemken", a ne na raonike svih marki.
                  href={ukrstenaHref(t.key, brend.key) ?? `/delovi/${t.key}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-sm text-foreground/85 transition-colors hover:border-brand/40 hover:text-brand"
                >
                  {t.label}
                  <span className="text-xs text-muted-foreground">{t.count}</span>
                </Link>
              ))}
            </div>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="primary" size="md">
              <Link href={`/zatrazi-ponudu?proizvod=${encodeURIComponent(`Delovi za plug ${brend.label}`)}`}>
                Pošalji kataloški broj
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="md">
              <a href={site.telHref}>
                <Phone className="h-4 w-4" />
                {site.phoneDisplay}
              </a>
            </Button>
          </div>

          <div className="mt-10">
            <h2 className="text-sm font-semibold text-charcoal">
              Svi kataloški brojevi za plugove {brend.label}
            </h2>
            <div className="mt-4">
              <ListaProizvoda items={prikazani} />
            </div>
          </div>

          {ostali > 0 && (
            <p className="mt-10 border-t border-border pt-6 text-sm text-muted-foreground">
              Prikazano prvih {prikazani.length} od {svi.length}. Ostatak je u{" "}
              <Link href="/katalog/1" className="font-medium text-brand hover:underline">
                kompletnom katalogu
              </Link>
              .
            </p>
          )}

          <Pitanja pitanja={pitanja} />

          <nav className="mt-12 border-t border-border pt-6">
            <p className="text-sm font-semibold text-charcoal">Delovi po tipu</p>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {partTypes().map((t) => (
                <li key={t.key}>
                  <Link href={`/delovi/${t.key}`} className="text-brand hover:underline">
                    {t.label}
                  </Link>
                </li>
              ))}
            </ul>

            <p className="mt-8 text-sm font-semibold text-charcoal">Ostale marke</p>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {partBrands()
                .filter((b) => b.key !== brend.key)
                .map((b) => (
                  <li key={b.key}>
                    <Link href={`/delovi/brend/${b.key}`} className="text-brand hover:underline">
                      {b.label} <span className="text-muted-foreground">({b.count})</span>
                    </Link>
                  </li>
                ))}
            </ul>
          </nav>
        </div>
      </section>

      <KontaktCTA />
    </>
  );
}
